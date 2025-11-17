// scripts/send-test-email.js
import "dotenv/config.js";
import { sendEmail } from "../src/gmailClient.js";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Uso: node scripts/send-test-email.js correo@destino.com");
    process.exit(1);
  }

  console.log(`📤 Enviando email de prueba a ${to}...\n`);

  try {
    await sendEmail({
      to,
      subject: "Prueba Gmail API (sin Nodemailer)",
      text: "Si lees esto, Gmail API está funcionando correctamente.",
      html: "<p>Si lees esto, <b>Gmail API está funcionando correctamente</b>.</p>"
    });

    console.log("✅ Correo enviado correctamente");
  } catch (err) {
    console.error("❌ Fallo el envío:");
    console.error(err.response?.data || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

