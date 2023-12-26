const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Devocional = require("./models/devocional");
const Video = require("./models/video");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Habilita CORS para todas las rutas
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware para configurar los encabezados CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/devocionales", async (req, res) => {
  try {
    const devocionales = await Devocional.find();
    res.json(devocionales);
  } catch (error) {
    console.error("Error al obtener los devocionales:", error);
    res.status(500).json({ error: "Error al obtener los devocionales" });
  }
});

app.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    console.error("Error al obtener los videos:", error);
    res.status(500).json({ error: "Error al obtener los videos" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
