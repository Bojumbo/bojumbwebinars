const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Конфігурація
const token = process.env.TELEGRAM_TOKEN;
const WEBSITE_URL = process.env.WEBSITE_URL || 'http://web:3000'; // Внутрішня адреса для API
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://webinars.bojumbohost.pp.ua'; // Зовнішня адреса для глядачів
const SECRET_KEY = process.env.BOT_SECRET || 'dev-secret';

const bot = new TelegramBot(token, { polling: true });
const userState = new Map();

console.log('--- Бот для автовебінарів запущений (Прямі посилання) ---');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const username = msg.from.username || 'N/A';

  if (text === '/start') {
    try {
      const res = await axios.get(`${WEBSITE_URL}/api/bot/user-check?chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });

      if (res.data.exists) {
        const { user, webinar } = res.data;
        if (webinar) {
          const now = new Date();
          const startTime = new Date(webinar.startTime);
          const isLive = startTime <= now;
          
          if (isLive) {
            bot.sendMessage(chatId, `Вітаємо знову, ${user.name}! 😊\n\n🚀 **Трансляція вже розпочалася!**\n📌 Тема: **${webinar.title}**\n\nПриєднуйтесь:\n🔗 ${PUBLIC_URL}/webinar/${webinar.id}?u=${chatId}`, {
              parse_mode: 'Markdown'
            });
          } else {
            const startTimeStr = startTime.toLocaleString('uk-UA');
            bot.sendMessage(chatId, `Вітаємо знову, ${user.name}! 😊\n\n📅 Найближча трансляція: **${webinar.title}**\n⏰ Початок: **${startTimeStr}**\n\nВаше посилання:\n🔗 ${PUBLIC_URL}/webinar/${webinar.id}?u=${chatId}`, {
              parse_mode: 'Markdown'
            });
          }
        } else {
          bot.sendMessage(chatId, `Вітаємо знову, ${user.name}! 😊\n\nНаразі запланованих вебінарів немає, але ми обов'язково сповістимо вас про наступний ефір! 🔔`);
        }
        return;
      }
    } catch (e) {
      console.error('User check error:', e.message);
    }

    bot.sendMessage(chatId, 'Привіт! 😊 Ласкаво просимо до нашої платформи.\n\nБудь ласка, напишіть ваше **Ім’я**:');
    userState.set(chatId, { step: 'awaiting_name', username });
    return;
  }

  const state = userState.get(chatId);

  if (state?.step === 'awaiting_name') {
    const userName = text.trim();
    if (userName.length < 2) {
      bot.sendMessage(chatId, 'Будь ласка, введіть коректне ім’я.');
      return;
    }
    userState.set(chatId, { ...state, step: 'awaiting_contact', name: userName });
    bot.sendMessage(chatId, `Приємно познайомитись, ${userName}! 👋\n\nТепер напишіть ваш **номер телефону**, щоб ми могли зареєструвати вас на трансляцію:`);
    return;
  }

  if (state?.step === 'awaiting_contact') {
    const rawContact = text.trim();
    const cleanedContact = rawContact.replace(/\D/g, '');
    const isPhone = /^(38)?0\d{9}$/.test(cleanedContact);

    if (!isPhone) {
      bot.sendMessage(chatId, '❌ Некоректний формат.\n\nБудь ласка, введіть ваш номер телефону у форматі **0XXXXXXXXX** або **+380XXXXXXXXX**:');
      return;
    }

    const contact = cleanedContact.length === 10 ? '+38' + cleanedContact : '+' + cleanedContact;
    const userName = state.name;

    try {
      // 1. Реєструємо користувача та отримуємо посилання на найближчий вебінар
      const res = await axios.post(`${WEBSITE_URL}/api/bot/register`, { 
        chatId: chatId.toString(),
        name: userName,
        phone: contact,
        username: state.username
      }, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });

      const { webinar } = res.data;

      if (webinar) {
        const now = new Date();
        const startTime = new Date(webinar.startTime);
        const isLive = startTime <= now;
        
        if (isLive) {
          bot.sendMessage(chatId, `Ви успішно зареєстровані! ✅\n\n🚀 **Трансляція вже розпочалася!**\n📌 Тема: **${webinar.title}**\n\nШвидше приєднуйтесь за вашим персональним посиланням:\n🔗 ${PUBLIC_URL}/webinar/${webinar.id}?u=${chatId}`, {
            parse_mode: 'Markdown'
          });
        } else {
          const startTimeStr = startTime.toLocaleString('uk-UA');
          bot.sendMessage(chatId, `Ви успішно зареєстровані! ✅\n\n📅 Найближча трансляція: **${webinar.title}**\n⏰ Час початку: **${startTimeStr}**\n\nВаше персональне посилання для входу:\n🔗 ${PUBLIC_URL}/webinar/${webinar.id}?u=${chatId}`, {
            parse_mode: 'Markdown'
          });
        }
      } else {
        bot.sendMessage(chatId, `Ви успішно зареєстровані! ✅\n\nНаразі запланованих вебінарів ще немає, але ми сповістимо вас як тільки буде заплановано новий вебінар! 🔔`);
      }

      userState.delete(chatId);
    } catch (error) {
      console.error('Помилка реєстрації:', error.response?.data || error.message);
      bot.sendMessage(chatId, 'Вибачте, сталася помилка при реєстрації. Спробуйте пізніше.');
    }
  }
});

// Функція для перевірки та надсилання сповіщень
const checkAndSendNotifications = async () => {
  try {
    const res = await axios.get(`${WEBSITE_URL}/api/bot/notifications/check`, {
      headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
    });

    const { reminders, followups, announcements } = res.data;

    // 1. Анонс нового вебінару (для тих, хто чекав)
    for (const a of announcements) {
      const startTime = new Date(a.startTime).toLocaleString('uk-UA');
      await bot.sendMessage(a.chatId, `🎉 **Гарні новини!**\n\nМи запланували нову трансляцію:\n📌 **${a.title}**\n⏰ Коли: **${startTime}**\n\nВи будете з нами? Приєднуйтесь за посиланням:\n🔗 ${PUBLIC_URL}/webinar/${a.webinarId}?u=${a.chatId}`, {
        parse_mode: 'Markdown'
      });
      await axios.post(`${WEBSITE_URL}/api/bot/notifications/mark`, { id: a.id }, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });
    }

    // 2. Нагадування за 30 хв
    for (const r of reminders) {
      await bot.sendMessage(r.chatId, `⏰ **Нагадування!**\n\nВебінар "${r.title}" почнеться через 30 хвилин.\n\nПриєднуйтесь за посиланням:\n🔗 ${PUBLIC_URL}/webinar/${r.webinarId}?u=${r.chatId}`, {
        parse_mode: 'Markdown'
      });
      await axios.post(`${WEBSITE_URL}/api/bot/notifications/mark`, { id: r.id }, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });
    }

    // 3. Follow-up після завершення
    for (const f of followups) {
      await bot.sendMessage(f.chatId, `Дякуємо за участь у вебінарі! 🙏\n\nСподіваємось, вам було корисно. Підписуйтесь на наші соцмережі, щоб не пропустити нові ефіри:\n\n📸 **Instagram**: [Ваше посилання]\n📢 **Telegram-канал**: [Ваше посилання]`, {
        parse_mode: 'Markdown'
      });
      await axios.post(`${WEBSITE_URL}/api/bot/notifications/mark`, { id: f.id }, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });
    }
  } catch (error) {
    console.error('Notification error:', error.response?.data || error.message);
  }
};

// Запускаємо перевірку одразу при старті
checkAndSendNotifications();

// Потім кожні 10 секунд (для тесту, потім можна повернути 5 хв)
setInterval(checkAndSendNotifications, 10 * 1000);
