import { buildApp } from "./app";

buildApp()
.then((app) => {
    const port = parseInt(process.env.EXPRESS_PORT ?? "3000");
    app.listen(port, () => console.log(`Backend listening on port ${port}`));
})
