const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_PRICETRACKER_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let telegram = {};

telegram.scrapped = async (title, price, URL, discountPrice) => {
  try {
    let droppedPrice = discountPrice - price;
    let message = `<strong>Price Dropped by ${droppedPrice}</strong>\r\n<pre>${title}</pre>\r\n\n<a href="${URL}">View Product</a>`;
    await bot.sendMessage(process.env.TELEGRAM_PRICETRACKER_GROUP_CHAT_ID, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log(error.message);
  }
};

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  console.log(msg);
  if (msg.new_chat_members) {
    msg.new_chat_members.forEach((data) => {
      bot.sendMessage(chatId, `Welcome to PriceTracker ${data.first_name}`);
    });
  }
});

module.exports = telegram;
