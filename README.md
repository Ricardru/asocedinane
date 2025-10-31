## Compra-Venta App (Next.js + Supabase)

Aplicación Next.js con Supabase preparada para correr de forma local y desplegar desde GitHub (Vercel recomendado). Este documento resume configuración de entorno, ejecución local y opciones de despliegue.

## Requisitos

- Node.js 18+ (recomendado LTS)
- Cuenta de Supabase (con proyecto y credenciales)
- Variables de entorno configuradas

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
# Cliente (se expone en el navegador)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Servidor (NO se expone en el navegador)
SUPABASE_SERVICE_ROLE_KEY=...
```

En producción (Vercel/Render/etc.), configura estas variables en el panel de la plataforma (Environment Variables/Secrets).

## Ejecutar en local

```powershell
cd compra-venta-app
npm install
npm run dev
# abre http://localhost:3000
```

## Build y ejecución en modo producción local

```powershell
npm run build
npm run start
# abre http://localhost:3000
```

## Despliegue recomendado (Vercel con GitHub)

1. Sube el repo a GitHub.
2. En Vercel, crea un proyecto y conecta el repo.
3. En “Root Directory” indica: `compra-venta-app`.
4. Añade variables de entorno en Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
5. Cada push a `main` generará un deploy automáticamente (Preview en PRs y Production en main).

## CI (GitHub Actions)

Este repo incluye un workflow de CI que verifica build de la app. Si quieres publicar a GitHub Pages, ten en cuenta que Next.js con SSR/APIs no es soportado en Pages (sólo sitios estáticos vía `next export`).

## Notas de seguridad

- No subas `.env*` al repositorio.
- La clave `SUPABASE_SERVICE_ROLE_KEY` es sólo para servidor (rutas API/CI). Nunca llamarla desde el navegador.
- En este proyecto, el cliente del navegador usa únicamente la `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Problemas comunes

- Si no carga imágenes de Supabase Storage y tu bucket es privado, el frontend intenta usar signed URLs como fallback en áreas críticas (e.g., Alumnos). Verifica que las políticas RLS/Storage estén correctamente configuradas.
- Si el dev server no inicia, revisa la consola de PowerShell y asegura Node 18+.
