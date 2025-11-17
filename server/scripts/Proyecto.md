# Proyecto: Medhome Visits — Next.js (App Router) + Gmail API + MySQL

Quiero que construyas una app en **Next.js (App Router, TypeScript)** con el siguiente alcance:

- Login sin contraseña:
  - El profesional ingresa su **RUT**.
  - El backend envía un **código de 6 dígitos** por correo usando **Gmail API** (NO Nodemailer).
  - El profesional ingresa ese código y se crea una sesión (JWT en cookie httpOnly).
- Una vez logueado:
  - Ve sus **visitas agendadas para hoy**.
  - Selecciona una visita en un acordeón mobile-friendly (como el mock que te doy más abajo).
  - La app pide **geolocalización** (navigator.geolocation).
  - Hace check-in:
    - El backend calcula distancia con **Haversine** entre la ubicación actual y la del domicilio del paciente.
    - Valida que esté dentro de un radio configurable (ej: 150 metros).
    - Valida que el horario esté dentro de una ventana configurable respecto a `scheduled_start`.
    - Guarda el registro de check-in en BD.

---

## 1. Stack y configuración

- Framework: **Next.js 14+** con **App Router** y **TypeScript**.
- Deployment objetivo: **Vercel** (pero primero que funcione en local).
- Base de datos: **MySQL** (puede ser local en dev).
- ORM: **Prisma**.
- Email: **Gmail API vía `googleapis`**, sin Nodemailer.
- Auth:
  - JWT firmado con `jose` y guardado en cookie httpOnly (`auth_token`).
  - No usar NextAuth; auth es muy simple (RUT + código).

### Comandos base (para que los dejes listos en README)

```bash
npx create-next-app@latest medhome-visits \
  --typescript \
  --app \
  --eslint \
  --src-dir \
  --no-tailwind \
  --import-alias "@/*"
Nota: sin Tailwind. Usaremos CSS Modules o estilos simples.

2. Estructura de carpetas
Dentro del proyecto generado, quiero esta estructura principal:

txt
Copiar código
medhome-visits/
  prisma/
    schema.prisma
  src/
    app/
      layout.tsx
      page.tsx                 # redirige a /visits si logueado, si no a /login
      login/
        page.tsx               # formulario de RUT
      login/
        code/
          page.tsx             # formulario de código
      visits/
        page.tsx               # lista de visitas de hoy + acordeón + check-in
      api/
        auth/
          request-code/
            route.ts
          verify-code/
            route.ts
          me/
            route.ts
        visits/
          today/
            route.ts
          [id]/
            checkin/
              route.ts
    components/
      VisitsAccordion.tsx
    lib/
      db.ts                    # Prisma client
      auth.ts                  # JWT helpers + middleware server-side
      gmail.ts                 # Gmail API client (googleapis)
      haversine.ts             # función distanceInMeters
      time.ts                  # helpers para ventanas horarias
3. Prisma + MySQL
En prisma/schema.prisma usar:

prisma
Copiar código
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  rut       String   @unique
  name      String
  email     String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  visits    Visit[]
  codes     LoginCode[]
}

model Visit {
  id             Int      @id @default(autoincrement())
  professional   User     @relation(fields: [professionalId], references: [id])
  professionalId Int

  patientName    String
  address        String
  lat            Float
  lng            Float

  scheduledStart DateTime
  scheduledEnd   DateTime
  status         VisitStatus @default(PENDING)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  checkins       VisitCheckin[]
}

model LoginCode {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id])
  userId    Int

  codeHash  String
  createdAt DateTime @default(now())
  expiresAt DateTime
  used      Boolean  @default(false)
  usedAt    DateTime?

  @@index([userId])
}

model VisitCheckin {
  id              Int      @id @default(autoincrement())
  visit           Visit    @relation(fields: [visitId], references: [id])
  visitId         Int

  professional    User     @relation(fields: [professionalId], references: [id])
  professionalId  Int

  checkinTime     DateTime @default(now())
  lat             Float
  lng             Float
  distanceMeters  Int
  isValidTime     Boolean
  isValidRadius   Boolean

  createdAt       DateTime @default(now())
}

enum VisitStatus {
  PENDING
  IN_PROGRESS
  DONE
}
En .env:

env
Copiar código
DATABASE_URL="mysql://root:password@localhost:3306/medhome_visits"

JWT_SECRET="cualquier_clave_segura_mas_larga"
CHECKIN_RADIUS_METERS=150
CHECKIN_MINUTES_BEFORE_START=10
CHECKIN_MINUTES_AFTER_START=20

# Gmail API (ya configurado en el proyecto de Google)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_SENDER="visits.medhome@gmail.com"
Scripts en package.json:

json
Copiar código
"prisma:migrate": "prisma migrate dev",
"prisma:generate": "prisma generate"
4. Librerías a instalar
bash
Copiar código
npm install @prisma/client
npm install -D prisma
npm install googleapis jose
5. Helpers en src/lib
5.1 db.ts
ts
Copiar código
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
5.2 haversine.ts
ts
Copiar código
export function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
5.3 time.ts
ts
Copiar código
export function getCheckinWindow(
  scheduledStart: Date,
  minutesBefore: number,
  minutesAfter: number
) {
  const startAllowed = new Date(scheduledStart);
  startAllowed.setMinutes(startAllowed.getMinutes() - minutesBefore);

  const endAllowed = new Date(scheduledStart);
  endAllowed.setMinutes(endAllowed.getMinutes() + minutesAfter);

  return { startAllowed, endAllowed };
}
5.4 auth.ts (JWT + helpers server-side)
Usar jose:

ts
Copiar código
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

export type AuthPayload = {
  userId: number;
  rut: string;
  name: string;
};

export async function signAuthToken(payload: AuthPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_MAX_AGE_SECONDS}s`)
    .sign(JWT_SECRET);
  return token;
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as AuthPayload;
}

export function setAuthCookie(token: string) {
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: JWT_MAX_AGE_SECONDS,
  });
}

export async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
5.5 gmail.ts (solo Gmail API, sin Nodemailer)
ts
Copiar código
import { google } from "googleapis";

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_SENDER
} = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) {
  console.warn("[gmail] Faltan variables de entorno de Gmail");
}

const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

oauth2Client.setCredentials({
  refresh_token: GMAIL_REFRESH_TOKEN,
});

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const messageParts = [
    `From: ${GMAIL_SENDER}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
  ];

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
}

export async function sendLoginCodeEmail(to: string, code: string, minutes = 10) {
  const subject = "Código de acceso";
  const text =
    `Tu código de acceso es: ${code}\n\n` +
    `Este código es válido por ${minutes} minutos.\n\n` +
    `Si no solicitaste este código, puedes ignorar este correo.`;

  return sendEmail({ to, subject, text });
}
6. API Routes (App Router)
Todas bajo src/app/api.

6.1 POST /api/auth/request-code
src/app/api/auth/request-code/route.ts:

Body: { rut: string }.

Normalizar RUT (sin puntos, guion estándar).

Buscar user por rut.

Responder siempre con mensaje neutro.

Si hay user:

Generar código de 6 dígitos.

Hashear con bcrypt o crypto (puedes usar bcryptjs).

Guardar en LoginCode con expiresAt = now + LOGIN_CODE_EXP_MINUTES.

Llamar sendLoginCodeEmail(user.email, code).

Respuesta:

json
Copiar código
{ "ok": true, "message": "Si el RUT está registrado, se ha enviado un código a su correo." }
6.2 POST /api/auth/verify-code
src/app/api/auth/verify-code/route.ts:

Body: { rut: string, code: string }.

Normalizar RUT.

Buscar user.

Buscar último LoginCode de ese user:

used = false

expiresAt > now

Comparar código (hash).

Si falla: 400 { ok: false, message: "Código inválido o expirado." }.

Si ok:

Marcar used = true, usedAt = now.

Crear JWT (signAuthToken).

Guardar en cookie (setAuthCookie).

Responder:

json
Copiar código
{
  "ok": true,
  "user": { "id": user.id, "rut": user.rut, "name": user.name }
}
6.3 GET /api/auth/me
Devuelve el usuario si el JWT es válido:

Usar getAuthUser().

Si null → 401.

Si existe → devolver { ok: true, user: payload }.

6.4 GET /api/visits/today
Requiere auth (usar getAuthUser()).

Buscar visitas del usuario:

ts
Copiar código
const today = new Date();
const startOfDay = new Date(today);
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date(today);
endOfDay.setHours(23, 59, 59, 999);

const visits = await prisma.visit.findMany({
  where: {
    professionalId: auth.userId,
    scheduledStart: {
      gte: startOfDay,
      lte: endOfDay,
    },
  },
  orderBy: {
    scheduledStart: "asc",
  },
});
Devolver { ok: true, visits }.

6.5 POST /api/visits/[id]/checkin
En src/app/api/visits/[id]/checkin/route.ts:

Requiere auth.

Body: { lat: number, lng: number }.

Buscar visita por id y professionalId = auth.userId.

Si no existe → 404.

Calcular ventana de tiempo con getCheckinWindow usando envs:

CHECKIN_MINUTES_BEFORE_START

CHECKIN_MINUTES_AFTER_START

Calcular distancia con distanceInMeters(visit.lat, visit.lng, body.lat, body.lng).

isValidRadius = distance <= CHECKIN_RADIUS_METERS.

isValidTime = now in [startAllowed, endAllowed].

Crear VisitCheckin con todos los datos.

Opcional:

Si ambos true → actualizar Visit.status = DONE (o IN_PROGRESS).

Responder:

json
Copiar código
{
  "ok": true,
  "isValidTime": true,
  "isValidRadius": true,
  "distanceMeters": 47,
  "message": "Asistencia registrada correctamente."
}
7. UI en Next (App Router)
7.1 src/app/login/page.tsx
Form simple:

Input RUT (texto).

Botón “Enviar código”.

onSubmit:

fetch("/api/auth/request-code", { method: "POST", body: JSON.stringify({ rut }) }).

Guardar RUT en localStorage.

Redirigir a /login/code.

7.2 src/app/login/code/page.tsx
Leer RUT desde localStorage en useEffect.

Form:

Campo código.

Botón “Ingresar”.

onSubmit:

POST /api/auth/verify-code.

Si ok → router.push("/visits").

Mostrar errores si corresponde.

7.3 src/app/visits/page.tsx
Server component que:

Llama server-side a /api/visits/today usando fetch interno o directamente Prisma + getAuthUser.

Si no hay usuario → redirigir a /login.

Pasa visits a un Client Component VisitsAccordion que implementa el mock mobile.

8. Componente VisitsAccordion.tsx
Tomar como base el mock React que ya te di:

Acordeón de visitas de hoy.

Tarjeta de paciente + “mapa” estilizado.

Botón “Confirmar asistencia a esta visita”.

Adaptarlo a props:

ts
Copiar código
type Visit = {
  id: number;
  patientName: string;
  address: string;
  lat: number;
  lng: number;
  scheduledStart: string; // ISO
  scheduledEnd: string;   // ISO
  status: "PENDING" | "IN_PROGRESS" | "DONE";
};

type Props = {
  visits: Visit[];
};
En el botón:

navigator.geolocation.getCurrentPosition(...).

Luego fetch("/api/visits/" + visit.id + "/checkin", { method: "POST", body: { lat, lng } }).

Mostrar mensaje devuelto por API debajo de la tarjeta (estado local statusMessage por visita).

9. CSS / estilos
Usar CSS Modules o un src/app/globals.css.

Tomar el CSS que ya generamos para la versión React standalone y adaptarlo a clases en el componente.

Mantener estilo mobile, light mode, sin emojis.

10. Checklist para terminar en 1 día
Crear proyecto Next con App Router + TS.

Configurar Prisma + MySQL + migraciones.

Implementar lib/* (db, auth, gmail, haversine, time).

Implementar API routes:

/api/auth/request-code

/api/auth/verify-code

/api/auth/me

/api/visits/today

/api/visits/[id]/checkin

Implementar páginas:

/login

/login/code

/visits

Implementar VisitsAccordion con el UI mock mobile.

Probar end-to-end:

RUT → correo con código → validar código → ver visitas → confirmar asistencia → revisar BD.

Por favor crea TODO esto con código funcional, usando los nombres de archivos y estructura indicados.