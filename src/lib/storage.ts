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
  contact?: string;
}

export interface User {
  id: string; // telegramId
  name: string;
  phone: string;
  username?: string;
  registeredAt: string;
  initialWebinarId?: string;
  registrations?: { webinarId: string; date: string }[];
}

export interface Attendance {
  webinarId: string;
  userId: string;
  joinTime: string;
}

export interface NotificationRecord {
  id: string;
  type: 'reminder' | 'followup';
  userId: string;
  webinarId: string;
  sentAt: string;
}

export interface ChatMessage {
  id: string;
  webinarId: string;
  userId?: string; // Optional for fake messages
  senderName: string;
  text: string;
  timestamp: number; // offset in seconds from webinar start
  isFake: boolean;
  sentAt?: string;
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
  users: User[];
  attendance: Attendance[];
  notifications: NotificationRecord[];
  messages: ChatMessage[];
}

const initialDB: DB = {
  webinars: [],
  codes: [{ code: 'ADMIN123', isUsed: false }],
  chatPresets: [],
  library: [],
  users: [],
  attendance: [],
  notifications: [],
  messages: []
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
    if (!parsed.users) parsed.users = [];
    if (!parsed.attendance) parsed.attendance = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.messages) parsed.messages = [];
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
  deleteWebinar: (id: string) => {
    const data = readDB();
    data.webinars = data.webinars.filter(w => w.id !== id);
    writeDB(data);
  },
  getCodes: () => readDB().codes,
  addCode: (code: string, name?: string, contact?: string) => {
    const data = readDB();
    data.codes.push({ code, isUsed: false, usedBy: name, contact: contact });
    writeDB(data);
  },
  validateCode: (code: string) => {
    return readDB().codes.some(c => c.code === code);
  },
  
  // New Methods
  getUsers: () => readDB().users,
  addUser: (user: User) => {
    const data = readDB();
    const existing = data.users.findIndex(u => u.id === user.id);
    if (existing >= 0) {
      data.users[existing] = { ...data.users[existing], ...user };
    } else {
      data.users.push(user);
    }
    writeDB(data);
  },
  getUser: (id: string) => readDB().users.find(u => u.id === id),
  deleteUser: (id: string) => {
    const data = readDB();
    data.users = data.users.filter(u => u.id !== id);
    data.attendance = data.attendance.filter(a => a.userId !== id);
    data.notifications = data.notifications.filter(n => n.userId !== id);
    data.messages = (data.messages || []).filter(m => m.userId !== id);
    writeDB(data);
  },
  
  recordAttendance: (att: Attendance) => {
    const data = readDB();
    const exists = data.attendance.some(a => a.userId === att.userId && a.webinarId === att.webinarId);
    if (!exists) {
      data.attendance.push(att);
      writeDB(data);
    }
  },
  getAttendance: (webinarId: string) => {
    const data = readDB();
    const attendees = data.attendance.filter(a => a.webinarId === webinarId);
    return attendees.map(a => {
      const user = data.users.find(u => u.id === a.userId);
      return { ...a, user };
    });
  },

  getNotifications: () => readDB().notifications,
  addNotification: (notif: NotificationRecord) => {
    const data = readDB();
    data.notifications.push(notif);
    writeDB(data);
  },

  addMessage: (msg: ChatMessage) => {
    const data = readDB();
    if (!data.messages) data.messages = [];
    data.messages.push(msg);
    writeDB(data);
  },
  getMessagesByUser: (userId: string) => {
    return (readDB().messages || []).filter(m => m.userId === userId);
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
