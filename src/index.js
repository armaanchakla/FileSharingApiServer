import dotenv from "dotenv";
import http from "http";
import app from "./app.js";

dotenv.config();

const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`File Sharing Api Server: listening on port ${port}`);
});

export default server;
