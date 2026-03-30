#!/bin/bash
# Local cron substitute — calls the check runner every 5 minutes
# Usage: bash scripts/local-cron.sh
# Stop with Ctrl+C

URL="https://dev.uptrue.io/api/cron/check-runner"

echo "Starting local cron — hitting $URL every 5 minutes"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running check..."
  curl -s "$URL" | echo "  Response: $(cat)"
  echo ""
  sleep 300
done
