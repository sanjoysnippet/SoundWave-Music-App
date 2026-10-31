const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const requireAuth = require("../middleware/auth.middleware");
const controller = require("../controllers/music.controller");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) cb(null, true);
    else cb(new Error("Please upload an audio file."));
  }
});

router.get("/", controller.listMusic);
router.get("/albums", controller.listAlbums);
router.get("/albums/:albumId", controller.getAlbum);
router.post("/upload", requireAuth, upload.single("audio"), controller.uploadMusic);
router.post("/album", requireAuth, controller.createAlbum);
module.exports = router;
