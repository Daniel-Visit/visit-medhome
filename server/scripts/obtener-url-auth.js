/**
 * Script para obtener la URL de autorización sin abrir navegador automáticamente
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

// Leer credenciales
const secretPath = join(PROJECT_ROOT, 'secret-google.json');
const credentials = JSON.parse(readFileSync(secretPath, 'utf8'));

const clientId = credentials.installed.client_id;
const clientSecret = credentials.installed.client_secret;
const redirectUri = credentials.installed.redirect_uris?.[0] || 'http://localhost';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Crear cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Generar URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('🔗 URL de autorización:');
console.log(authUrl);
console.log('\n📋 Instrucciones:');
console.log('1. Copia la URL de arriba');
console.log('2. Abre el navegador');
console.log('3. Inicia sesión con visits.medhome@gmail.com');
console.log('4. Autoriza la aplicación');
console.log('5. Copia el código de la URL después de "code="');

