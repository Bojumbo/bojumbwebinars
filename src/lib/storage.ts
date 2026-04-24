import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'data.json');
const DATA_DIR = path.join(process.cwd(), 'data');

export interface Webinar {
  id: string;
  title: string;
  videoUrl: string;
  startTime: string; // ISO string
  repeatDays: number[]; // 0-6 (Sun-Sat)
  fakeViewersBase: number;
  duration: number; // seconds
  chatPresets?: ChatMessage[];
}

export interface InvitationCode {
  code: string;
  isUsed: boolean;
  usedBy?: string;
}

export interface ChatMessage {
  id: string;
  webinarId: string;
  senderName: string;
  text: string;
  timestamp: number; // offset in seconds from webinar start
  isFake: boolean;
}

interface VideoFile {
  name: string;
  url: string;
}

interface DB {
  webinars: Webinar[];
  codes: InvitationCode[];
  chatPresets: ChatMessage[];
  library: VideoFile[];
}

const initialDB: DB = {
  webinars: [],
  codes: [{ code: 'ADMIN123', isUsed: false }],
  chatPresets: [],
  library: []
};

function readDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }

    const data = fs.readFileSync(DB_PATH, 'utf-8');
    if (!data || data.trim() === '') {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
      return initialDB;
    }

    const parsed = JSON.parse(data);
    if (!parsed.library) parsed.library = [];
    if (!parsed.codes) parsed.codes = [];
    if (!parsed.webinars) parsed.webinars = [];
    return parsed;
  } catch (error) {
    console.error('Error reading database:', error);
    return initialDB;
  }
}

function writeDB(data: DB) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

export const db = {
  getWebinars: () => readDB().webinars,
  addWebinar: (w: Webinar) => {
    const data = readDB();
    data.webinars.push(w);
    writeDB(data);
  },
  getCodes: () => readDB().codes,
  addCode: (code: string, name?: string, contact?: string) => {
    const data = readDB();
    data.codes.push({ code, isUsed: false, usedBy: name, contact: contact } as any);
    writeDB(data);
  },
  validateCode: (code: string) => {
    return readDB().codes.some(c => c.code === code);
  },
  getChatPresets: (webinarId: string) => {
    return readDB().chatPresets.filter(m => m.webinarId === webinarId);
  },
  addChatPreset: (msg: ChatMessage) => {
    const data = readDB();
    data.chatPresets.push(msg);
    writeDB(data);
  },
  getLibrary: () => readDB().library,
  addToLibrary: (file: VideoFile) => {
    const data = readDB();
    data.library.push(file);
    writeDB(data);
  }
};
