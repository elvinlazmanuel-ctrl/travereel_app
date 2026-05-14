#!/bin/bash
cd /home/z/my-project

# Kill any existing server
pkill -f "server.js" 2>/dev/null
sleep 1

# Start the production server
node .next/standalone/server.js &
SERVER_PID=$!

# Wait for it to start
sleep 2

# If it died, restart (the first instance sometimes gets killed)
if ! kill -0 $SERVER_PID 2>/dev/null; then
    node .next/standalone/server.js &
    SERVER_PID=$!
    sleep 2
fi

echo "Server PID: $SERVER_PID"

# Start chat service
cd mini-services/chat-service
pkill -f "chat-service" 2>/dev/null
sleep 1
bun --hot index.ts &
CHAT_PID=$!
cd /home/z/my-project

echo "Chat PID: $CHAT_PID"
echo "Both services started"

# Keep the script running
wait
