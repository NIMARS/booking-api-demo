import { buildApp } from "./app.js";
import 'dotenv/config';

const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';

async function main() {
    const app = buildApp();
    await app.listen({port, host});
    app.log.info(`listening on http://${host}:${port}`);
}

main().catch((error)=>{
    console.error(error);
    process.exit(1);
})