#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
printf '\nTyping Arena AI · этап 1\nАдрес: http://127.0.0.1:3000\nДля остановки нажмите Control+C. Оставьте это окно открытым.\n\n'
if curl -fsS --max-time 2 http://127.0.0.1:3000 2>/dev/null | grep -q 'Typing Arena'; then
  open http://127.0.0.1:3000
  printf 'Сайт уже запущен.\n'
  exit 0
fi
(
  for _ in {1..45}; do
    if curl -fsS --max-time 1 http://127.0.0.1:3000 2>/dev/null | grep -q 'Typing Arena'; then
      open http://127.0.0.1:3000
      exit 0
    fi
    sleep 1
  done
) &
exec "$ROOT/scripts/run.sh" dev
