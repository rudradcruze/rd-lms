import supertest from "supertest";
import app from "./app.js";
import { getToken } from "../tests/helpers/setup.js";

async function main() {
    const adminToken = await getToken("admin@rd-lms.com", "AdminPass123!");
    const res = await supertest(app)
        .get("/api/v1/courses?limit=100&status=DRAFT")
        .set("Authorization", `Bearer ${adminToken}`);
    
    console.log("Status:", res.status);
    console.log("Body:", JSON.stringify(res.body, null, 2));
}

main().catch(console.error);
