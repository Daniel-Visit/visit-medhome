# Medhome Visits - Next.js App

Sistema de gestión de visitas domiciliarias con check-in geolocalizado.

## Stack

- **Framework**: Next.js 14+ con App Router y TypeScript
- **Base de datos**: MySQL con Prisma ORM
- **Autenticación**: JWT con jose
- **Email**: Gmail API (googleapis)
- **Estilos**: Tailwind CSS 3.x
- **Testing**: Playwright (E2E) y Jest (API)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Configurar base de datos:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run prisma:generate` - Genera cliente de Prisma
- `npm run prisma:migrate` - Ejecuta migraciones
- `npm run prisma:studio` - Abre Prisma Studio
- `npm test` - Ejecuta tests unitarios
- `npm run test:e2e` - Ejecuta tests E2E con Playwright

## Estructura

```
src/
  app/
    api/          # API Routes
    login/        # Páginas de login
    visits/       # Página de visitas
  components/     # Componentes React
  lib/            # Utilidades y helpers
prisma/
  schema.prisma  # Schema de Prisma
tests/
  e2e/           # Tests E2E
  api/           # Tests de API
```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.
