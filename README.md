# Planning App

## Entorno

1. Copia `.env.example` a `.env`.
2. Rellena `.env` con la URL real de PostgreSQL y la configuracion real de Authentik del VPS.
3. Levanta solo `backend` y `frontend` con el metodo que prefieras.
4. Ejecuta migraciones en el backend con `python manage.py migrate`.
5. Si necesitas un usuario admin: `python manage.py createsuperuser`.

Datos conocidos del despliegue actual:

- VPS: `198.244.150.237`
- Usuario SSH: `ubuntu`
- Authentik publico: `https://auth.diebyte.dev/`

## Arquitectura esperada

- Este proyecto ya no levanta PostgreSQL ni Authentik en local.
- `backend` debe conectarse a la base de datos remota usando `DATABASE_URL` o `POSTGRES_*`.
- `frontend` debe apuntar al backend real mediante `FRONTEND_PUBLIC_API_BASE_URL`.
- Si activas OIDC, tanto backend como frontend deben usar las URLs publicas reales de Authentik.
- `frontend/public/app-config.json` se genera desde `.env` en cada arranque o build del frontend.
- Si la base de datos solo acepta acceso por SSH, primero debes abrir un tunel al VPS por el puerto `22`.

## Backend

- El backend ya no usa SQLite como fallback.
- Debe recibir PostgreSQL mediante `DATABASE_URL` o las variables `POSTGRES_*`.
- El archivo `.env` se carga al iniciar `manage.py`, `wsgi.py` y `asgi.py`.
- Para checks manuales puedes usar `pip install -r backend/requirements.txt` y luego `python manage.py check` desde `backend`.
- Ejemplo de tunel SSH para PostgreSQL: `ssh -N -L 5432:127.0.0.1:5432 ubuntu@198.244.150.237`

## Frontend

- La configuracion publica se genera en `frontend/public/app-config.json` a partir de `.env`.
- `npm run start` y `npm run build` regeneran ese archivo automaticamente.
- Las variables publicas usan el prefijo `FRONTEND_PUBLIC_`.
- En local, el dev server suele quedar en `http://localhost:4200`.

## Authentik

- Se deja preparada la estructura de variables para OIDC con Authentik.
- Si no quieres usar login OIDC todavia, deja `AUTHENTIK_ENABLED=false` y `FRONTEND_PUBLIC_AUTH_ENABLED=false`.
- Si lo activas, usa siempre las URLs publicas reales del servicio desplegado, no `localhost`.
- Para este entorno, el issuer esperado seria `https://auth.diebyte.dev/application/o/planning-app/`.
