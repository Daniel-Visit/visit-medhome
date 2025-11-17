import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 4000,
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'medhome_visits',
  JWT_SECRET: process.env.JWT_SECRET || 'un_secreto_seguro',
  LOGIN_CODE_EXP_MINUTES: parseInt(process.env.LOGIN_CODE_EXP_MINUTES || '10', 10),
  CHECKIN_RADIUS_METERS: parseInt(process.env.CHECKIN_RADIUS_METERS || '150', 10),
  CHECKIN_MINUTES_BEFORE_START: parseInt(process.env.CHECKIN_MINUTES_BEFORE_START || '10', 10),
  CHECKIN_MINUTES_AFTER_START: parseInt(process.env.CHECKIN_MINUTES_AFTER_START || '20', 10),
  // SMTP tradicional (Opción 1: Más simple)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  
  // Gmail API (Opción 2: Más robusto, requiere OAuth2)
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '',
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN || '',
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
  GMAIL_USER: process.env.GMAIL_USER || '',
  
  // Email remitente
  EMAIL_FROM: process.env.EMAIL_FROM || ''
};

