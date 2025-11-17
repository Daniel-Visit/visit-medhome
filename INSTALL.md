# Instrucciones de Instalación

## Pasos para completar la migración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Verificar versión de Tailwind (DEBE ser 3.x, NO 4.x)

```bash
npm list tailwindcss
```

Si muestra versión 4.x, desinstalar e instalar específicamente 3.4.18:

```bash
npm uninstall tailwindcss
npm install -D tailwindcss@^3.4.18
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
- `DATABASE_URL` - URL de conexión a MySQL
- `JWT_SECRET` - Secreto para JWT
- Variables de Gmail API (ya configuradas en server/.env)

### 4. Configurar Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura creada

- ✅ Next.js 14+ con TypeScript y App Router
- ✅ Prisma schema con todos los modelos
- ✅ API Routes: `/api/auth/*` y `/api/visits/*`
- ✅ Páginas: `/login`, `/login/code`, `/visits`
- ✅ Componente VisitsAccordion con UI exacto del Mock.html usando Tailwind
- ✅ Tailwind CSS 3.x configurado
- ✅ Testing configurado (Playwright E2E y Jest)

## Notas importantes

- El UI replica EXACTAMENTE el Mock.html usando Tailwind CSS
- Las rutas de API están integradas en Next.js (no Express separado)
- La autenticación usa JWT con jose (no jsonwebtoken)
- Los emails se envían usando Gmail API directamente (no Nodemailer)
- Tailwind CSS es versión 3.4.18 (NO 4.x)




