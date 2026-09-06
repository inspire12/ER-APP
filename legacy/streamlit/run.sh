#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_DIR}/.venv"
PYTHON_BIN="${VENV_DIR}/bin/python"

cd "${PROJECT_DIR}"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "[setup] Python 가상환경을 생성합니다."
  python3 -m venv "${VENV_DIR}"
fi

if ! "${PYTHON_BIN}" -c "import streamlit, google.genai, qrcode, PIL" 2>/dev/null; then
  echo "[setup] 필수 패키지를 설치합니다."
  "${PYTHON_BIN}" -m pip install -r "${PROJECT_DIR}/requirements.txt"
fi

echo "[run] ER 스마트 퇴원 안내 시스템을 시작합니다."
echo "[run] 브라우저에서 http://localhost:8501 로 접속하세요."
echo "[run] 종료하려면 Ctrl+C를 누르세요."

exec "${PYTHON_BIN}" -m streamlit run "${PROJECT_DIR}/main.py" \
  --server.address 0.0.0.0 \
  --server.port 8501
