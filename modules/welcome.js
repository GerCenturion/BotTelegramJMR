// modules/welcome.js
module.exports = (bot, mensajesGuardados) => {
  // Manejador de /start para mostrar un mensaje de bienvenida
  bot.start((ctx) => {
    const welcomeMessage = "¡Hola soy el asistente de contenidos! ¿Que vas a publicar?";
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

  // Manejador de opciones de bienvenida
  bot.action("devocional", (ctx) => {
    ctx.reply("¡Perfecto! Por favor, envía una foto para el devocional.", {
      reply_markup: {
        inline_keyboard: [[{ text: "Cancelar", callback_data: "cancelar" }]],
      },
    });

    // Limpiar mensajes guardados al iniciar un nuevo devocional
    mensajesGuardados = [];
  });

  bot.action("video", (ctx) => {
    ctx.reply(
      "¡Excelente! Por favor, envía el video para su procesamiento.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Cancelar", callback_data: "cancelar" }]],
        },
      }
    );

    // Limpiar mensajes guardados al iniciar un nuevo video
    mensajesGuardados = [];
  });

  bot.action("notificaciones", (ctx) => {
    ctx.reply(
      "Lo siento, la opción de notificaciones aún no está implementada."
    );
  });
};
