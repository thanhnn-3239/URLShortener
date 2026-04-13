#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[verify:impl] Running lint"
npm run lint

echo "[verify:impl] Running type check"
npm run tsc

echo "[verify:impl] Running test suite"
npm run test

if [[ "${VERIFY_SKIP_DOCKER:-0}" == "1" ]]; then
  echo "[verify:impl] Skipping Docker checks (VERIFY_SKIP_DOCKER=1)"
  exit 0
fi

echo "[verify:impl] Building and starting Docker stack"
# Renew anonymous volumes so /app/node_modules is recreated from current package-lock.
docker compose up -d --build --force-recreate --renew-anon-volumes

check_url() {
  local url="$1"
  local expected_status="$2"
  local actual_status

  actual_status="$(curl -s -o /tmp/verify-response.txt -w "%{http_code}" "$url")"
  if [[ "$actual_status" != "$expected_status" ]]; then
    echo "[verify:impl] URL check failed: $url expected $expected_status got $actual_status"
    echo "[verify:impl] Response snippet:"
    head -c 400 /tmp/verify-response.txt || true
    echo
    exit 1
  fi

  echo "[verify:impl] URL ok: $url -> $actual_status"
}

wait_for_url() {
  local url="$1"
  local expected_status="$2"
  local max_attempts="${3:-30}"
  local sleep_seconds="${4:-2}"
  local attempt=1
  local status=""

  while [[ "$attempt" -le "$max_attempts" ]]; do
    status="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
    if [[ "$status" == "$expected_status" ]]; then
      echo "[verify:impl] Ready: $url -> $status"
      return 0
    fi

    echo "[verify:impl] Waiting for $url (attempt $attempt/$max_attempts, got $status)"
    sleep "$sleep_seconds"
    attempt=$((attempt + 1))
  done

  echo "[verify:impl] Timed out waiting for $url to return $expected_status"
  return 1
}

wait_for_url "http://localhost:3000/api/health" "200" 45 2

check_url "http://localhost:3000/" "200"
check_url "http://localhost:3000/api/health" "200"

shorten_status="$(curl -s -o /tmp/verify-shorten-response.txt -w "%{http_code}" \
  -X POST "http://localhost:3000/api/shorten" \
  -H "Content-Type: application/json" \
  -d '{"destination_url":"https://example.com/smoke-check"}')"

if [[ "$shorten_status" != "201" ]]; then
  echo "[verify:impl] URL check failed: POST /api/shorten expected 201 got $shorten_status"
  echo "[verify:impl] Response snippet:"
  head -c 400 /tmp/verify-shorten-response.txt || true
  echo
  exit 1
fi

echo "[verify:impl] URL ok: POST /api/shorten -> $shorten_status"

echo "[verify:impl] Docker smoke checks passed"
