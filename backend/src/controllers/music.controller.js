const fs = require("fs");
const path = require("path");
const Music = require("../models/music.model");
const Album = require("../models/album.model");

async function listMusic(_req, res, next) {
  try {
    const tracks = await Music.find().populate("album", "title artist coverUrl").sort({ createdAt: -1 }).lean();
    res.json({ tracks });
  } catch (error) { next(error); }
}

async function listAlbums(_req, res, next) {
  try {
    const albums = await Album.find().sort({ createdAt: -1 }).lean();
    res.json({ albums });
  } catch (error) { next(error); }
}

async function getAlbum(req, res, next) {
  try {
    const album = await Album.findById(req.params.albumId).lean();
    if (!album) return res.status(404).json({ message: "Album not found." });
    const tracks = await Music.find({ album: album._id }).sort({ createdAt: -1 }).lean();
    res.json({ album, tracks });
  } catch (error) { next(error); }
}

async function uploadMusic(req, res, next) {
  try {
    const { title, artist, albumId, coverUrl } = req.body;
    if (!title || !artist || !req.file) {
      return res.status(400).json({ message: "Title, artist and audio file are required." });
    }
    let album = null;
    if (albumId) album = await Album.findById(albumId);
    const track = await Music.create({
      title, artist,
      audioUrl: `/uploads/${req.file.filename}`,
      coverUrl: coverUrl || (album && album.coverUrl) || "",
      album: album ? album._id : null,
      uploadedBy: req.user._id
    });
    res.status(201).json({ message: "Track uploaded successfully", track });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(path.join(__dirname, "..", "..", "uploads", req.file.filename)); } catch (_) {}
    }
    next(error);
  }
}

async function createAlbum(req, res, next) {
  try {
    const { title, artist, coverUrl } = req.body;
    if (!title || !artist) return res.status(400).json({ message: "Album title and artist are required." });
    const album = await Album.create({ title, artist, coverUrl: coverUrl || "" });
    res.status(201).json({ message: "Album created successfully", album });
  } catch (error) { next(error); }
}

module.exports = { listMusic, listAlbums, getAlbum, uploadMusic, createAlbum };
