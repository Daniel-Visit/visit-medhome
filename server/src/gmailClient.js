// src/gmailClient.js
import { google } from "googleapis";
import { config } from "./config/env.js";

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER
} = config;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_USER) {
  console.error("[gmailClient] Faltan variables de entorno de Gmail");
}

const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  "http://localhost" // debe coincidir exactamente con el redirect_uri usado al generar el token
);

oauth2Client.setCredentials({
  refresh_token: GMAIL_REFRESH_TOKEN,
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Si hay HTML, usar formato multipart
    let messageParts;
    if (html) {
      messageParts = [
        `From: ${GMAIL_USER}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=boundary123",
        "",
        "--boundary123",
        "Content-Type: text/plain; charset=utf-8",
        "",
        text || "Este es un mensaje HTML. Por favor, habilita HTML para verlo.",
        "",
        "--boundary123",
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
        "",
        "--boundary123--"
      ];
    } else {
      messageParts = [
        `From: ${GMAIL_USER}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "",
        text,
      ];
    }

    const rawMessage = Buffer.from(messageParts.join("\r\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    return res.data;
  } catch (err) {
    console.error("[sendEmail] Error enviando correo:");
    console.error(err.response?.data || err);
    throw err;
  }
}

