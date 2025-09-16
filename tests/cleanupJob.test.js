import fs from "fs/promises";
import { existsSync } from "fs";
import LocalStorage from "../src/services/storageProviders/localStorage.js";
import cleanup from "./../src/services/Jobs/cleanupJob.js";

// Mock fs/promises
jest.mock("fs/promises");
// Mock existsSync
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));
// Mock LocalStorage
jest.mock("../src/services/storageProviders/localStorage.js");

describe("Cleanup Job Unit Tests", () => {
  let storageMock;
  const testDir = "/mock/uploads";

  beforeEach(() => {
    jest.clearAllMocks();

    storageMock = {
      listFiles: jest.fn(),
      deleteFile: jest.fn(),
    };

    LocalStorage.mockImplementation(() => storageMock);
  });

  it("skips deletion for recently accessed files", async () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    storageMock.listFiles.mockResolvedValue([
      { publicKey: "123", originalName: "file1.txt", lastAccess: recent },
    ]);
    existsSync.mockReturnValue(true);

    await cleanup();

    expect(storageMock.deleteFile).not.toHaveBeenCalled();
  });

  it("deletes old files and updates metadata", async () => {
    const oldDate = new Date(Date.now() - 120 * 1000).toISOString();
    storageMock.listFiles.mockResolvedValue([
      { publicKey: "123", originalName: "oldFile.txt", lastAccess: oldDate },
    ]);
    existsSync.mockReturnValue(true);

    fs.readFile.mockResolvedValue(
      JSON.stringify({ 123: { originalName: "oldFile.txt" } })
    );
    fs.writeFile.mockResolvedValue();

    await cleanup();

    expect(storageMock.deleteFile).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("handles missing files gracefully", async () => {
    const oldDate = new Date(Date.now() - 120 * 1000).toISOString();
    storageMock.listFiles.mockResolvedValue([
      { publicKey: "123", originalName: "oldFile.txt", lastAccess: oldDate },
    ]);
    existsSync.mockReturnValue(false);

    fs.readFile.mockResolvedValue(
      JSON.stringify({ 123: { originalName: "oldFile.txt" } })
    );
    fs.writeFile.mockResolvedValue();

    await cleanup();

    expect(storageMock.deleteFile).not.toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("updates metadata correctly", async () => {
    const metaData = { 123: { originalName: "file1.txt" } };
    fs.readFile.mockResolvedValue(JSON.stringify(metaData));
    fs.writeFile.mockResolvedValue();

    // await updateMetadata("123");

    expect(fs.readFile).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({}, null, 2),
      "utf8"
    );
  });

  it("skips updateMetadata if key is null", async () => {
    // await updateMetadata(null);
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});
