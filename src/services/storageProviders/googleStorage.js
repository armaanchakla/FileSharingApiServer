/* CAN'T CREATE BUCKET AS THIS IS A PAID SERVICE FROM GOOGLE */

import { Storage } from "@google-cloud/storage";

class GoogleStorage {
  constructor(config) {
    this.bucketName = config.bucketName;
    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
    });
    this.bucket = this.storage.bucket(this.bucketName);
    this.metaFile = config.metaFile || ".metadata.json";
    this.meta = {};
    this.initMeta();
  }

  async initMeta() {
    try {
      const file = this.bucket.file(this.metaFile);
      const [exists] = await file.exists();
      if (!exists) {
        await file.save(JSON.stringify({}));
      }
      const [contents] = await file.download();
      this.meta = JSON.parse(contents.toString() || "{}");
    } catch (e) {
      console.error("Failed to load GCS metadata: ", e);
      this.meta = {};
    }
  }

  async saveMeta() {
    try {
      const file = this.bucket.file(this.metaFile);
      await file.save(JSON.stringify(this.meta, null, 2));
    } catch (e) {
      console.error("Failed to save GCS metadata: ", e);
    }
  }

  async saveFileBuffer(
    publicKey,
    buffer,
    originalName = "file",
    mimetype = "application/octet-stream"
  ) {
    try {
      const file = this.bucket.file(publicKey);
      await file.save(buffer);

      // Update metadata
      this.meta[publicKey] = {
        publicKey,
        path: publicKey,
        originalName,
        size: buffer.length,
        lastAccess: new Date().toISOString(),
        mimetype,
      };
      await this.saveMeta();

      return { path: publicKey };
    } catch (e) {
      console.error("Failed to upload file to GCS: ", e);
      throw e;
    }
  }

  async readFileBuffer(publicKey) {
    try {
      const file = this.bucket.file(publicKey);
      const [contents] = await file.download();

      // update lastAccess
      if (this.meta[publicKey]) {
        this.meta[publicKey].lastAccess = new Date().toISOString();
        await this.saveMeta();
      }

      return contents;
    } catch (e) {
      console.error("Failed to read file from GCS: ", e);
      throw e;
    }
  }

  async deleteFile(publicKey) {
    try {
      const file = this.bucket.file(publicKey);
      await file.delete();

      if (this.meta[publicKey]) {
        delete this.meta[publicKey];
        await this.saveMeta();
      }
    } catch (e) {
      console.error("Failed to delete file from GCS: ", e);
      throw e;
    }
  }

  async listFiles() {
    try {
      return Object.values(this.meta);
    } catch (e) {
      console.error("Failed to list files from GCS: ", e);
      return [];
    }
  }
}

export default GoogleStorage;
