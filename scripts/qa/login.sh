#!/usr/bin/env bash
# QA: attempt a NextAuth credentials login and report the resulting session.
# usage: login.sh <base> <provider> <email> <password> <cookiejar>
B=$1; P=$2; E=$3; PW=$4; J=$5
rm -f "$J"
CSRF=$(curl -s -c "$J" "$B/api/auth/csrf" | sed -E 's/.*"csrfToken":"([^"]+)".*/\1/')
CODE=$(curl -s -o /tmp/login_out -w '%{http_code}' -b "$J" -c "$J" -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=$E" --data-urlencode "password=$PW" \
  --data-urlencode "json=true" "$B/api/auth/callback/$P")
echo "callback HTTP $CODE  body: $(head -c 200 /tmp/login_out)"
echo "session: $(curl -s -b "$J" "$B/api/auth/session")"
