import express from "express";
import multer from "multer";
import FileService from "./services/fileService.js";

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const fileService = new FileService();

// root
app.get("/", (req, res) => {
  try {
    res.sendFile("views/index.html", { root: import.meta.dirname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// upload
app.post("/files", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file." });
    }

    const result = await fileService.saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({ publicKey: result.publicKey, privateKey: result.privateKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// download
app.get("/files/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;
    console.log(req);
    console.log(publicKey);

    res.json({ message: "file downloaded!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// delete
app.delete("/files/:privateKey", async (req, res) => {
  try {
    const { privateKey } = req.params;
    console.log(req);
    console.log(privateKey);

    res.json({ message: "file deleted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
