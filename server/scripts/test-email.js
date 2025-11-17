/**
 * Script para probar el envío de emails
 * 
 * Uso:
 * node scripts/test-email.js
 * 
 * O con parámetros:
 * node scripts/test-email.js dlhernan@uc.cl
 */

import { sendLoginCodeEmail } from '../src/services/emailService.js';
import { config } from '../src/config/env.js';

const email = process.argv[2] || 'dlhernan@uc.cl';
const testCode = '123456';

console.log('🧪 Probando envío de email...');
console.log(`📧 Destinatario: ${email}`);
console.log(`🔢 Código de prueba: ${testCode}`);
console.log('');

// Verificar configuración
if (!config.SMTP_USER && !config.GMAIL_CLIENT_ID) {
  console.log('⚠️  No hay configuración de email en .env');
  console.log('');
  console.log('Para configurar SMTP de Gmail:');
  console.log('1. Ve a: https://myaccount.google.com/apppasswords');
  console.log('2. Genera una contraseña de aplicación');
  console.log('3. Edita server/.env:');
  console.log('   SMTP_USER=dlhernan@uc.cl');
  console.log('   SMTP_PASS=tu_contraseña_de_aplicacion');
  console.log('');
  process.exit(1);
}

console.log('📋 Configuración actual:');
if (config.SMTP_USER) {
  console.log(`   SMTP_USER: ${config.SMTP_USER}`);
  console.log(`   SMTP_HOST: ${config.SMTP_HOST}`);
  console.log(`   SMTP_PORT: ${config.SMTP_PORT}`);
}
if (config.GMAIL_CLIENT_ID) {
  console.log(`   Gmail API: Configurada`);
  console.log(`   GMAIL_USER: ${config.GMAIL_USER}`);
}
console.log('');

// Probar envío
try {
  console.log('📤 Enviando email...');
  const result = await sendLoginCodeEmail(email, testCode);
  
  if (result.success) {
    console.log('✅ Email enviado exitosamente!');
    console.log(`📧 Revisa tu correo: ${email}`);
    console.log('');
    console.log('💡 Si no ves el email:');
    console.log('   1. Revisa la carpeta de spam');
    console.log('   2. Verifica que el email destino sea correcto');
    console.log('   3. Revisa los logs del servidor para errores');
  } else {
    console.log('❌ Error al enviar email:');
    console.log(`   ${result.error}`);
    console.log('');
    console.log('💡 Solución:');
    console.log('   1. Verifica la configuración en .env');
    console.log('   2. Asegúrate de que la contraseña de aplicación sea correcta');
    console.log('   3. Verifica que la verificación en 2 pasos esté activada');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Detalles:', error);
  process.exit(1);
}

