#!/bin/bash

# Script to kill all processes and start the complete development setup
# Usage: ./scripts/restart-dev.sh

# Print colorful message
echo -e "\033[1;34m[INFO]\033[0m Killing all Firebase and Node.js processes..."

# Kill Firebase emulator processes
pkill -f "firebase emulators" || true
echo -e "\033[1;32m[SUCCESS]\033[0m Killed Firebase emulator processes"

# Kill Next.js dev server
pkill -f "next dev" || true
echo -e "\033[1;32m[SUCCESS]\033[0m Killed Next.js dev processes"

# Kill other Node.js processes (be careful with this!)
read -p "Kill all Node.js processes? This might affect other applications. (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pkill -f node || true
  echo -e "\033[1;32m[SUCCESS]\033[0m Killed all Node.js processes"
fi

# Wait a moment for all processes to terminate completely
echo -e "\033[1;34m[INFO]\033[0m Waiting for processes to terminate completely..."
sleep 3

# Clean up any temporary data if needed (optional)
read -p "Clean emulator data for a fresh start? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf .emulator-data
  echo -e "\033[1;32m[SUCCESS]\033[0m Removed emulator data for a fresh start"
fi

# Start the development environment
echo -e "\033[1;34m[INFO]\033[0m Starting complete development environment..."
npm run safe-start:complete

# This script will not reach here if the dev environment starts successfully,
# as the process will stay running in the foreground 