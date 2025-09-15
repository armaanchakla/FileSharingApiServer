import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import LocalStorage from "./storageProviders/localStorage.js";

class FileService {
  constructor() {
    dotenv.config();

    const projectRoot = process.cwd();
    const folderDir = process.env.FOLDER;

    if (!folderDir) {
      throw new Error("FOLDER environment variable is not set.");
    }

    const directory = path.join(projectRoot, process.env.FOLDER);

    this.storage = new LocalStorage(directory);
    this.metaFile = path.join(directory, ".metadata.json");
    this.meta = {};
  }

  async saveFile(buffer, originalName, mimetype) {
    const publicKey = uuidv4();
    const privateKey = uuidv4();
    const saved = await this.storage.saveFileBuffer(publicKey, buffer, {
      originalName,
      mimetype,
    });
    this.meta[publicKey] = {
      privateKey,
      path: saved.path,
      mimetype: mimetype,
      originalName,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
    };
    await this.saveMeta();
    return { publicKey, privateKey };
  }

  async saveMeta() {
    try {
      await fs.mkdir(path.dirname(this.metaFile), { recursive: true });
      await fs.writeFile(
        this.metaFile,
        JSON.stringify(this.meta, null, 2),
        "utf8"
      );
    } catch (e) {
      console.error("Failed to save metadata", e);
    }
  }
}

export default FileService;
