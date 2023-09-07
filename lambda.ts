import serverlessExpress from "@vendia/serverless-express";
import { buildApp } from "./app";

buildApp()
.then((app) => {
    serverlessExpress({ app });
});

export const handler = async () => {
    const app = await buildApp();
    return serverlessExpress({ app });
}
