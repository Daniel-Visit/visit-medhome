#!/usr/bin/env node

/**
 * Script para configurar .env copiando variables del server/.env
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const serverEnvPath = join(process.cwd(), 'server', '.env');
const rootEnvPath = join(process.cwd(), '.env');
const envExamplePath = join(process.cwd(), '.env.example');

// Leer variables del server/.env si existe
let serverEnv = {};
if (existsSync(serverEnvPath)) {
  const serverEnvContent = readFileSync(serverEnvPath, 'utf-8');
  serverEnvContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        serverEnv[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

// Leer .env.example como base
let envContent = '';
if (existsSync(envExamplePath)) {
  envContent = readFileSync(envExamplePath, 'utf-8');
} else {
  // Crear contenido base si no existe .env.example
  envContent = `# Database
DATABASE_URL="mysql://root:password@localhost:3306/medhome_visits"

# JWT
JWT_SECRET="un_secreto_seguro_mas_largo"

# Login Code
LOGIN_CODE_EXP_MINUTES=10

# Check-in
CHECKIN_RADIUS_METERS=150
CHECKIN_MINUTES_BEFORE_START=10
CHECKIN_MINUTES_AFTER_START=20

# Gmail API
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER=visits.medhome@gmail.com
`;
}

// Reemplazar valores si existen en server/.env
const envLines = envContent.split('\n');
const updatedLines = envLines.map(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key] = trimmed.split('=');
    if (key && serverEnv[key.trim()]) {
      return `${key.trim()}=${serverEnv[key.trim()]}`;
    }
  }
  return line;
});

// Construir DATABASE_URL si tenemos las variables individuales
if (!updatedLines.some(line => line.startsWith('DATABASE_URL=') && line.includes('mysql://'))) {
  const dbHost = serverEnv.DB_HOST || '127.0.0.1';
  const dbUser = serverEnv.DB_USER || 'root';
  const dbPassword = serverEnv.DB_PASSWORD || 'password';
  const dbName = serverEnv.DB_NAME || 'medhome_visits';
  const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:3306/${dbName}`;
  
  const dbUrlIndex = updatedLines.findIndex(line => line.startsWith('DATABASE_URL='));
  if (dbUrlIndex !== -1) {
    updatedLines[dbUrlIndex] = `DATABASE_URL="${dbUrl}"`;
  }
}

// Copiar variables de Gmail si existen
const gmailVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER'];
gmailVars.forEach(varName => {
  if (serverEnv[varName]) {
    const index = updatedLines.findIndex(line => line.startsWith(`${varName}=`));
    if (index !== -1) {
      updatedLines[index] = `${varName}=${serverEnv[varName]}`;
    }
  }
});

// Copiar JWT_SECRET si existe
if (serverEnv.JWT_SECRET) {
  const index = updatedLines.findIndex(line => line.startsWith('JWT_SECRET='));
  if (index !== -1) {
    updatedLines[index] = `JWT_SECRET="${serverEnv.JWT_SECRET}"`;
  }
}

// Escribir .env
writeFileSync(rootEnvPath, updatedLines.join('\n'), 'utf-8');
console.log('✅ .env creado/actualizado exitosamente');
console.log('📝 Revisa el archivo .env y ajusta las variables según sea necesario');




