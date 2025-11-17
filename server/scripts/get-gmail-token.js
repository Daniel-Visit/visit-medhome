/**
 * Script para obtener el refresh token de Gmail API
 * 
 * Este script puede leer las credenciales de dos formas:
 * 1. Desde secret-google.json (preferido)
 * 2. Desde .env (GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET)
 * 
 * Uso:
 * node scripts/get-gmail-token.js
 */

import { google } from 'googleapis';
import readline from 'readline';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

// SCOPES necesarios para Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// REDIRECT_URI - debe coincidir con el configurado en Google Cloud Console
// Puedes usar cualquiera de estos:
// - http://localhost:3000/oauth2callback (recomendado)
// - http://localhost (si está configurado en secret-google.json)
// - urn:ietf:wg:oauth:2.0:oob (para aplicaciones de escritorio)
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Función para leer credenciales desde secret-google.json
function loadCredentialsFromFile() {
  try {
    const secretPath = join(PROJECT_ROOT, 'secret-google.json');
    const secretFile = readFileSync(secretPath, 'utf8');
    const credentials = JSON.parse(secretFile);
    
    // Soporta formato "installed" (desktop app) o "web" (web app)
    if (credentials.installed) {
      // Si hay redirect_uris en el JSON, usar el primero, sino usar el predeterminado
      const redirectUri = credentials.installed.redirect_uris && credentials.installed.redirect_uris.length > 0
        ? credentials.installed.redirect_uris[0]
        : REDIRECT_URI;
      
      return {
        client_id: credentials.installed.client_id,
        client_secret: credentials.installed.client_secret,
        redirect_uri: redirectUri
      };
    } else if (credentials.web) {
      // Si hay redirect_uris en el JSON, usar el primero, sino usar el predeterminado
      const redirectUri = credentials.web.redirect_uris && credentials.web.redirect_uris.length > 0
        ? credentials.web.redirect_uris[0]
        : REDIRECT_URI;
      
      return {
        client_id: credentials.web.client_id,
        client_secret: credentials.web.client_secret,
        redirect_uri: redirectUri
      };
    } else {
      throw new Error('Formato de secret-google.json no reconocido');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️  No se encontró secret-google.json, usando .env');
      return null;
    }
    throw error;
  }
}

// Función para leer credenciales desde .env
function loadCredentialsFromEnv() {
  if (config.GMAIL_CLIENT_ID && config.GMAIL_CLIENT_SECRET) {
    return {
      client_id: config.GMAIL_CLIENT_ID,
      client_secret: config.GMAIL_CLIENT_SECRET,
      redirect_uri: config.GMAIL_REDIRECT_URI || REDIRECT_URI
    };
  }
  return null;
}

// Función principal
async function main() {
  console.log('🚀 Obteniendo Refresh Token para Gmail API\n');
  
  // Intentar cargar credenciales desde secret-google.json primero
  let credentials = loadCredentialsFromFile();
  let source = 'secret-google.json';
  
  // Si no se encuentra, intentar desde .env
  if (!credentials) {
    credentials = loadCredentialsFromEnv();
    source = '.env';
  }
  
  // Si no se encuentran credenciales, mostrar error
  if (!credentials) {
    console.error('❌ Error: No se encontraron credenciales');
    console.log('\n📝 Opciones:');
    console.log('1. Crea secret-google.json en la raíz del proyecto con:');
    console.log('   {');
    console.log('     "installed": {');
    console.log('       "client_id": "tu_client_id.apps.googleusercontent.com",');
    console.log('       "client_secret": "tu_client_secret",');
    console.log('       "redirect_uris": ["http://localhost:3000/oauth2callback"]');
    console.log('     }');
    console.log('   }');
    console.log('\n2. O configura en server/.env:');
    console.log('   GMAIL_CLIENT_ID=tu_client_id.apps.googleusercontent.com');
    console.log('   GMAIL_CLIENT_SECRET=tu_client_secret');
    process.exit(1);
  }
  
  // Usar el redirect_uri de las credenciales o el predeterminado
  const redirectUri = credentials.redirect_uri || REDIRECT_URI;
  
  console.log(`✅ Credenciales cargadas desde: ${source}`);
  console.log(`📧 Client ID: ${credentials.client_id}`);
  console.log(`🔐 Client Secret: ${credentials.client_secret.substring(0, 10)}...`);
  console.log(`🔗 Redirect URI: ${redirectUri}\n`);
  
  // Advertencia si el redirect_uri es diferente
  if (redirectUri !== REDIRECT_URI && redirectUri !== 'urn:ietf:wg:oauth:2.0:oob') {
    console.log('⚠️  ADVERTENCIA:');
    console.log(`   El redirect_uri en secret-google.json es: ${redirectUri}`);
    console.log(`   Pero el script usa: ${REDIRECT_URI}`);
    console.log('   Asegúrate de que este redirect_uri esté configurado en Google Cloud Console\n');
  }
  
  // Crear cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  );
  
  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necesario para obtener refresh_token
    scope: SCOPES,
    prompt: 'consent' // Fuerza a mostrar la pantalla de consentimiento
  });
  
  console.log('🌐 Abriendo navegador...\n');
  console.log('📋 Instrucciones:');
  console.log('1. Se abrirá una URL en tu navegador');
  console.log('2. Inicia sesión con visits.medhome@gmail.com');
  console.log('3. Autoriza la aplicación');
  console.log('4. Serás redirigido a una URL como:');
  console.log(`   ${redirectUri}?code=XXXXXXXX`);
  console.log('5. Copia el código después de "code="\n');
  
  // Si el redirect_uri es http://localhost (sin puerto), explicar que necesita un servidor
  if (redirectUri === 'http://localhost' || redirectUri.startsWith('http://localhost:')) {
    console.log('💡 NOTA:');
    console.log('   Si el redirect_uri es http://localhost:3000/oauth2callback,');
    console.log('   necesitarás un servidor corriendo en ese puerto, O');
    console.log('   simplemente copia el código de la URL del navegador.\n');
  }
  
  // Abrir navegador automáticamente
  try {
    await open(authUrl);
    console.log('✅ Navegador abierto\n');
  } catch (error) {
    console.log('⚠️  No se pudo abrir el navegador automáticamente');
    console.log('🌐 Abre manualmente esta URL:\n');
    console.log(authUrl);
    console.log('');
  }
  
  // Crear interfaz readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  // Pedir código de autorización
  rl.question('📝 Pega aquí el código que recibiste en la URL: ', async (code) => {
    rl.close();
    
    try {
      // Obtener tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n✅ === REFRESH TOKEN OBTENIDO ===\n');
      console.log('📋 Tokens obtenidos:');
      console.log(JSON.stringify(tokens, null, 2));
      console.log('\n');
      
      // Mostrar información importante
      if (tokens.refresh_token) {
        console.log('🎉 ¡Refresh Token obtenido exitosamente!\n');
        console.log('📝 Configura estos valores en server/.env:\n');
        console.log('# Gmail API (Cloud Console)');
        console.log(`GMAIL_CLIENT_ID=${credentials.client_id}`);
        console.log(`GMAIL_CLIENT_SECRET=${credentials.client_secret}`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`GMAIL_USER=visits.medhome@gmail.com`);
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
        console.log('   - O usar otro método de autenticación');
      }
    } catch (error) {
      console.error('\n❌ Error obteniendo token:', error.message);
      console.error('\n💡 Verifica:');
      console.error('   - Que el código sea correcto');
      console.error('   - Que hayas copiado todo el código');
      console.error('   - Que no haya espacios extra');
      console.error('   - Que el redirect_uri coincida con el configurado en Google Cloud Console');
      process.exit(1);
    }
  });
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

