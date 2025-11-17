import { google } from 'googleapis';
import { config } from '../src/config/env.js';

async function main() {
  console.log('🔍 Verificando cuenta asociada al refresh token...\n');

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

    // Obtener información del perfil usando OAuth2 API
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    console.log('📧 === CUENTA REAL ASOCIADA AL REFRESH TOKEN ===\n');
    console.log(`Email: ${userInfo.data.email}`);
    console.log(`Name: ${userInfo.data.name || 'N/A'}\n`);

    console.log('📋 Configuración actual en .env:');
    console.log(`   GMAIL_USER: ${config.GMAIL_USER}\n`);

    if (userInfo.data.email !== config.GMAIL_USER) {
      console.log('⚠️  PROBLEMA DETECTADO:');
      console.log(`   La cuenta autorizada es: ${userInfo.data.email}`);
      console.log(`   Pero GMAIL_USER en .env es: ${config.GMAIL_USER}`);
      console.log('\n   Solución: Actualiza GMAIL_USER en .env a:');
      console.log(`   GMAIL_USER=${userInfo.data.email}`);
    } else {
      console.log('✅ La cuenta autorizada coincide con GMAIL_USER en .env');
      console.log('\n⚠️  Si aún así no funciona, el problema puede ser:');
      console.log('   1. La aplicación no está publicada o no está en modo de prueba correcto');
      console.log('   2. Faltan permisos en Google Cloud Console');
      console.log('   3. El scope no está correctamente configurado');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 401) {
      console.error('\n💡 El refresh token es inválido o expiró.');
      console.error('   Regenera el refresh token.');
    } else if (error.code === 403) {
      console.error('\n💡 Faltan permisos. Asegúrate de que:');
      console.error('   1. La aplicación tenga el scope correcto');
      console.error('   2. visits.medhome@gmail.com esté como test user');
    }
  }
}

main().catch(console.error);

