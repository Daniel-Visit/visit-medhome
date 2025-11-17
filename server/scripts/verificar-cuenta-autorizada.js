import { google } from 'googleapis';
import { config } from '../src/config/env.js';

async function main() {
  console.log('🔍 Verificando cuenta autorizada...\n');

  const oauth2Client = new google.auth.OAuth2(
    config.GMAIL_CLIENT_ID,
    config.GMAIL_CLIENT_SECRET,
    config.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: config.GMAIL_REFRESH_TOKEN
  });

  try {
    // Obtener access token
    const tokenResponse = await oauth2Client.getAccessToken();
    console.log('✅ Access token obtenido\n');

    // Obtener información del perfil usando Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log('📧 === CUENTA AUTORIZADA ===\n');
    console.log(`Email: ${profile.data.emailAddress}`);
    console.log(`Messages Total: ${profile.data.messagesTotal}`);
    console.log(`Threads Total: ${profile.data.threadsTotal}\n`);

    console.log('📋 Configuración actual en .env:');
    console.log(`   GMAIL_USER: ${config.GMAIL_USER}\n`);

    if (profile.data.emailAddress !== config.GMAIL_USER) {
      console.log('⚠️  ADVERTENCIA:');
      console.log(`   La cuenta autorizada (${profile.data.emailAddress})`);
      console.log(`   NO coincide con GMAIL_USER en .env (${config.GMAIL_USER})`);
      console.log('\n   Esto causará el error "Invalid login".');
      console.log('   Solución: Actualiza GMAIL_USER en .env o regenera el refresh token con la cuenta correcta.');
    } else {
      console.log('✅ La cuenta autorizada coincide con GMAIL_USER en .env');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 401) {
      console.error('\n💡 El refresh token es inválido o expiró.');
    }
  }
}

main().catch(console.error);

