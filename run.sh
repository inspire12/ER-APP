#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_DIR}"

if [[ ! -d node_modules ]]; then
  echo "[setup] 패키지를 설치합니다."
  pnpm install
fi

echo "[run] http://localhost:3000 에서 Next.js MVP를 시작합니다."
exec pnpm dev
