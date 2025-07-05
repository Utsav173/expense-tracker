#!/bin/bash

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Database Credentials (must match docker-compose.yml) ---
DB_USER="user"
DB_PASSWORD="password"
DB_NAME="expense_tracker_db"
DB_HOST="localhost"
DB_PORT="5432"

# --- Check for prerequisites ---
if ! command -v docker &> /dev/null
then
    echo -e "${RED}Error: Docker is not installed. Please install Docker to use this script.${NC}"
    exit 1
fi

# Use 'docker compose' (v2) if available, otherwise fall back to 'docker-compose' (v1)
if command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
else
  echo -e "${RED}Error: Neither 'docker-compose' nor 'docker compose' command found. Please install Docker Compose.${NC}"
  exit 1
fi


# --- Start the Docker container ---
echo -e "${GREEN}Starting PostgreSQL container...${NC}"
$COMPOSE_CMD up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Docker container. Please check your Docker setup.${NC}"
    exit 1
fi

# --- Wait for PostgreSQL to be ready ---
echo -e "${YELLOW}Waiting for the database to be ready...${NC}"

# Loop for up to 60 seconds, waiting for the database to accept connections
for i in {1..30}; do
  # First, check if the container is stable and running
  STATUS=$($COMPOSE_CMD ps --services --filter "status=running" | grep postgres)
  if [ -z "$STATUS" ]; then
      echo -n "."
      sleep 2
      continue
  fi

  # Once running, use pg_isready *inside* the container
  # The -T flag disables pseudo-tty allocation, which is needed for non-interactive script execution.
  if $COMPOSE_CMD exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" -q; then
    DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

    echo -e "\n\n${GREEN}✅ Database is ready!${NC}"
    echo -e "--------------------------------------------------"
    echo -e "Your local database connection URL is:"
    echo -e "${YELLOW}${DATABASE_URL}${NC}"
    echo -e "--------------------------------------------------"
    echo -e "Please copy this URL and paste it into your ${YELLOW}.env${NC} file for the ${YELLOW}DATABASE_URL_NEW${NC} variable."
    echo -e "\nNext steps:"
    echo -e "1. Add the URL to your .env file."
    echo -e "2. Run ${YELLOW}bun run db:push${NC} to set up the tables."
    echo -e "3. (Optional) Run ${YELLOW}bun run seed${NC} to add sample data."
    exit 0
  fi
  echo -n "."
  sleep 2
done

# If the loop finishes, something went wrong
echo -e "\n\n${RED}Error: Database container failed to become ready after 60 seconds.${NC}"
echo -e "Please check the container logs for errors using: ${YELLOW}$COMPOSE_CMD logs postgres${NC}"
exit 1