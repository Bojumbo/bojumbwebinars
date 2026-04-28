const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Конфігурація
const token = process.env.TELEGRAM_TOKEN;
const API_URL = (process.env.WEBSITE_URL || 'http://localhost:3000') + '/api/bot/generate';
const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
const SECRET_KEY = process.env.BOT_SECRET || 'dev-secret';

const bot = new TelegramBot(token, { polling: true });
const userState = new Map();

console.log('--- Бот для автовебінарів запущений ---');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') {
    bot.sendMessage(chatId, 'Привіт! 😊 Ласкаво просимо до нашої платформи.\n\nБудь ласка, напишіть ваше **Ім’я**:');
    userState.set(chatId, { step: 'awaiting_name' });
    return;
  }

  const state = userState.get(chatId);

  if (state?.step === 'awaiting_name') {
    const userName = text.trim();
    if (userName.length < 2) {
      bot.sendMessage(chatId, 'Будь ласка, введіть коректне ім’я.');
      return;
    }
    userState.set(chatId, { step: 'awaiting_contact', name: userName });
    bot.sendMessage(chatId, `Приємно познайомитись, ${userName}! 👋\n\nТепер напишіть ваш **номер телефону**, щоб ми могли надіслати вам код доступу:`);
    return;
  }

  if (state?.step === 'awaiting_contact') {
    const rawContact = text.trim();
    // Видаляємо все крім цифр
    const cleanedContact = rawContact.replace(/\D/g, '');
    
    // Перевірка: має бути 10 цифр (напр. 0961234567) або 12 цифр (напр. 380961234567)
    const isPhone = /^(38)?0\d{9}$/.test(cleanedContact);

    if (!isPhone) {
      bot.sendMessage(chatId, '❌ Некоректний формат.\n\nБудь ласка, введіть ваш номер телефону у форматі **0XXXXXXXXX** або **+380XXXXXXXXX**:');
      return;
    }

    // Приводимо до єдиного формату +380...
    const contact = cleanedContact.length === 10 ? '+38' + cleanedContact : '+' + cleanedContact;
    const userName = state.name;

    // Генеруємо код (наприклад, WEB-1234)
    const accessCode = 'WEB-' + Math.floor(1000 + Math.random() * 9000);

    try {
      // Реєструємо код в базі платформи
      await axios.post(API_URL, { 
        code: accessCode,
        name: userName,
        contact: contact
      }, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });

      bot.sendMessage(chatId, `Реєстрація успішна! ✅\n\nВаш персональний код доступу:\n✨ **${accessCode}** ✨\n\nВикористовуйте його для входу на платформу за цим посиланням:\n🔗 ${WEBSITE_URL}`, {
        parse_mode: 'Markdown'
      });

      userState.delete(chatId);
    } catch (error) {
      console.error('Помилка API:', error.message);
      bot.sendMessage(chatId, 'Вибачте, сталася помилка при генерації коду. Спробуйте пізніше.');
    }
  }
});
