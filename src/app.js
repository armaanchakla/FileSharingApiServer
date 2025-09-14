import express from "express";

const app = express();
app.use(express.json());

// upload
app.post("/files", async (req, res) => {
  try {
    console.log(req);

    const publicKey = "sadsadsadsadasdddddddddddddddddddddddddsadsadasd";
    const privateKey = "dsadsadsadsadsadsadsadsad";

    res.json({ publicKey: publicKey, privateKey: privateKey });
  } catch (err) {
    console.error(err);
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
