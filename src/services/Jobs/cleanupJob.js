import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import LocalStorage from "../storageProviders/localStorage.js";
import dotenv from "dotenv";
dotenv.config();

const directory = path.join(process.cwd(), process.env.FOLDER || "uploads");

const storage = new LocalStorage(directory);

const inactivityTime = parseInt(process.env.FILE_INACTIVITY_TIME || "60", 10);
const interval = parseInt(process.env.CLEANUP_INTERVAL || "10000", 10);

function nonModifiedTime(seconds) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

async function cleanup() {
  try {
    console.log(
      `[CleanupJob] Cleanup runs every ${
        interval / 1000
      }s, for files inactive over ${inactivityTime}s.`
    );

    const files = await storage.listFiles();
    const threshold = nonModifiedTime(inactivityTime);
    const folderPath = path.join(directory, "files");

    for (const file of files) {
      if (file.lastAccess && file.lastAccess < threshold) {
        const filePath = path.join(folderPath, file.publicKey);

        if (existsSync(filePath)) {
          await storage.deleteFile(filePath);
          console.log(`[CleanupJob] Removed file: ${file.originalName}`);
        } else {
          console.log(`[CleanupJob] Files are up to date. No files to remove.`);
        }

        await updateMetadata(file.publicKey);
      }
    }
  } catch (err) {
    console.error("[CleanupJob] Failed:", err);
  }
}

async function updateMetadata(keyToDelete) {
  if (keyToDelete == null) return;

  const metaPath = path.join(
    directory,
    process.env.META_DATA_FILE || ".metadata.json"
  );

  const data = await fs.readFile(metaPath, "utf8");
  const jsonData = JSON.parse(data);

  if (jsonData[keyToDelete]) {
    delete jsonData[keyToDelete];
  }

  await fs.writeFile(metaPath, JSON.stringify(jsonData, null, 2), "utf8");
}

function startCleanupJob() {
  console.log(`[CleanupJob] Started.`);
  setInterval(cleanup, interval);
}

export default startCleanupJob;
