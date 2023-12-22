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
  AZURE_STORAGE_CONTAINER_NAME,
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

const Devocional = mongoose.model("Devocional", devocionalSchema);

const connectionString = AZURE_STORAGE_CONNECTION_STRING;
const containerName = AZURE_STORAGE_CONTAINER_NAME;

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

const bot = new Telegraf(TELEGRAM_API_TOKEN);

let mensajesGuardados = [];

// Importar módulos
const welcomeModule = require("./modules/welcome");
const devotionalModule = require("./modules/devotional");

// Usar módulos
welcomeModule(bot);
devotionalModule(bot, mensajesGuardados, containerClient); // Asegúrate de pasar containerClient aquí

// Iniciar el bot
bot.launch();
