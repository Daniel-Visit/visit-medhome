/**
 * Script para obtener el refresh token de Gmail API
 * 
 * Uso:
 * 1. Configura GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET en .env
 * 2. Ejecuta: node scripts/get-gmail-refresh-token.js
 * 3. Sigue las instrucciones en pantalla
 */

import { google } from 'googleapis';
import readline from 'readline';
import { config } from '../src/config/env.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('\n🔐 Autoriza esta aplicación visitando esta URL:');
  console.log('\n' + authUrl + '\n');
  console.log('📋 Pasos:');
  console.log('1. Abre la URL en tu navegador');
  console.log('2. Inicia sesión con dlhernan@uc.cl');
  console.log('3. Autoriza la aplicación');
  console.log('4. Copia el código de autorización');
  console.log('5. Pégalo aquí abajo\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Ingresa el código de autorización aquí: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('\n❌ Error recuperando el token de acceso:', err.message);
        console.error('\n💡 Verifica:');
        console.error('   - Que el código sea correcto');
        console.error('   - Que hayas copiado todo el código');
        console.error('   - Que no haya espacios extra');
        process.exit(1);
      }
      callback(token);
    });
  });
}

async function main() {
  if (!config.GMAIL_CLIENT_ID || !config.GMAIL_CLIENT_SECRET) {
    console.error('❌ Error: GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET deben estar configurados en .env');
    console.log('\nConfigura estos valores en server/.env:');
    console.log('GMAIL_CLIENT_ID=tu_client_id');
    console.log('GMAIL_CLIENT_SECRET=tu_client_secret');
    process.exit(1);
  }

  const oAuth2Client = new google.auth.OAuth2(
    config.GMAIL_CLIENT_ID,
    config.GMAIL_CLIENT_SECRET,
    config.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
  );

  getNewToken(oAuth2Client, (token) => {
    console.log('\n✅ Token obtenido exitosamente!');
    console.log('\n📝 Configura estos valores en server/.env:');
    console.log('\n# Gmail API (Cloud Console)');
    console.log(`GMAIL_CLIENT_ID=${config.GMAIL_CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${config.GMAIL_CLIENT_SECRET}`);
    console.log(`GMAIL_REFRESH_TOKEN=${token.refresh_token}`);
    console.log(`GMAIL_USER=${config.GMAIL_USER || 'dlhernan@uc.cl'}`);
    console.log(`GMAIL_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob`);
    console.log('\n⚠️  IMPORTANTE: Guarda estos valores de forma segura!');
    console.log('⚠️  NO los subas a GitHub!');
    console.log('\n✅ Una vez configurado, reinicia el servidor: npm run dev');
  });
}

main().catch(console.error);

