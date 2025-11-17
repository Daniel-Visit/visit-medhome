import { google } from 'googleapis';
import { config } from '../src/config/env.js';

async function main() {
  console.log('🔍 Verificando qué email está asociado al refresh token...\n');

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
    const accessToken = tokenResponse.token;
    
    if (!accessToken) {
      throw new Error('No se pudo obtener el access token');
    }
    
    console.log('✅ Access token obtenido correctamente\n');
    
    // Intentar obtener información usando Gmail API directamente
    // Esto nos dirá qué email está realmente asociado al token
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log('📧 === EMAIL REAL DEL REFRESH TOKEN ===\n');
      console.log(`Email: ${profile.data.emailAddress}`);
      console.log(`\n📋 Configurado en .env:`);
      console.log(`GMAIL_USER: ${config.GMAIL_USER}\n`);
      
      if (profile.data.emailAddress !== config.GMAIL_USER) {
        console.log('❌ PROBLEMA ENCONTRADO:');
        console.log(`   El refresh token está asociado a: ${profile.data.emailAddress}`);
        console.log(`   Pero GMAIL_USER en .env es: ${config.GMAIL_USER}`);
        console.log(`\n   Solución: Actualiza GMAIL_USER en .env a:`);
        console.log(`   GMAIL_USER=${profile.data.emailAddress}`);
      } else {
        console.log('✅ El email coincide correctamente');
        console.log('\n⚠️ Si sigue fallando, el problema puede ser:');
        console.log('   1. La cuenta no está en Test Users en Google Cloud Console');
        console.log('   2. El redirect_uri no coincide exactamente en Cloud Console');
        console.log('   3. Falta habilitar Gmail API en Cloud Console');
      }
    } catch (gmailError) {
      console.log('⚠️ No se pudo obtener el perfil de Gmail (scope limitado)');
      console.log('   Esto es normal si el scope solo incluye gmail.send');
      console.log('\n💡 Probando con el access token directamente...\n');
      
      // Si no podemos obtener el perfil, al menos verificamos que el token funciona
      console.log('✅ El refresh token genera access tokens válidos');
      console.log(`\n📋 Verifica manualmente en Google Cloud Console:`);
      console.log('   1. Ve a APIs & Services → Credentials');
      console.log('   2. Selecciona tu OAuth 2.0 Client ID');
      console.log('   3. Verifica que Authorized redirect URIs incluya: http://localhost');
      console.log('   4. Ve a OAuth consent screen');
      console.log('   5. Verifica que visits.medhome@gmail.com esté en Test users');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 401) {
      console.error('\n💡 El refresh token es inválido o fue revocado.');
      console.error('   Regenera el refresh token.');
    }
  }
}

main().catch(console.error);

