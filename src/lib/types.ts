export interface ChatPreset {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Webinar {
  id: string;
  title: string;
  videoUrl: string;
  startTime: Date | string;
  duration: number;
  fakeViewersBase: number;
  chatPresets: ChatPreset[];
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: number;
}
