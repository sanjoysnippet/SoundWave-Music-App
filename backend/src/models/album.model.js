const mongoose = require("mongoose");
const albumSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  artist: { type: String, required: true, trim: true },
  coverUrl: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("Album", albumSchema);
