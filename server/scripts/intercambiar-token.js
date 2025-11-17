/**
 * Script simple para intercambiar código de autorización por refresh token
 * 
 * Uso:
 * node scripts/intercambiar-token.js "CODIGO_AQUI"
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

// Obtener código de argumentos de línea de comandos
const code = process.argv[2];

if (!code) {
  console.error('❌ Error: Debes proporcionar el código de autorización');
  console.log('\n📝 Uso:');
  console.log('   node scripts/intercambiar-token.js "CODIGO_AQUI"');
  console.log('\n💡 Ejemplo:');
  console.log('   node scripts/intercambiar-token.js "4/0Ab32j90eBCmHSc4TdQpMkWgIORiSMkqURGeeLLerXXfJ2Z9R_byA3aRLtgbFd20MB_hb1g"');
  process.exit(1);
}

// Leer credenciales
const secretPath = join(PROJECT_ROOT, 'secret-google.json');
const credentials = JSON.parse(readFileSync(secretPath, 'utf8'));

const clientId = credentials.installed.client_id;
const clientSecret = credentials.installed.client_secret;
const redirectUri = credentials.installed.redirect_uris?.[0] || 'http://localhost';

console.log('🚀 Intercambiando código por tokens...\n');
console.log(`📧 Client ID: ${clientId}`);
console.log(`🔗 Redirect URI: ${redirectUri}`);
console.log(`📝 Código: ${code.substring(0, 20)}...\n`);

// Crear cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Intercambiar código por tokens
try {
  const { tokens } = await oauth2Client.getToken(code);
  
  console.log('✅ === TOKENS OBTENIDOS ===\n');
  console.log('📋 Tokens completos:');
  console.log(JSON.stringify(tokens, null, 2));
  console.log('\n');
  
  if (tokens.refresh_token) {
    console.log('🎉 ¡Refresh Token obtenido exitosamente!\n');
    console.log('📝 Configura estos valores en server/.env:\n');
    console.log('# Gmail API (Cloud Console)');
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('GMAIL_USER=visits.medhome@gmail.com');
    console.log(`GMAIL_REDIRECT_URI=${redirectUri}`);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Guarda estos valores de forma segura');
    console.log('   - NO los subas a GitHub');
    console.log('   - Agrega .env al .gitignore');
    console.log('\n✅ Una vez configurado, reinicia el servidor: npm run dev');
  } else {
    console.log('⚠️  ADVERTENCIA: No se obtuvo refresh_token');
    console.log('💡 Esto puede pasar si:');
    console.log('   - Ya autorizaste la app anteriormente');
    console.log('   - Necesitas revocar permisos y autorizar de nuevo');
    console.log('   - O agregar "prompt: consent" en la URL de autorización');
  }
} catch (error) {
  console.error('\n❌ Error obteniendo token:', error.message);
  console.error('\n💡 Posibles causas:');
  console.error('   - El código expiró (se generan nuevos códigos rápido)');
  console.error('   - El código ya fue usado');
  console.error('   - El redirect_uri no coincide');
  console.error('   - El código está incompleto o mal copiado');
  console.error('\n🔍 Detalles del error:');
  console.error(error);
  process.exit(1);
}

