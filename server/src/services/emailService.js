// src/services/emailService.js
import { sendEmail } from "../gmailClient.js";
import { config } from "../config/env.js";

export async function sendLoginCodeEmail(to, code, minutes = null) {
  const minutesToUse = minutes || config.LOGIN_CODE_EXP_MINUTES || 10;
  
  const subject = "Código de acceso - MEDHOME";
  
  const text = `Su código de acceso es: ${code}\n\nEste código es válido por ${minutesToUse} minutos.\n\nSi no solicitaste este código, puedes ignorar este mensaje.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">MEDHOME</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Su código de acceso es:</p>
        <div style="background: #f9fafb; border: 2px dashed #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0; letter-spacing: 4px;">${code}</p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          Este código es válido por ${minutesToUse} minutos.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Si no solicitaste este código, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to, subject, text, html });
    console.log(`✅ Email enviado exitosamente a ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    console.error('Detalles del error:', error.response?.data || error);
    
    // Fallback: imprimir en consola si falla el envío
    console.log(`📧 [FALLBACK] Código de acceso para ${to}: ${code}`);
    return { success: false, error: error.message };
  }
}
