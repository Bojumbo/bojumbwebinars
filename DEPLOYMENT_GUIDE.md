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

## 📊 Інтеграція з Google Таблицями
Система автоматично вивантажує дані глядачів у Google Таблицю.

### 1. Налаштування Google Cloud
1. Перейдіть у [Google Cloud Console](https://console.cloud.google.com/).
2. Створіть новий проект (напр. `webinar-sheets`).
3. Увімкніть **Google Sheets API**.
4. Перейдіть у **IAM & Admin -> Service Accounts**.
5. Створіть Service Account, дайте йому ім'я та натисніть "Done".
6. Натисніть на створений акаунт -> вкладка **Keys** -> **Add Key** -> **Create new key** (JSON).
7. Завантажений файл містить `client_email` та `private_key`.

### 2. Підготовка таблиці
1. Створіть нову Google Таблицю.
2. Натисніть **Поділитися (Share)** та додайте Email вашого сервісного акаунта (з кроку 1.7) з правами **Редактор**.
3. Скопіюйте ID вашої таблиці з URL-адреси: `https://docs.google.com/spreadsheets/d/ID_ТАБЛИЦІ/edit`.

### 3. Налаштування в Portainer
Додайте ці змінні в розділі **Environment variables**:
- `GOOGLE_SHEET_ID` — ID вашої таблиці.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — Email сервісного акаунта.
- `GOOGLE_PRIVATE_KEY` — Приватний ключ (повністю, включаючи `-----BEGIN PRIVATE KEY-----`).

---

## 🏗 Команда для оновлення (SSH)
Якщо ви внесли зміни в код або змінні оточення, виконайте:
```bash
cd /home/bojumbo/bojumbwebinars && \
docker-compose down && \
docker-compose up -d --build
```
