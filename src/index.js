import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import startCleanupJob from "./services/cleanupJob.js";

dotenv.config();

const port = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`File Sharing Api Server: listening on port ${port}`);
});

// cleanup job
startCleanupJob();

export default server;
