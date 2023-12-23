// modules/video.js
const { Markup } = require("telegraf");
const https = require("https");
const { BlobServiceClient } = require("@azure/storage-blob");
const mongoose = require("mongoose");

let Video = require("../models/video"); // Usa let en lugar de const

module.exports = (bot, mensajesGuardados, containerClient) => {
  // Manejador de video
  bot.on("video", async (ctx) => {
    const video = ctx.message.video;
    const userId = ctx.from.id;

    const blobName = `${userId}_${Date.now()}_${video.file_id}.mp4`;

    const blobClient = containerClient.getBlockBlobClient(blobName);

    const fileLink = await ctx.telegram.getFileLink(video.file_id);
    const fileBuffer = await downloadFile(fileLink);

    await blobClient.uploadData(fileBuffer);

    const videoUrl = blobClient.url;

    ctx.reply(
      "Video cargado. ¿Quieres guardarlo en la base de datos?",
      Markup.inlineKeyboard([
        Markup.button.callback("Sí", "guardar_video_si"),
        Markup.button.callback("No", "guardar_video_no"),
      ])
    );

    // Guardar temporalmente la información para el usuario actual
    mensajesGuardados.push({ userId, videoUrl });
  });

  // Manejador de callback para la respuesta sobre guardar el video en la base de datos
  bot.action("guardar_video_si", async (ctx) => {
    const userId = ctx.from.id;
    const usuarioActual = mensajesGuardados.find(
      (usuario) => usuario.userId === userId
    );

    if (usuarioActual) {
      // Guardar en la base de datos
      Video = require("../models/video"); // Intenta eliminar el modelo del caché
      if (mongoose.connection && mongoose.connection.models[Video.modelName]) {
        delete mongoose.connection.models[Video.modelName];
      }

      // Luego, vuelve a cargar el modelo
      Video = require("../models/video");

      const videoGuardado = new Video({
        videoUrl: usuarioActual.videoUrl,
        titulo: `Video_${userId}_${Date.now()}`,
      });
      await videoGuardado.save();

      mensajesGuardados = mensajesGuardados.filter(
        (usuario) => usuario.userId !== userId
      );

      ctx.reply("Video guardado correctamente en la base de datos");
    } else {
      ctx.reply(
        "Ocurrió un error al intentar guardar el video en la base de datos"
      );
    }
  });

  bot.action("guardar_video_no", (ctx) => {
    ctx.reply("El video no se guardará en la base de datos");
    // Puedes agregar más acciones o respuestas según lo que necesites
  });
};

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
