# 🚀 Інструкція з розгортання Autodealer Webinar

Цей проект розгорнутий за допомогою Docker Compose.

## 📋 Попередня підготовка
Переконайтеся, що на сервері встановлені:
- Docker
- Docker Compose
- Git

## 🛠 Змінні оточення (.env)
Вам необхідно налаштувати наступні змінні в Portainer або у файлі `.env`:

| Змінна | Опис |
| --- | --- |
| `TELEGRAM_TOKEN` | Токен вашого бота від @BotFather |
| `BOT_SECRET` | Довільний рядок для захисту API (напр. `my-super-secret`) |
| `PUBLIC_URL` | Зовнішня адреса сайту (напр. `https://webinars.example.com`) |
| `WEBSITE_URL` | Внутрішня адреса для Docker (зазвичай `http://web:3000`) |

## 🔌 Інтеграція з SendPulse CRM
Система автоматично синхронізує користувачів та їхні дії з CRM SendPulse.

### 1. Отримання API ключів
- Перейдіть у **Налаштування акаунта** -> **API**.
- Активуйте API, якщо він вимкнений.
- Скопіюйте `ID` та `Secret` (це будуть `SENDPULSE_CLIENT_ID` та `SENDPULSE_CLIENT_SECRET`).

### 2. Отримання ID воронки та етапів
1. Відкрийте вашу воронку в SendPulse CRM.
2. Подивіться на URL-адресу в браузері:
   - `.../crm/pipelines/12345/...` — цифра `12345` це ваш `SENDPULSE_PIPELINE_ID`.
3. Щоб знайти ID етапу (`step_id`):
   - У CRM SendPulse зайдіть у налаштування воронки або подивіться на картку угоди.
   - Ви можете дізнатися ID етапів, додавши їх у змінні:
     - `SENDPULSE_STAGE_REGISTERED` — Етап "Зареєструвались в боті"
     - `SENDPULSE_STAGE_VIEWED` — Етап "Переглянули вебінар"

### 3. Налаштування в Portainer
Додайте ці змінні в розділі **Environment variables** вашого стеку:
- `SENDPULSE_CLIENT_ID`
- `SENDPULSE_CLIENT_SECRET`
- `SENDPULSE_PIPELINE_ID`
- `SENDPULSE_STAGE_REGISTERED`
- `SENDPULSE_STAGE_VIEWED`

---

## 🏗 Команда для оновлення (SSH)
Якщо ви внесли зміни в код або змінні оточення, виконайте:
```bash
cd /home/bojumbo/bojumbwebinars && \
docker-compose down && \
docker-compose up -d --build
```
