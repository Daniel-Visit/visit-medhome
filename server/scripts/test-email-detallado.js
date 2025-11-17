import nodemailer from 'nodemailer';
import { config } from '../src/config/env.js';

async function main() {
  const to = process.argv[2] || 'dlhernan@uc.cl';
  const code = '123456';

  console.log('🧪 Test detallado de envío de email...\n');
  console.log('📋 Configuración:');
  console.log(`   GMAIL_USER: ${config.GMAIL_USER}`);
  console.log(`   GMAIL_CLIENT_ID: ${config.GMAIL_CLIENT_ID ? 'OK' : 'MISSING'}`);
  console.log(`   GMAIL_CLIENT_SECRET: ${config.GMAIL_CLIENT_SECRET ? 'OK' : 'MISSING'}`);
  console.log(`   GMAIL_REFRESH_TOKEN: ${config.GMAIL_REFRESH_TOKEN ? 'OK' : 'MISSING'}`);
  console.log(`   GMAIL_REDIRECT_URI: ${config.GMAIL_REDIRECT_URI || 'NO CONFIGURADO'}\n`);

  try {
    console.log('🔧 Creando transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.GMAIL_USER,
        clientId: config.GMAIL_CLIENT_ID,
        clientSecret: config.GMAIL_CLIENT_SECRET,
        refreshToken: config.GMAIL_REFRESH_TOKEN
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Transporter creado\n');
    console.log('📤 Enviando email...');
    
    const info = await transporter.sendMail({
      from: `"MEDHOME" <${config.GMAIL_USER}>`,
      to,
      subject: "Test - Código de acceso - MEDHOME",
      html: `<p>Test: ${code}</p>`
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', info.messageId);
  } catch (error) {
    console.error('\n❌ ERROR:\n');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Comando:', error.command);
    console.error('Respuesta:', error.response);
    
    if (error.responseCode === 535) {
      console.error('\n💡 Error 535: Username and Password not accepted');
      console.error('\n🔍 Esto generalmente significa:');
      console.error('   1. El GMAIL_USER no coincide con la cuenta que autorizó el refresh token');
      console.error('   2. El refresh token fue revocado');
      console.error('   3. La cuenta no está en Test Users en Google Cloud Console');
      console.error('\n📋 Pasos para verificar:');
      console.error('   1. Ve a Google Cloud Console → OAuth consent screen');
      console.error('   2. Verifica que visits.medhome@gmail.com esté en "Test users"');
      console.error('   3. Ve a APIs & Services → Credentials');
      console.error('   4. Verifica que el redirect_uri sea exactamente: http://localhost');
    }
  }
}

main().catch(console.error);

