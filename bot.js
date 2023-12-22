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

// Manejador de /start para mostrar un mensaje de bienvenida y botones
bot.start((ctx) => {
  const welcomeMessage = "¡Bienvenido a este bot! ¿Cómo puedo ayudarte hoy?";
  ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Devocional", callback_data: "devocional" },
          { text: "Video", callback_data: "video" },
          { text: "Notificaciones", callback_data: "notificaciones" },
        ],
      ],
    },
  });
});

// Manejador de botones
bot.action("devocional", (ctx) => {
  // Puedes colocar aquí el código para iniciar el proceso de devocional
  ctx.reply(
    "¡Perfecto! Por favor, envía una foto para el devocional.",
    Markup.inlineKeyboard([Markup.button.callback("Cancelar", "cancelar")])
  );

  // Limpiar mensajes guardados al iniciar un nuevo devocional
  mensajesGuardados = [];
});

bot.action("video", (ctx) => {
  // Mensaje indicando que la funcionalidad de video aún no está implementada
  ctx.reply(
    "Funcionalidad de video aún no implementada. Pronto estará disponible."
  );
});

bot.action("notificaciones", (ctx) => {
  // Mensaje indicando que la funcionalidad de notificaciones aún no está implementada
  ctx.reply(
    "Funcionalidad de notificaciones aún no implementada. Pronto estará disponible."
  );
});

// Manejador de foto
bot.on("photo", async (ctx) => {
  const photo = ctx.message.photo[0];
  const userId = ctx.from.id;

  const blobName = `${userId}_${Date.now()}_${photo.file_id}.jpg`;

  const blobClient = containerClient.getBlockBlobClient(blobName);

  const fileLink = await ctx.telegram.getFileLink(photo.file_id);
  const fileBuffer = await downloadFile(fileLink);

  await blobClient.uploadData(fileBuffer);

  const fotoUrl = blobClient.url;

  ctx.reply(
    "Foto cargada. Ahora, por favor, envía el mensaje para el devocional",
    Markup.inlineKeyboard([Markup.button.callback("Cancelar", "cancelar")])
  );

  // Guardar temporalmente la información para el usuario actual
  mensajesGuardados.push({ userId, fotoUrl });
});

// Manejador de confirmar/cancelar antes de subir a la base de datos
bot.action("confirmar", async (ctx) => {
  const userId = ctx.from.id;
  const usuarioActual = mensajesGuardados.find(
    (usuario) => usuario.userId === userId
  );

  if (usuarioActual && usuarioActual.fotoUrl) {
    ctx.reply(
      "¿Estás seguro de subir este devocional a la base de datos?",
      Markup.inlineKeyboard([
        Markup.button.callback("Sí", "publicar"),
        Markup.button.callback("No", "cancelar"),
      ])
    );
  } else {
    ctx.reply("Por favor, carga una foto para el devocional");
  }
});

// Manejador de /publicar para subir a la base de datos
bot.action("publicar", async (ctx) => {
  const userId = ctx.from.id;
  const usuarioActual = mensajesGuardados.find(
    (usuario) => usuario.userId === userId
  );

  if (usuarioActual && usuarioActual.fotoUrl) {
    const devocional = new Devocional({
      fotoUrl: usuarioActual.fotoUrl,
      mensaje: usuarioActual.mensaje,
      titulo: `Devocional_${userId}_${Date.now()}`,
    });

    await devocional.save();

    mensajesGuardados = mensajesGuardados.filter(
      (usuario) => usuario.userId !== userId
    );

    ctx.reply("Devocional publicado correctamente");
  } else {
    ctx.reply("Por favor, carga una foto para el devocional");
  }
});

// Manejador de cancelar
bot.action("cancelar", (ctx) => {
  ctx.reply("Operación cancelada");
  // Limpiar mensajes guardados en caso de cancelación
  mensajesGuardados = mensajesGuardados.filter(
    (usuario) => usuario.userId !== ctx.from.id
  );
});

// Manejador de texto
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const usuarioActual = mensajesGuardados.find(
    (usuario) => usuario.userId === userId
  );

  if (usuarioActual) {
    usuarioActual.mensaje = ctx.message.text;
    ctx.reply(
      "Mensaje guardado. Puedes confirmar o cancelar la operación.",
      Markup.inlineKeyboard([
        Markup.button.callback("Confirmar", "confirmar"),
        Markup.button.callback("Cancelar", "cancelar"),
      ])
    );
  } else {
    ctx.reply("Por favor, inicia un nuevo devocional con /devocional");
  }
});

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = [];
      response.on("data", (chunk) => {
        data.push(chunk);
      });
      response.on("end", () => {
        resolve(Buffer.concat(data));
      });
      response.on("error", (error) => {
        reject(error);
      });
    });
  });
}

bot.launch();
