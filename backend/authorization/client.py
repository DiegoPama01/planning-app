import json
from dataclasses import dataclass
from urllib import error, request
from uuid import UUID

from django.conf import settings


class OpenFGAError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class TupleKey:
    user: str
    relation: str
    object: str

    def as_dict(self) -> dict[str, str]:
        return {
            "user": self.user,
            "relation": self.relation,
            "object": self.object,
        }


class OpenFGAClient:
    def __init__(self):
        self.config = settings.OPENFGA

    def check(self, *, user: str, relation: str, object: str) -> bool:
        if not self.config["ENABLED"]:
            return True

        response = self._request(
            "POST",
            "/check",
            {
                "tuple_key": TupleKey(user, relation, object).as_dict(),
                "authorization_model_id": self.config["AUTHORIZATION_MODEL_ID"],
            },
        )
        return response.get("allowed") is True

    def write(self, *tuples: TupleKey) -> None:
        if not self.config["ENABLED"] or not tuples:
            return

        payload = {
            "writes": {"tuple_keys": [tuple_key.as_dict() for tuple_key in tuples]},
            "authorization_model_id": self.config["AUTHORIZATION_MODEL_ID"],
        }
        self._request("POST", "/write", payload)

    def provision_user(self, sub: str) -> None:
        # OpenFGA users are identifiers, not records that need to be created.
        # The user becomes known when an installation tuple references user:{sub}.
        return None

    def provision_installation(self, *, installation_id: UUID, user_sub: str) -> None:
        installation = f"installation:{installation_id}"
        for tuple_key in (
            TupleKey(
                user=self.config["PROJECT_OBJECT"],
                relation="project",
                object=installation,
            ),
            TupleKey(
                user=f"user:{user_sub}",
                relation="admin",
                object=installation,
            ),
        ):
            self._write_if_missing(tuple_key)

    def _write_if_missing(self, tuple_key: TupleKey) -> None:
        if self.check(
            user=tuple_key.user,
            relation=tuple_key.relation,
            object=tuple_key.object,
        ):
            return

        try:
            self.write(tuple_key)
        except OpenFGAError as exc:
            # Another request may have created the tuple after the check.
            if "tuple to be written already existed" not in str(exc):
                raise

    def _request(self, method: str, path: str, payload: dict) -> dict:
        body = json.dumps(payload).encode("utf-8")
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if self.config["API_TOKEN"]:
            headers["Authorization"] = f"Bearer {self.config['API_TOKEN']}"

        req = request.Request(
            f"{self.config['API_URL'].rstrip('/')}/stores/{self.config['STORE_ID']}{path}",
            data=body,
            method=method,
            headers=headers,
        )
        try:
            with request.urlopen(req, timeout=self.config["TIMEOUT_SECONDS"]) as response:
                raw_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise OpenFGAError(
                f"OpenFGA request failed with status {exc.code}: {detail}"
            ) from exc
        except error.URLError as exc:
            raise OpenFGAError("Could not reach OpenFGA.") from exc

        return json.loads(raw_body) if raw_body else {}
