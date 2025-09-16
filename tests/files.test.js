import request from "supertest";
import app from "../src/app.js";
import fs from "fs";
import path from "path";

// sample test file path
const testFilePath = path.join(process.cwd(), "sample-460KB.pdf");

describe("REST Api Integration Tests", () => {
  let publicKey;
  let privateKey;

  // cleanup test uploads after all tests
  afterAll(() => {
    // remove uploaded test files
    const uploadsDir = path.join(process.cwd(), "../uploads/files");

    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  // Test POST /files
  it("POST /files should upload a file", async () => {
    const response = await request(app)
      .post("/files")
      .attach("file", testFilePath);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("publicKey");
    expect(response.body).toHaveProperty("privateKey");

    publicKey = response.body.publicKey;
    privateKey = response.body.privateKey;
  });

  // Test GET /files/:publicKey
  it("GET /files/:publicKey should return file info", async () => {
    const response = await request(app).get(`/files/${publicKey}`);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBeDefined();
  });

  // Test DELETE /files/:privateKey
  it("DELETE /files/:privateKey should delete the file", async () => {
    const response = await request(app).delete(`/files/${privateKey}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
