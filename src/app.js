import express from "express";
import multer from "multer";
import FileService from "./services/fileService.js";
import limiter from "./services/limiter.js";

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const fileService = new FileService();

// root
app.get("/", (req, res) => {
  try {
    res.sendFile("views/index.html", { root: process.cwd() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// upload
app.post(
  "/files",
  limiter.uploadLimitMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Please upload a file." });

      const result = await fileService.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // update usage store now that we know actual bytes
      await limiter.recordUpload(req.ip, req.file.buffer.length);

      res.json({ publicKey: result.publicKey, privateKey: result.privateKey });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// download
app.get(
  "/files/:publicKey",
  limiter.downloadLimitMiddleware,
  async (req, res) => {
    try {
      const { publicKey } = req.params;

      if (!publicKey)
        return res.status(400).json({ error: "Missing publicKey" });

      const file = await fileService.getFile(publicKey);

      if (!file) return res.status(404).json({ error: "File not found" });

      res.setHeader(
        "Content-Type",
        file.mimetype || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalName || "file"}"`
      );

      res.send(file.buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// delete
app.delete("/files/:privateKey", async (req, res) => {
  try {
    const { privateKey } = req.params;

    if (!privateKey)
      return res.status(400).json({ error: "Missing privateKey" });

    const isDeleted = await fileService.deleteFile(privateKey);

    if (!isDeleted)
      return res.status(404).json({ error: "File not found or wrong key" });

    res.json({ success: true, message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
