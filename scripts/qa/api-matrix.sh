#!/usr/bin/env bash
# QA: unauthenticated API matrix. Usage: api-matrix.sh <baseurl>
B=${1:-http://localhost:3100}
row() { printf '%-58s | %-6s | %s\n' "$1" "$2" "$3"; }
call() { # method path [data] [ctype]
  local m=$1 p=$2 d=$3 c=${4:-application/json}
  local out
  if [ -n "$d" ]; then
    out=$(curl -s -o /tmp/qa_body -w '%{http_code}' -X "$m" -H "Content-Type: $c" -d "$d" "$B$p")
  else
    out=$(curl -s -o /tmp/qa_body -w '%{http_code}' -X "$m" "$B$p")
  fi
  row "$m $p" "$out" "$(head -c 200 /tmp/qa_body | tr -d '\n')"
}
echo "=== Inventory persistence (expect 401) ==="
call POST   /api/inventory/reports '{"reportTypeCode":"check_in","inspectionDate":"2026-09-19","inspectorName":"QA"}'
call PATCH  /api/inventory/reports '{"reportId":"11111111-1111-1111-1111-111111111111"}'
call POST   /api/inventory/rooms   '{"reportId":"11111111-1111-1111-1111-111111111111","name":"Hall"}'
call DELETE /api/inventory/rooms   '{"roomId":"11111111-1111-1111-1111-111111111111"}'
call POST   /api/inventory/items   '{"roomId":"11111111-1111-1111-1111-111111111111","name":"Door"}'
call DELETE /api/inventory/items   '{"itemId":"11111111-1111-1111-1111-111111111111"}'
call DELETE /api/inventory/upload  '{"path":"reports/x/y.jpg"}'
printf '%-58s | ' "POST /api/inventory/upload (multipart)"
curl -s -o /tmp/qa_body -w '%s' '%{http_code}' -X POST -F 'file=@/dev/null;filename=a.jpg;type=image/jpeg' -F 'reportId=11111111-1111-1111-1111-111111111111' "$B/api/inventory/upload" ; echo -n ' | '; head -c 200 /tmp/qa_body; echo
echo
echo "=== Other routes ==="
call POST /api/payments/create-intent '{"amount":1,"currency":"gbp"}'
call GET  /api/properties
call GET  '/api/lookups?table=ref_portal_roles'
call GET  '/api/lookups?table=evil'
call GET  /api/lettings/available
call GET  /api/health
call POST /api/inventory/analyse '{"rooms":[{"name":"Hall","mediaUrls":[],"notes":["scuff"]}]}'
echo
echo "=== Redirects / removed routes ==="
for p in /portfolio /portfolio/some-case-study /services/property-management /services/lettings-consultancy; do
  printf '%-58s | %s\n' "GET $p" "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' "$B$p")"
done
