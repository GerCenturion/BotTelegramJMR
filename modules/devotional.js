// modules/devotional.js
const Telegraf = require("telegraf");
const Markup = Telegraf.Markup;
const https = require("https");
const mongoose = require("mongoose");
let Devocional = require("../models/devocional"); // Usa let en lugar de const

module.exports = (bot, mensajesGuardados, containerClient) => {
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

  // Manejador de texto
  bot.on("text", async (ctx) => {
    const mensaje = ctx.message.text;
    const userId = ctx.from.id;
    const usuarioActual = mensajesGuardados.find(
      (usuario) => usuario.userId === userId
    );

    if (usuarioActual && usuarioActual.fotoUrl) {
      usuarioActual.mensaje = mensaje;

      // Intenta eliminar el modelo del caché
      if (
        mongoose.connection &&
        mongoose.connection.models[Devocional.modelName]
      ) {
        delete mongoose.connection.models[Devocional.modelName];
      }

      // Luego, vuelve a cargar el modelo
      Devocional = require("../models/devocional");

      // Pregunta si desea guardar en la base de datos
      await ctx.reply(
        "¿Deseas guardar este devocional en la base de datos?",
        Markup.inlineKeyboard([
          Markup.button.callback("Sí", "guardar_si"),
          Markup.button.callback("No", "guardar_no"),
        ])
      );
    } else {
      ctx.reply(
        "Por favor, carga una foto para el devocional",
        Markup.inlineKeyboard([Markup.button.callback("Cancelar", "cancelar")])
      );
    }
  });

  // Manejador de callback para la respuesta sobre guardar en la base de datos
  bot.action("guardar_si", async (ctx) => {
    const userId = ctx.from.id;
    const usuarioActual = mensajesGuardados.find(
      (usuario) => usuario.userId === userId
    );

    if (usuarioActual) {
      // Guardar en la base de datos
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
      ctx.reply("Ocurrió un error al intentar guardar en la base de datos");
    }
  });

  bot.action("guardar_no", (ctx) => {
    ctx.reply("El devocional no se guardará en la base de datos");
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
