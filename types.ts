
export interface Message {
  role: 'user' | 'system';
  content: string;
  image?: string;
  mimeType?: string;
}

export interface GuideItem {
  num: string;
  title: string;
  desc: string;
}
