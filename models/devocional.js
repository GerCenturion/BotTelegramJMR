// models/devocional.js
const mongoose = require("mongoose");

let Devocional;

if (mongoose.models && mongoose.models.Devocional) {
  // El modelo ya está definido, úsalo
  Devocional = mongoose.models.Devocional;
} else {
  // El modelo no está definido, créalo
  const devocionalSchema = new mongoose.Schema({
    fotoUrl: String,
    mensaje: String,
    titulo: String,
    fecha: { type: Date, default: Date.now },
  });

  Devocional = mongoose.model("Devocional", devocionalSchema);
}

module.exports = Devocional;
