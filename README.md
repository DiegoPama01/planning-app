# Planning App

## Entorno local

1. Revisa `.env` y ajusta credenciales si hace falta.
2. Levanta toda la app con `docker compose up --build`.
3. Ejecuta migraciones con `docker compose exec backend python manage.py migrate`.
4. Si necesitas un usuario admin: `docker compose exec backend python manage.py createsuperuser`.
5. Accede al frontend en `http://localhost:4200` y al backend en `http://localhost:8000`.

## Produccion / VPS

- Tienes una plantilla lista en `.env.production`.
- Antes de subirla al VPS, cambia como minimo `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`, dominios y cualquier valor de Authentik.
- Si usas el stack Docker tambien en VPS, normalmente copiaras ese archivo como `.env` en el servidor antes de levantar los servicios.

## Servicios Docker

- `postgres`: base de datos PostgreSQL local.
- `backend`: Django en `http://localhost:8000`.
- `frontend`: Angular dev server en `http://localhost:4200`.
- El backend usa `postgres` como hostname interno dentro de Docker.
- El frontend genera su config publica desde `.env` al arrancar.

## Backend

- El backend ya no usa SQLite como fallback.
- Debe recibir PostgreSQL mediante `DATABASE_URL` o las variables `POSTGRES_*`.
- El archivo `.env` se carga al iniciar `manage.py`, `wsgi.py` y `asgi.py`.
- Para checks manuales fuera de Docker puedes usar `pip install -r backend/requirements.txt` y luego `python manage.py check` desde `backend`.

## Frontend

- La configuracion publica se genera en `frontend/public/app-config.json` a partir de `.env`.
- `npm run start` y `npm run build` regeneran ese archivo automaticamente.
- Las variables publicas usan el prefijo `FRONTEND_PUBLIC_`.
- Dentro de Docker el frontend expone el dev server en `0.0.0.0:4200`.

## Authentik

- Se deja preparada la estructura de variables para OIDC con Authentik.
- La integracion funcional todavia requiere decidir el flujo final de autenticacion.
- Hasta entonces, `AUTHENTIK_ENABLED=false` y `FRONTEND_PUBLIC_AUTH_ENABLED=false` mantienen el comportamiento actual.
