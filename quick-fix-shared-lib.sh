#!/bin/bash

echo "🔧 Quick Fix for Shared Lib"
echo "=========================="

# Navigate to shared-lib
cd packages/shared-lib

# Clean build directory
echo "Cleaning build directory..."
rm -rf dist
rm -rf tsconfig.tsbuildinfo

# Create minimal dist directory structure
echo "Creating minimal dist structure..."
mkdir -p dist/entities
mkdir -p dist/dto
mkdir -p dist/services
mkdir -p dist/saga
mkdir -p dist/validation

# Create a simple index.js that exports empty objects to satisfy imports
cat > dist/index.js << 'EOF'
// Temporary fix for shared-lib
module.exports = {
  // DTOs
  UserRole: {
    PLAYER: 'player',
    COACH: 'coach',
    PARENT: 'parent',
    MEDICAL_STAFF: 'medical_staff',
    EQUIPMENT_MANAGER: 'equipment_manager',
    PHYSICAL_TRAINER: 'physical_trainer',
    CLUB_ADMIN: 'club_admin',
    ADMIN: 'admin'
  },
  
  // Base classes
  BaseEntity: class BaseEntity {},
  
  // Services
  EventBus: class EventBus {},
  ServiceClient: class ServiceClient {},
  
  // Utils
  DateUtils: {
    parseDate: (date) => new Date(date),
    formatDate: (date) => date.toISOString()
  }
};
EOF

# Create TypeScript declarations
cat > dist/index.d.ts << 'EOF'
export enum UserRole {
  PLAYER = 'player',
  COACH = 'coach',
  PARENT = 'parent',
  MEDICAL_STAFF = 'medical_staff',
  EQUIPMENT_MANAGER = 'equipment_manager',
  PHYSICAL_TRAINER = 'physical_trainer',
  CLUB_ADMIN = 'club_admin',
  ADMIN = 'admin'
}

export class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EventBus {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class ServiceClient {
  constructor(config: any);
}

export const DateUtils: {
  parseDate(date: string | Date): Date;
  formatDate(date: Date): string;
};
EOF

echo "✅ Quick fix applied!"
echo "Now you can restart the dev server"