// bot.js
const { Telegraf, Markup } = require("telegraf");
const mongoose = require("mongoose");
const https = require("https");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const {
  MONGODB_URI,
  TELEGRAM_API_TOKEN,
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_CONTAINER_DEVOCIONAL,
  AZURE_STORAGE_CONTAINER_VIDEO,
} = process.env;

mongoose.connect(MONGODB_URI, {
  useUnifiedTopology: true,
});

const devocionalSchema = new mongoose.Schema({
  fotoUrl: String,
  mensaje: String,
  titulo: String,
  fecha: { type: Date, default: Date.now },
});

// Importa el modelo de video directamente
const Video = require("./models/video");

const connectionString = AZURE_STORAGE_CONNECTION_STRING;

const containerClientDevocional = BlobServiceClient.fromConnectionString(
  connectionString
).getContainerClient(AZURE_STORAGE_CONTAINER_DEVOCIONAL);

const containerClientVideo = BlobServiceClient.fromConnectionString(
  connectionString
).getContainerClient(AZURE_STORAGE_CONTAINER_VIDEO);

const bot = new Telegraf(TELEGRAM_API_TOKEN);

let mensajesGuardados = [];

// Importar módulos
const welcomeModule = require("./modules/welcome");
const devotionalModule = require("./modules/devotional");
const videoModule = require("./modules/video");

// Usar módulos
welcomeModule(bot);
devotionalModule(bot, mensajesGuardados, containerClientDevocional);
videoModule(bot, mensajesGuardados, containerClientVideo);

// Iniciar el bot
bot.launch();
