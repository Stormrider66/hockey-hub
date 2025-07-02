#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Hockey Hub Coverage Collection${NC}"
echo -e "${BLUE}================================${NC}\n"

# Clean previous coverage
echo -e "${YELLOW}🧹 Cleaning previous coverage data...${NC}"
find . -name "coverage" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true
rm -rf .nyc_output coverage

# Run tests with coverage for all workspaces
echo -e "\n${YELLOW}🏃 Running tests with coverage...${NC}\n"

# Frontend
echo -e "${BLUE}📱 Frontend Coverage${NC}"
cd apps/frontend && pnpm test:coverage --silent || true
cd ../..

# Services
echo -e "\n${BLUE}🔧 Services Coverage${NC}"
for service in services/*; do
  if [ -d "$service" ] && [ -f "$service/package.json" ]; then
    service_name=$(basename "$service")
    echo -e "${YELLOW}  Testing $service_name...${NC}"
    cd "$service" && pnpm test:coverage --silent || true
    cd ../..
  fi
done

# Packages
echo -e "\n${BLUE}📦 Packages Coverage${NC}"
for package in packages/*; do
  if [ -d "$package" ] && [ -f "$package/package.json" ] && [ -f "$package/jest.config.js" ]; then
    package_name=$(basename "$package")
    echo -e "${YELLOW}  Testing $package_name...${NC}"
    cd "$package" && pnpm test:coverage --silent || true
    cd ../..
  fi
done

# Merge coverage
echo -e "\n${YELLOW}🔀 Merging coverage reports...${NC}"
node scripts/merge-coverage.js

# Generate reports
echo -e "\n${YELLOW}📊 Generating coverage reports...${NC}"
node scripts/generate-coverage-report.js

# Generate badges
echo -e "\n${YELLOW}🏷️  Generating coverage badges...${NC}"
node scripts/generate-coverage-badge.js

echo -e "\n${GREEN}✅ Coverage collection complete!${NC}"
echo -e "${GREEN}📁 View HTML report: file://$(pwd)/coverage/index.html${NC}"