#!/bin/bash
# Keep-alive wrapper for chat-service
cd "$(dirname "$0")"

while true; do
  echo "[$(date)] Starting chat-service..."
  bun index.ts
  EXIT_CODE=$?
  echo "[$(date)] Chat-service exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
