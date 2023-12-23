// models/video.js
const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  videoUrl: String,
  titulo: String,
  fecha: { type: Date, default: Date.now },
});

// Exportamos directamente el modelo
module.exports = mongoose.model("Video", videoSchema);
