import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getFirstSheetName() {
  if (!SPREADSHEET_ID) return null;
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return res.data.sheets?.[0]?.properties?.title || 'Sheet1';
}

export const googleSheets = {
  async checkConnection() {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return { success: false, message: 'Змінні оточення Google не встановлені.' };
    }
    try {
      const sheetName = await getFirstSheetName();
      return { success: true, message: `Успішне підключення до Google Таблиці. Аркуш: "${sheetName}"` };
    } catch (e: any) {
      console.error('Google Sheets Connection Error:', e.message);
      return { success: false, message: `Помилка: ${e.message}` };
    }
  },

  async appendRegistration(data: { userId: string, name: string, phone: string, username: string, webinar: string, date: string }) {
    if (!SPREADSHEET_ID) return;
    console.log(`[Sheets Sync] Attempting to append registration for User: ${data.userId} (${data.name})`);
    try {
      const sheetName = await getFirstSheetName();
      console.log(`[Sheets Sync] Appending to sheet: "${sheetName}"`);
      
      const res = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:G`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[data.date, data.name, data.phone, data.username, data.webinar, 'Зареєструвався', data.userId]],
        },
      });
      console.log(`[Sheets Sync] Append successful! Updated range: ${res.data.updates?.updatedRange}`);
    } catch (e: any) {
      console.error('[Sheets Sync] Append Error:', e.message);
    }
  },

  async updateAttendance(userId: string, webinar: string) {
    if (!SPREADSHEET_ID) return;
    console.log(`[Sheets Sync] Attempting to update attendance for User: ${userId}, Webinar: ${webinar}`);
    try {
      const sheetName = await getFirstSheetName();
      console.log(`[Sheets Sync] Found sheet name: "${sheetName}"`);

      // 1. Get all rows (A:G)
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:G`,
      });
      const rows = res.data.values || [];
      console.log(`[Sheets Sync] Retrieved ${rows.length} rows`);

      // 2. Find row by userId (Column G, index 6) and webinar (Column E, index 4)
      const rowIndex = rows.findIndex((row, idx) => {
        const rowId = row[6] ? String(row[6]).trim() : '';
        const rowWebinar = row[4] ? String(row[4]).trim() : '';
        
        console.log(`[Sheets Sync] Checking row ${idx + 1}: ID="${rowId}", Webinar="${rowWebinar}"`);
        
        const match = rowId === String(userId).trim() && rowWebinar === webinar.trim();
        if (match) console.log(`[Sheets Sync] Match found at row ${idx + 1}!`);
        return match;
      });
      
      if (rowIndex !== -1) {
        // 3. Update status in column F (index 5)
        console.log(`[Sheets Sync] Updating status to "Прийшов" for row ${rowIndex + 1}`);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!F${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Прийшов']],
          },
        });
        console.log(`[Sheets Sync] Update successful!`);
      } else {
        console.warn(`[Sheets Sync] No matching row found for User: ${userId} and Webinar: ${webinar}`);
      }
    } catch (e: any) {
      console.error('[Sheets Sync] Update Error:', e.message);
    }
  }
};
