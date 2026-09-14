# Planning App

## Entorno

1. Copia `.env.example` a `.env`.
2. Rellena `.env` con la URL real de PostgreSQL y la configuracion real de Authentik del VPS.
3. Abre el tunel SSH a PostgreSQL y levanta `backend` y `frontend` con el metodo que prefieras.
4. Ejecuta migraciones en el backend con `python manage.py migrate`.
5. Si necesitas un usuario admin: `python manage.py createsuperuser`.

Datos conocidos del despliegue actual:

- VPS: `198.244.150.237`
- Usuario SSH: `ubuntu`
- Authentik publico: `https://auth.diebyte.dev/`

## Arquitectura esperada

- Este proyecto ya no levanta PostgreSQL ni Authentik en local.
- `backend` debe conectarse a la base de datos remota usando `DATABASE_URL` o `POSTGRES_*`.
- Para Docker Desktop, `docker-compose.dev.yml` conecta el backend a PostgreSQL mediante `host.docker.internal`.
- `frontend` debe apuntar al backend real mediante `FRONTEND_PUBLIC_API_BASE_URL`.
- Si activas OIDC, tanto backend como frontend deben usar las URLs publicas reales de Authentik.
- `frontend/public/app-config.json` se genera desde `.env` en cada arranque o build del frontend.
- Si la base de datos solo acepta acceso por SSH, primero debes abrir un tunel al VPS por el puerto `22`.

### Desarrollo con Docker y datos de produccion

Abre una terminal y deja activo el tunel:

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 0.0.0.0:5432:127.0.0.1:5432 ubuntu@198.244.150.237
```

En otra terminal, desde la raiz del proyecto, levanta el backend:

```powershell
docker compose -f docker-compose.dev.yml up --build -d backend
docker compose -f docker-compose.dev.yml logs -f backend
```

El frontend se levanta desde `frontend` con `npm start`. No se inicia ningun PostgreSQL local.

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
- `ng serve` usa `frontend/proxy.conf.json` para reenviar `/api` y `/admin` a `http://127.0.0.1:8000` durante desarrollo.
- El login OIDC vuelve a `FRONTEND_PUBLIC_AUTH_REDIRECT_URI`, por ejemplo `http://localhost:4200/auth/callback`.

## Authentik

- Se deja preparada la estructura de variables para OIDC con Authentik.
- El login del frontend usa Authentik con `authorization_code` + PKCE y completa el intercambio de tokens en el backend.
- Usa siempre las URLs publicas reales del servicio desplegado, no `localhost`, salvo en desarrollo local.
- Para este entorno, el issuer esperado es `https://auth.diebyte.dev/application/o/cuadrant/`.
- Si el alta de usuarios la gestiona Django contra la API de Authentik, configura `AUTHENTIK_SERVICE_TOKEN` en el backend.
- Si el acceso a la app `cuadrant` depende de grupos/entitlements, configura `AUTHENTIK_DEFAULT_GROUPS` para meter a cada usuario nuevo en los grupos autorizados.
- Si el token de servicio no puede listar grupos, usa `AUTHENTIK_DEFAULT_GROUP_IDS` con el UUID del grupo en vez del nombre.
