#!/bin/sh
set -eu

credentials_path="/tmp/little-scholar-google-credentials.json"
proxy_port="${CLOUD_SQL_PROXY_PORT:-5432}"

if [ -n "${GOOGLE_APPLICATION_CREDENTIALS_BASE64:-}" ] && [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  printf '%s' "$GOOGLE_APPLICATION_CREDENTIALS_BASE64" | base64 -d > "$credentials_path"
  chmod 600 "$credentials_path"
  export GOOGLE_APPLICATION_CREDENTIALS="$credentials_path"
elif [ -n "${GOOGLE_APPLICATION_CREDENTIALS_JSON:-}" ] && [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  printf '%s' "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > "$credentials_path"
  chmod 600 "$credentials_path"
  export GOOGLE_APPLICATION_CREDENTIALS="$credentials_path"
fi

if [ -n "${CLOUD_SQL_INSTANCE_CONNECTION_NAME:-}" ]; then
  if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
    echo "CLOUD_SQL_INSTANCE_CONNECTION_NAME is set, but Google credentials are not configured." >&2
    exit 1
  fi

  cloud-sql-proxy \
    --address 127.0.0.1 \
    --port "$proxy_port" \
    --credentials-file "$GOOGLE_APPLICATION_CREDENTIALS" \
    "$CLOUD_SQL_INSTANCE_CONNECTION_NAME" &
fi

exec node dist/server.js
