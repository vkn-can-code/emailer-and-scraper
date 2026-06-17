export interface ProcessedChannel {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  subscriberCount?: string;
  viewCount?: string;
  videoCount?: string;
  leadScore: number;
  tier: string;
  email?: string;
  emailSubject?: string;
  emailBody?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sentAt?: string | Date;
  senderEmail?: string;
  createdAt: string | Date;
}


export interface GeneratedEmail {
  subject: string;
  body: string;
}
