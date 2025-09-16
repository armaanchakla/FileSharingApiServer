import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const directory = path.join(process.cwd(), process.env.FOLDER || "uploads");
const usagePath = path.join(
  directory,
  process.env.USAGE_STORE_FILE || ".usagestore.json"
);

let store = { date: new Date().toISOString().slice(0, 10), clients: {} };

function getUsage(ip) {
  resetIfNeeded();

  if (!store.clients[ip]) {
    store.clients[ip] = { uploaded: 0, downloaded: 0 };
  }

  return store.clients[ip];
}

async function addUsage(ip, type, bytes) {
  const client = getUsage(ip);

  if (type === "upload") {
    client.uploaded += bytes;
  } else if (type === "download") {
    client.downloaded += bytes;
  }

  await saveStore();
}

function resetIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);

  if (store.date !== today) {
    store = { date: today, clients: {} };
    saveStore();
  }
}

async function saveStore() {
  try {
    await fs.mkdir(path.dirname(usagePath), { recursive: true });
    await fs.writeFile(usagePath, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {
    console.error("failed to save usage store: ", e);
  }
}

async function loadStore() {
  try {
    const txt = await fs.readFile(usagePath, "utf8");
    store = JSON.parse(txt);
  } catch {
    await saveStore();
  }
}

export default {
  loadStore,
  getUsage,
  addUsage,
};
