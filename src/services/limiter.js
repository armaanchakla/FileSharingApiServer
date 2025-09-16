import usageStore from "./usageStore.js";

const uploadLimit = parseInt(process.env.UPLOAD_LIMIT_BYTES_PER_DAY, 10);
const downloadLimit = parseInt(process.env.DOWNLOAD_LIMIT_BYTES_PER_DAY, 10);

const limiter = {
  async uploadLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const usage = usageStore.getUsage(ip);
    const contentLength = req.headers["content-length"]
      ? parseInt(req.headers["content-length"], 10)
      : 0;

    // console.log(contentLength, usage.uploaded, uploadLimit);

    if (usage.uploaded + contentLength > uploadLimit) {
      return res
        .status(429)
        .json({ error: "Upload daily limit exceeded for this IP" });
    }

    next();
  },

  async downloadLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const usage = usageStore.getUsage(ip);

    const origSend = res.send.bind(res);

    res.send = async function (body) {
      const bytes = Buffer.isBuffer(body)
        ? body.length
        : Buffer.byteLength(String(body || ""), "utf8");

      if (usage.downloaded + bytes > downloadLimit) {
        return res
          .status(429)
          .json({ error: "Download daily limit exceeded for this IP" });
      }

      await usageStore.addUsage(ip, "download", bytes);

      return origSend(body);
    };
    next();
  },

  async recordUpload(ip, bytes) {
    await usageStore.addUsage(ip, "upload", bytes);
  },
};

usageStore.loadStore();

export default limiter;
