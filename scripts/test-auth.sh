#!/bin/bash

# Set the color codes for better visibility
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Firebase Authentication Test Suite${NC}"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${GREEN}Loading environment variables from .env file${NC}"
  export $(grep -v '^#' .env | xargs)
else
  echo -e "${YELLOW}Warning: .env file not found${NC}"
fi

# Run the tests for the auth components
echo -e "${GREEN}=== Running AuthProvider Tests ===${NC}"
npx jest app/__tests__/components/auth/AuthProvider.test.tsx

echo -e "${GREEN}=== Running Auth Edge Cases Tests ===${NC}"
npx jest app/__tests__/components/auth/AuthEdgeCases.test.tsx

# Check if any test files failed
if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed!${NC}"
  exit 1
else
  echo -e "${GREEN}All authentication tests passed!${NC}"
fi

echo -e "\n${YELLOW}Firebase Auth Configuration Check${NC}"
# Check Firebase configuration
echo -e "${GREEN}=== Verifying Firebase Configuration ===${NC}"
if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
  echo -e "${RED}NEXT_PUBLIC_FIREBASE_API_KEY is not set${NC}"
else
  echo -e "${GREEN}NEXT_PUBLIC_FIREBASE_API_KEY is correctly set${NC}"
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" ]; then
  echo -e "${YELLOW}Warning: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is not set (needed for Analytics)${NC}"
else
  echo -e "${GREEN}NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is correctly set${NC}"
fi

echo -e "\n${GREEN}Authentication test suite completed${NC}" 