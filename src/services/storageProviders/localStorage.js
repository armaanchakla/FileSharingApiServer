import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

class LocalStorage {
  constructor(directory) {
    this.directory = directory;

    if (!existsSync(directory)) {
      fs.mkdir(directory, { recursive: true }).catch(() => {});
    }
  }

  async saveFileBuffer(publicKey, buffer, { originalName }) {
    const dir = path.join(this.directory, "files");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${publicKey}`;
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);
    return { path: filepath };
  }
}

export default LocalStorage;
