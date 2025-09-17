import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

class LocalStorage {
  constructor(directory) {
    this.directory = directory;
    this.metaDir = path.join(directory, "files");

    if (!existsSync(directory)) {
      fs.mkdir(directory, { recursive: true }).catch((e) => {
        console.error("Failed to create LocalStorage directory: ", e);
      });
    }
  }

  async saveFileBuffer(publicKey, buffer) {
    try {
      const dir = path.join(this.directory, "files");

      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }

      const filename = `${publicKey}`;
      const filepath = path.join(dir, filename);

      await fs.writeFile(filepath, buffer);

      return { path: filepath };
    } catch (e) {
      console.error("Failed to save file: ", e);
    }
  }

  async readFileBuffer(filepath) {
    try {
      return await fs.readFile(filepath);
    } catch (e) {
      console.error("Failed to read file: ", e);
    }
  }

  async deleteFile(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (e) {
      console.error("Failed to delete file: ", e);
    }
  }

  async listFiles() {
    try {
      const metaPath = path.join(
        this.directory,
        process.env.META_DATA_FILE || ".metadata.json"
      );

      if (!existsSync(metaPath)) {
        await fs.mkdir(metaPath, { recursive: true });
      }

      const txt = await fs.readFile(metaPath, "utf8");
      const data = JSON.parse(txt);

      return Object.values(data);
    } catch (e) {
      console.error("Failed to list files:", e);
      return [];
    }
  }
}

export default LocalStorage;
