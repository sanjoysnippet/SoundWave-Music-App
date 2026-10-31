const mongoose = require("mongoose");
const musicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  artist: { type: String, required: true, trim: true },
  audioUrl: { type: String, required: true },
  coverUrl: { type: String, default: "" },
  album: { type: mongoose.Schema.Types.ObjectId, ref: "Album", default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });
module.exports = mongoose.model("Music", musicSchema);
