#!/bin/bash

# Revert all services to use their dedicated databases

echo "Reverting database configurations..."

# Medical Service
cat > services/medical-service/.env << EOF
PORT=3005

# Database
DB_HOST=localhost
DB_PORT=5436
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_medical
EOF

# Calendar Service
cat > services/calendar-service/.env << EOF
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_calendar
EOF

# Communication Service
cat > services/communication-service/.env << EOF
PORT=3002

# Database
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_communication

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@hockeyhub.com
EMAIL_PASS=your-email-password
EMAIL_FROM=Hockey Hub <noreply@hockeyhub.com>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
EOF

# Payment Service
cat > services/payment-service/.env << EOF
PORT=3008

# Database
DB_HOST=localhost
DB_PORT=5437
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_payment

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox
EOF

# Statistics Service
cat > services/statistics-service/.env << EOF
PORT=3007

# Database
DB_HOST=localhost
DB_PORT=5439
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_statistics
EOF

# Planning Service
cat > services/planning-service/.env << EOF
PORT=3006

# Database
DB_HOST=localhost
DB_PORT=5438
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_planning

# AI/ML Service URLs (if integrated)
AI_SERVICE_URL=http://localhost:5000
ML_MODEL_PATH=/models
EOF

# Admin Service
cat > services/admin-service/.env << EOF
PORT=3009

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=hockey_hub_password
DB_NAME=hockey_hub_admin
EOF

echo "✅ All service configurations have been reverted!"