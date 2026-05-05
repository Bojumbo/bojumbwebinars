const API_URL = 'https://api.sendpulse.com';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) return accessToken;

  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('SendPulse credentials missing');
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiry = now + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (e) {
    console.error('SendPulse Auth Error:', e);
    return null;
  }
}

export const sendPulse = {
  async checkConnection() {
    const token = await getAccessToken();
    if (token) {
      return { success: true, message: 'З’єднання з SendPulse успішно встановлено.' };
    }
    return { success: false, message: 'Не вдалося отримати токен. Перевірте Client ID та Secret.' };
  },
  async getOrCreateContact(name: string, phone: string) {
    const token = await getAccessToken();
    if (!token) return null;

    try {
      // 1. Search for contact by phone
      const searchRes = await fetch(`${API_URL}/crm/v1/contacts?search=${phone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      
      if (searchData.data && searchData.data.length > 0) {
        return searchData.data[0].id;
      }

      // 2. Create contact if not found
      const createRes = await fetch(`${API_URL}/crm/v1/contacts`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name,
          phones: [{ phone }]
        })
      });
      const createData = await createRes.json();
      return createData.data?.id;
    } catch (e) {
      console.error('SendPulse Contact Error:', e);
      return null;
    }
  },

  async createOrUpdateDeal(userId: string, name: string, phone: string, webinarTitle: string, isAttended: boolean = false) {
    const token = await getAccessToken();
    if (!token) return null;

    const pipelineId = parseInt(process.env.SENDPULSE_PIPELINE_ID || '0');
    const stageRegistered = parseInt(process.env.SENDPULSE_STAGE_REGISTERED || '0');
    const stageViewed = parseInt(process.env.SENDPULSE_STAGE_VIEWED || '0');

    if (!pipelineId) return null;

    try {
      const contactId = await this.getOrCreateContact(name, phone);
      if (!contactId) return null;

      // 1. Check for existing deal in this pipeline for this contact
      const searchRes = await fetch(`${API_URL}/crm/v1/deals?pipeline_id=${pipelineId}&contact_id=${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      const existingDeal = searchData.data?.find((d: any) => d.pipeline_id === pipelineId);

      const targetStage = isAttended ? stageViewed : stageRegistered;

      if (existingDeal) {
        // Update existing deal
        await fetch(`${API_URL}/crm/v1/deals/${existingDeal.id}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            step_id: targetStage,
            attributes: [
              { attribute_id: 'webinar_status', value: isAttended ? 'Переглянув' : 'Зареєструвався' },
              { attribute_id: 'last_webinar', value: webinarTitle }
            ]
          })
        });
        return existingDeal.id;
      } else {
        // Create new deal
        const createRes = await fetch(`${API_URL}/crm/v1/deals`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            name: `Webinar: ${webinarTitle}`,
            pipeline_id: pipelineId,
            step_id: targetStage,
            contact_id: contactId,
            attributes: [
              { attribute_id: 'telegram_id', value: userId },
              { attribute_id: 'webinar_status', value: isAttended ? 'Переглянув' : 'Зареєструвався' }
            ]
          })
        });
        const createData = await createRes.json();
        return createData.data?.id;
      }
    } catch (e) {
      console.error('SendPulse Deal Error:', e);
      return null;
    }
  }
};
