# Proyecto: Web app de visitas domiciliarias con check-in geolocalizado

Quiero que construyas una app mínima pero funcional con este alcance:

- Login **sin contraseña** usando RUT + código enviado por correo.
- Listado de **visitas de hoy** para el profesional (web app mobile-first).
- Confirmación de asistencia:
  - El front pide geolocalización al navegador.
  - El backend valida radio de distancia y ventana horaria con fórmula de Haversine.
  - Registra el check-in en MySQL.

---

## 0. Reglas y stack

- Monorepo simple: `server/` (Node + Express) y `client/` (React).
- Lenguaje: **JavaScript**, sin TypeScript (para ir rápido).
- Frontend:
  - React + React Router.
  - NO usar Tailwind 4. Puedes usar:
    - CSS plano (preferible) o
    - Tailwind 3.x si te ayuda, pero no Tailwind 4.
- Backend:
  - Node.js + Express.
  - MySQL local como base de datos (luego lo conectaremos a infra real).
- Emails:
  - Usar **Nodemailer + SMTP**.
  - Para desarrollo, basta imprimir en consola el código, pero deja lista la integración con SMTP leyendo variables de entorno.

---

## 1. Estructura de carpetas

Crea esta estructura:

```txt
root/
  server/
    src/
      index.js
      config/
        env.js
      db/
        connection.js
        migrations.sql  # opcional, para crear tablas
      middleware/
        auth.js
      routes/
        authRoutes.js
        visitRoutes.js
      services/
        emailService.js
        authService.js
        visitService.js
      utils/
        haversine.js
    package.json
  client/
    src/
      main.jsx
      App.jsx
      routes/
        AppRoutes.jsx
      pages/
        LoginRutPage.jsx
        LoginCodePage.jsx
        VisitsPage.jsx
      components/
        VisitsApp.jsx
      styles/
        visits.css
        global.css
    package.json
  README.md
2. Base de datos MySQL (local)
Supón un MySQL local:

DB: medhome_visits

HOST: 127.0.0.1

USER: root

PASS: configurable vía .env

En server/src/db/migrations.sql define estas tablas:

sql
Copiar código
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  rut           VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  professional_id  BIGINT NOT NULL,
  patient_name     VARCHAR(150) NOT NULL,
  address          VARCHAR(255) NOT NULL,
  lat              DECIMAL(9,6) NOT NULL,
  lng              DECIMAL(9,6) NOT NULL,
  scheduled_start  DATETIME NOT NULL,
  scheduled_end    DATETIME NOT NULL,
  status           ENUM('PENDING','IN_PROGRESS','DONE') DEFAULT 'PENDING',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visits_user FOREIGN KEY (professional_id)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS login_codes (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) DEFAULT 0,
  used_at     DATETIME NULL,
  CONSTRAINT fk_login_codes_user FOREIGN KEY (user_id)
    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS visit_checkins (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  visit_id        BIGINT NOT NULL,
  professional_id BIGINT NOT NULL,
  checkin_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lat             DECIMAL(9,6) NOT NULL,
  lng             DECIMAL(9,6) NOT NULL,
  distance_m      INT NOT NULL,
  is_valid_time   TINYINT(1) NOT NULL,
  is_valid_radius TINYINT(1) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkins_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
  CONSTRAINT fk_checkins_user  FOREIGN KEY (professional_id) REFERENCES users(id)
);
Crea en server/src/db/connection.js una conexión MySQL (mysql2 o similar) y un script en package.json para correr estas migrations al iniciar.

3. Backend: configuración y utils
3.1 server/src/config/env.js
Lee estas variables desde .env:

env
Copiar código
PORT=4000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=medhome_visits

JWT_SECRET=un_secreto_seguro

LOGIN_CODE_EXP_MINUTES=10
CHECKIN_RADIUS_METERS=150
CHECKIN_MINUTES_BEFORE_START=10
CHECKIN_MINUTES_AFTER_START=20

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
Exporta un objeto config con estos valores.

3.2 server/src/utils/haversine.js
Implementa:

js
Copiar código
export function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;

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
4. Backend: servicio de emails
4.1 server/src/services/emailService.js
Usa Nodemailer con SMTP:

js
Copiar código
import nodemailer from "nodemailer";
import { config } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS
  }
});

export async function sendLoginCodeEmail(to, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px;">
      <p>Su código de acceso es:</p>
      <p style="font-size: 24px; font-weight: bold; margin: 16px 0;">${code}</p>
      <p>Este código es válido por ${config.LOGIN_CODE_EXP_MINUTES} minutos.</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"MEDHOME" <no-reply@medhome.cl>`,
    to,
    subject: "Código de acceso",
    html
  });
}
En desarrollo, si no hay SMTP configurado, puedes imprimir el código en consola.

5. Backend: auth sin password (RUT + código)
5.1 Middleware de auth server/src/middleware/auth.js
Lee cookie auth_token.

Verifica JWT (JWT_SECRET).

Si ok → req.user = { id, rut, name }.

Si no → 401.

5.2 Rutas de auth server/src/routes/authRoutes.js
Monta dos endpoints:

POST /api/auth/request-code
Body:

json
Copiar código
{
  "rut": "11111111-1"
}
Pasos:

Normalizar RUT (sin puntos, guion estándar).

Buscar user por rut.

Siempre devolver mensaje neutro (sin filtrar si existe o no).

Si el user existe:

Generar código numérico de 6 dígitos.

Hashear con bcrypt.

Insertar en login_codes con expires_at = now + LOGIN_CODE_EXP_MINUTES y used = 0.

Llamar a sendLoginCodeEmail(user.email, code).

Respuesta:

json
Copiar código
{
  "ok": true,
  "message": "Si el RUT está registrado, se ha enviado un código a su correo."
}
POST /api/auth/verify-code
Body:

json
Copiar código
{
  "rut": "11111111-1",
  "code": "123456"
}
Pasos:

Normalizar RUT.

Buscar user por rut.

Buscar el último login_codes de ese user con used = 0 y expires_at > now.

Comparar code con code_hash usando bcrypt.

Si falla → ok: false, message: "Código inválido o expirado.".

Si es correcto:

Marcar used = 1, used_at = now.

Generar JWT con { userId: user.id, rut: user.rut, name: user.name }.

Setear cookie httpOnly auth_token.

Responder:

json
Copiar código
{
  "ok": true,
  "user": {
    "id": 1,
    "rut": "11111111-1",
    "name": "Juan Profesional"
  }
}
6. Backend: rutas de visitas
6.1 GET /api/visits/today
Protegido por auth middleware.

Usa req.user.id como professional_id.

Query:

sql
Copiar código
SELECT *
FROM visits
WHERE professional_id = ?
  AND DATE(scheduled_start) = CURDATE()
ORDER BY scheduled_start;
Respuesta:

json
Copiar código
{
  "ok": true,
  "visits": [ ... ]
}
6.2 POST /api/visits/:id/checkin
Protegido por auth middleware.

Body:

json
Copiar código
{
  "lat": -33.4265,
  "lng": -70.6170
}
Lógica:

Buscar visita por id y professional_id = req.user.id.

Calcular ventana horaria:

text
Copiar código
startAllowed = scheduled_start - CHECKIN_MINUTES_BEFORE_START
endAllowed   = scheduled_start + CHECKIN_MINUTES_AFTER_START
isValidTime  = now >= startAllowed && now <= endAllowed
Calcular distancia con distanceInMeters(visit.lat, visit.lng, body.lat, body.lng).

isValidRadius = distance <= CHECKIN_RADIUS_METERS.

Insertar en visit_checkins con todos los campos.

Si ambos válidos, opcionalmente actualizar visits.status.

Respuesta éxito:

json
Copiar código
{
  "ok": true,
  "isValidTime": true,
  "isValidRadius": true,
  "distanceMeters": 47,
  "message": "Asistencia registrada correctamente."
}
Respuesta error validación:

json
Copiar código
{
  "ok": false,
  "isValidTime": false,
  "isValidRadius": true,
  "distanceMeters": 200,
  "message": "La asistencia no puede registrarse: fuera del horario permitido."
}
7. Backend: server/src/index.js
Configura Express:

express.json().

CORS para http://localhost:5173 (o el puerto del client).

Cookie parser.

Rutas:

/api/auth/...

/api/visits/...

Levanta en PORT (por defecto 4000).

8. Frontend: React + React Router
Usar Vite + React.

8.1 Estructura básica
main.jsx: monta <App />.

App.jsx: monta <AppRoutes />.

routes/AppRoutes.jsx:

Define rutas:

/login → LoginRutPage

/login/verify → LoginCodePage

/visits → VisitsPage

8.2 Páginas
LoginRutPage.jsx
Form simple con:

input RUT

botón “Enviar código”

Al submit:

POST /api/auth/request-code.

Guarda el RUT normalizado en localStorage y/o contexto.

Redirige a /login/verify.

LoginCodePage.jsx
Muestra el RUT (read-only).

Campo code.

Botón “Ingresar”.

Al submit:

POST /api/auth/verify-code.

Si ok === true, redirigir a /visits.

VisitsPage.jsx
Al montar:

GET /api/visits/today (con credenciales/cookies).

Guarda visitas en estado.

Usa el componente VisitsApp (ver más abajo) pasándole la lista de visitas y un callback para onConfirmCheckin(visitId):

navigator.geolocation.getCurrentPosition → lat/lng.

Llama a POST /api/visits/:id/checkin.

Muestra el resultado en el UI (mensaje debajo de la tarjeta de esa visita).

9. Frontend: componente VisitsApp y CSS
En client/src/components/VisitsApp.jsx y client/src/styles/visits.css usa el front que ya proporcioné (layout mobile/light, acordeón, mapa fake), adaptado a:

Recibir visits como props (en lugar de array hardcodeado).

Recibir onConfirm(visit) como prop para ejecutar el check-in.

Si hace falta, puedo pegar el código inicial, pero la idea es:

jsx
Copiar código
export default function VisitsApp({ visits, onConfirm }) {
  // mismo layout que el HTML/CSS entregado,
  // con estado de acordeón y llamada a onConfirm(visit) al hacer clic en el botón.
}
El archivo visits.css es el mismo que ya generamos.

En global.css solo define resets básicos si los necesitas.

10. Scripts y arranque
En server/package.json:
dev: nodemon index.js

migrate: script para ejecutar migrations.sql (o hazlo en el boot si es más rápido).

En client/package.json:
dev: Vite dev server (ej. puerto 5173).

En el README.md del root:
Instrucciones:

Configurar .env en server/.

Crear base de datos medhome_visits en MySQL local.

Ejecutar migrations.

cd server && npm install && npm run dev.

cd client && npm install && npm run dev.

Abrir http://localhost:5173.

Objetivo
Con todo lo anterior, quiero que:

En un día de trabajo quede:

Autenticación por RUT + código funcional (aunque el mail sea consola en dev).

Listado de visitas de hoy desde MySQL.

Check-in con navigator.geolocation y validación en backend con Haversine.

UI de visitas igual (o muy similar) al mock mobile/light que describimos.