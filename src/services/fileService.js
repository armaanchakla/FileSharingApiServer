import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import LocalStorage from "./storageProviders/localStorage.js";

class FileService {
  constructor() {
    dotenv.config();

    const directory = path.join(process.cwd(), process.env.FOLDER);

    this.storage = new LocalStorage(directory);
    this.metaFile = path.join(directory, process.env.META_DATA_FILE);
    this.meta = {};

    // load existing metadata
    this.loadMeta();
  }

  async saveFile(buffer, originalName, mimetype) {
    const publicKey = uuidv4();
    const privateKey = uuidv4();

    const saved = await this.storage.saveFileBuffer(publicKey, buffer);

    this.meta[publicKey] = {
      privateKey,
      path: saved.path,
      mimetype: mimetype,
      originalName,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
    };

    // console.log(this.meta);

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
      console.error("Failed to save metadata: ", e);
    }
  }

  async getFile(publicKey) {
    const downloadableFileName = this.meta[publicKey];

    if (!downloadableFileName) return null;

    try {
      const buffer = await this.storage.readFileBuffer(
        downloadableFileName.path
      );

      // update last access time
      downloadableFileName.lastAccess = new Date().toISOString();
      await this.saveMeta();

      return {
        buffer,
        mimetype: downloadableFileName.mimetype,
        originalName: downloadableFileName.originalName,
        size: downloadableFileName.size,
      };
    } catch (e) {
      console.error("Failed to get downloadable file: ", e);
      return null;
    }
  }

  async loadMeta() {
    try {
      const metaContent = await fs.readFile(this.metaFile, "utf8");
      this.meta = JSON.parse(metaContent || "{}");
    } catch (e) {
      console.error("Failed to load metadata: ", e);
      this.meta = {};
    }
  }

  async deleteFile(privateKey) {
    const publicKey = Object.keys(this.meta).find(
      (key) => this.meta[key].privateKey === privateKey
    );

    if (!publicKey) return false;

    const deletableFileName = this.meta[publicKey];

    try {
      await this.storage.deleteFile(deletableFileName.path);
    } catch (e) {
      console.error("Failed to delete file: ", e);
    }

    // remove file details from metadata and update metadata
    delete this.meta[publicKey];
    await this.saveMeta();

    return true;
  }
}

export default FileService;
