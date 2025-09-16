import fs from "fs/promises";
import FileService from "../src/services/fileService.js";
import LocalStorage from "../src/services/storageProviders/localStorage.js";
import { jest } from "@jest/globals";

// Mock LocalStorage
jest.mock("../src/services/storageProviders/localStorage.js");

// Mock fs/promises
jest.mock("fs/promises");

describe("FileService Unit Tests", () => {
  let fileService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LocalStorage methods
    LocalStorage.mockImplementation(() => ({
      saveFileBuffer: jest.fn(async (publicKey, buffer) => ({
        path: `/mock/path/${publicKey}`,
      })),
      readFileBuffer: jest.fn(async (path) => Buffer.from("mock data")),
      deleteFile: jest.fn(async (path) => true),
    }));

    fileService = new FileService();
  });

  it("should save a file and create metadata", async () => {
    const buffer = Buffer.from("test file content");
    const originalName = "test.txt";
    const mimetype = "text/plain";

    fs.writeFile.mockResolvedValueOnce(); // mock fs write
    fs.mkdir.mockResolvedValueOnce(); // mock fs mkdir

    const { publicKey, privateKey } = await fileService.saveFile(
      buffer,
      originalName,
      mimetype
    );

    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();

    expect(fileService.meta[publicKey]).toMatchObject({
      publicKey,
      privateKey,
      mimetype,
      originalName,
      size: buffer.length,
    });

    expect(fileService.storage.saveFileBuffer).toHaveBeenCalledWith(
      publicKey,
      buffer
    );

    expect(fs.writeFile).toHaveBeenCalled(); // metadata saved
  });

  it("should get file by publicKey", async () => {
    const buffer = Buffer.from("hello");
    fileService.meta["123"] = {
      publicKey: "123",
      privateKey: "abc",
      path: "/mock/path/123",
      mimetype: "text/plain",
      originalName: "hello.txt",
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
    };

    const result = await fileService.getFile("123");

    expect(result).toMatchObject({
      mimetype: "text/plain",
      originalName: "hello.txt",
      size: buffer.length,
    });

    expect(fileService.storage.readFileBuffer).toHaveBeenCalledWith(
      "/mock/path/123"
    );
    expect(fs.writeFile).toHaveBeenCalled(); // metadata updated with lastAccess
  });

  it("should return null if publicKey does not exist", async () => {
    const result = await fileService.getFile("nonexistent");
    expect(result).toBeNull();
  });

  it("should delete file by privateKey", async () => {
    const buffer = Buffer.from("hello");
    fileService.meta["123"] = {
      publicKey: "123",
      privateKey: "abc",
      path: "/mock/path/123",
      mimetype: "text/plain",
      originalName: "hello.txt",
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
    };

    fs.writeFile.mockResolvedValueOnce(); // mock metadata save

    const deleted = await fileService.deleteFile("abc");

    expect(deleted).toBe(true);
    expect(fileService.storage.deleteFile).toHaveBeenCalledWith(
      "/mock/path/123"
    );
    expect(fileService.meta["123"]).toBeUndefined();
    expect(fs.writeFile).toHaveBeenCalled(); // metadata updated
  });

  it("should return false if privateKey does not exist", async () => {
    const result = await fileService.deleteFile("nonexistent");
    expect(result).toBe(false);
  });
});
