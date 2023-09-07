import { performance } from "perf_hooks";
import supertest from "supertest";
const assert = require('assert')
import { buildApp } from "./app";

buildApp().then((response) => {
    const app = supertest(response);

    async function basicLatencyTest() {
        await app.post("/reset").expect(204);
        const start = performance.now();
        await app.post("/charge").expect(200);
        await app.post("/charge").expect(200);
        await app.post("/charge").expect(200);
        await app.post("/charge").expect(200);
        await app.post("/charge").expect(200);
        console.log(`Latency: ${performance.now() - start} ms`);
    }


    async function multipleCallsTest() {
       try {
        await app.post("/reset").expect(204);
        const start = performance.now();
        console.log('Doing calls at the same time')
        const promise = [app.post("/charge"),app.post("/charge")];
        const res = await Promise.allSettled(promise);
        res.forEach((v: any) => {
            console.log(v.value.body)
        })
        console.log(`Latency: ${performance.now() - start} ms`);
       }
       catch(e){
        console.log('nada paso aqui 3')
       }
    }

    async function runTests() {
        //await basicLatencyTest();
        await multipleCallsTest();
    }

    runTests().catch(console.error);
});