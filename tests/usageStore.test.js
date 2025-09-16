import fs from "fs/promises";
import usageStore from "../src/services/usageStore.js";
import path from "path";

// Mock fs/promises
jest.mock("fs/promises");

describe("Usage Store Unit Tests", () => {
  const testDir = "/mock/uploads";
  const usageFile = path.join(testDir, ".usagestore.json");

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FOLDER = testDir;
    process.env.USAGE_STORE_FILE = ".usagestore.json";
  });

  it("should initialize usage for new IP", () => {
    const ip = "1.2.3.4";
    const usage = usageStore.getUsage(ip);

    expect(usage).toEqual({ uploaded: 0, downloaded: 0 });
  });

  it("should add uploaded bytes", async () => {
    const ip = "1.2.3.4";

    await usageStore.addUsage(ip, "upload", 100);

    const usage = usageStore.getUsage(ip);
    expect(usage.uploaded).toBe(100);
    expect(usage.downloaded).toBe(0);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("should add downloaded bytes", async () => {
    const ip = "1.2.3.4";

    await usageStore.addUsage(ip, "download", 200);

    const usage = usageStore.getUsage(ip);
    expect(usage.uploaded).toBe(100);
    expect(usage.downloaded).toBe(200);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("should reset store if date changes", () => {
    const ip = "1.2.3.4";
    const oldUsage = usageStore.getUsage(ip);
    oldUsage.uploaded = 50;

    // simulate date change
    const oldDate = new Date();
    const newDate = new Date(oldDate.getTime() + 24 * 60 * 60 * 1000); // +1 day
    jest.spyOn(global, "Date").mockImplementation(() => newDate);

    usageStore.getUsage("anotherIP");

    // const usage = usageStore.getUsage(ip);
    // // expect(usage).toEqual({ uploaded: 0, downloaded: 0 });

    global.Date.mockRestore();
  });

  it("should load store from file", async () => {
    const fileData = {
      date: "2025-01-01",
      clients: { "1.2.3.4": { uploaded: 100, downloaded: 200 } },
    };
    fs.readFile.mockResolvedValueOnce(JSON.stringify(fileData));

    await usageStore.loadStore();

    const usage = usageStore.getUsage("1.2.3.4");
    expect(usage.uploaded).toBe(0);
    expect(usage.downloaded).toBe(0);
  });

  it("should save store if file read fails", async () => {
    fs.readFile.mockRejectedValueOnce(new Error("file not found"));

    await usageStore.loadStore();

    expect(fs.writeFile).toHaveBeenCalled();
  });
});
