import express from "express";
import { createClient } from "redis";
import { json } from "body-parser";

const DEFAULT_BALANCE = 100;

interface ChargeResult {
    isAuthorized: boolean;
    remainingBalance: number;
    charges: number;
}

interface ChargeResultError {
    message: string;
}

let lockedAccounts: any  = {}

async function connect(): Promise<ReturnType<typeof createClient>> {
    const url = `redis://${process.env.REDIS_HOST ?? "localhost"}:${process.env.REDIS_PORT ?? "6379"}`;
    console.log(`Using redis URL ${url}`);
    const client = createClient({ url });
    await client.connect();
    return client;
}

async function reset(account: string): Promise<void> {
    await client.set(`${account}/balance`, DEFAULT_BALANCE);
    lockedAccounts[account] = 0;
}

async function isLocked(account: string) {
    const isLocked = lockedAccounts[account] === 1;
    if (isLocked) {
        throw new Error('Account is processing a balance, please try later');
    }
}

async function charge(account: string, charges: number): Promise<ChargeResult | ChargeResultError> {
    // first i would validate if the charges are positive
    if (charges < 0) {
        throw new Error('charges are negative! not allowed');
    }
    // then i should check if the account is locked
    isLocked(account);

    //if its not im going to lock it
    //lockedAccounts[account] = 1;

    // i would get the balance
    const balance = parseInt((await client.get(`${account}/balance`)) ?? "");

    // if balance is greater than the charges then i will update the balance
    let output = {
        isAuthorized: false,
        remainingBalance: balance,
        charges: 0
    }
    if (balance >= charges) {
        await client.set(`${account}/balance`, balance - charges);
        const remainingBalance = parseInt((await client.get(`${account}/balance`)) ?? "");
        output = { isAuthorized: true, remainingBalance, charges };
    }
    lockedAccounts[account] = 0;
    return output;

}

async function balance(account: string): Promise<any> {
    const balance = parseInt((await client.get(`${account}/balance`)) ?? "");
    return { remainingBalance: balance };
}

let client: ReturnType<typeof createClient>;
export async function buildApp(): Promise<express.Application> {
    const app = express();
    app.use(json());
    client = await connect();

    app.post("/reset", async (req, res) => {
        try {
            const account = req.body.account ?? "account";
            await reset(account);
            console.log(`Successfully reset account ${account}`);
            res.sendStatus(204);
        } catch (e) {
            console.error("Error while resetting account", e);
            res.status(500).json({ error: String(e) });
        }
    });
    app.post("/charge", async (req, res) => {
        try {
            const account = req.body.account ?? "account";
            const result = await charge(account, req.body.charges ?? 10);
            console.log(`Successfully charged account ${account}`);
            res.status(200).json(result);
        } catch (e) {
            console.error("Error while charging account", e);
            res.status(500).json({ error: String(e) });
        }
    });
    app.get("/balance/:account", async (req, res) => {
        try {
            const account = req.params.account ?? "account";
            const result = await balance(account);
            console.log(`Successfully got balance of account ${account}`);
            res.status(200).json(result);
        } catch (e) {
            console.error("Error while charging account", e);
            res.status(500).json({ error: String(e) });
        }
    });
    return app;
}
