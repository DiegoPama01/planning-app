import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT_DIR = Path(__file__).resolve().parent.parent.parent


def load_env_file(file_path: Path | None = None) -> None:
    env_path = file_path or ROOT_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if not key:
            continue

        if value and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        os.environ.setdefault(key, value)


def get_env(name: str, default: str | None = None, *, required: bool = False) -> str:
    value = os.getenv(name, default)
    if required and (value is None or value == ""):
        raise RuntimeError(f"Missing required environment variable: {name}")
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    return int(value)


def get_list(name: str, default: list[str] | None = None) -> list[str]:
    value = os.getenv(name)
    if value is None:
        return list(default or [])
    return [item.strip() for item in value.split(",") if item.strip()]


def _database_from_url(database_url: str) -> dict[str, object]:
    parsed = urlparse(database_url)
    engine_map = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
        "pgsql": "django.db.backends.postgresql",
    }
    engine = engine_map.get(parsed.scheme)
    if not engine:
        raise RuntimeError("Unsupported DATABASE_URL scheme. Expected PostgreSQL.")

    query = parse_qs(parsed.query)
    return {
        "ENGINE": engine,
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
        "CONN_MAX_AGE": int(
            query.get("conn_max_age", [os.getenv("POSTGRES_CONN_MAX_AGE", "60")])[0]
        ),
        "OPTIONS": {
            "sslmode": query.get("sslmode", [os.getenv("POSTGRES_SSLMODE", "disable")])[
                0
            ],
            "connect_timeout": int(
                query.get(
                    "connect_timeout", [os.getenv("POSTGRES_CONNECT_TIMEOUT", "5")]
                )[0]
            ),
        },
    }


def get_database_config() -> dict[str, object]:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return _database_from_url(database_url)

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": get_env("POSTGRES_DB", required=True),
        "USER": get_env("POSTGRES_USER", required=True),
        "PASSWORD": get_env("POSTGRES_PASSWORD", required=True),
        "HOST": get_env("POSTGRES_HOST", required=True),
        "PORT": get_env("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": get_int("POSTGRES_CONN_MAX_AGE", 60),
        "OPTIONS": {
            "sslmode": get_env("POSTGRES_SSLMODE", "disable"),
            "connect_timeout": get_int("POSTGRES_CONNECT_TIMEOUT", 5),
        },
    }
