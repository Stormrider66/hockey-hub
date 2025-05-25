# Hockey App – Payment Service API Contract (OpenAPI 3.0)

## Overview
The Payment Service is responsible for handling subscriptions, invoices and payment processing for tenant organisations.  It integrates with external PSPs (Stripe in the MVP) while exposing a clean REST API to the rest of the Hockey-Hub platform.

**Base URL** : `/api/v1` (prefixed by API-Gateway)  
**Port**     : `3008`

> All endpoints require `bearerAuth` (JWT) with `admin` or `club_admin` role unless stated otherwise.

### Security Schemes
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## End-points

### Subscriptions
| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/payments/subscriptions` | List subscriptions for caller's organisation | admin / club_admin |
| POST | `/payments/subscriptions` | Create subscription (plan, payment-method) | admin / club_admin |
| GET | `/payments/subscriptions/{subId}` | Subscription details | admin / club_admin |
| PUT | `/payments/subscriptions/{subId}` | Update plan / seats / status | admin / club_admin |
| POST | `/payments/subscriptions/{subId}/cancel` | Schedule cancellation at period-end | admin / club_admin |

### Invoices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/payments/invoices` | List invoices (filter by status/date) |
| GET | `/payments/invoices/{invoiceId}` | Retrieve invoice PDF/JSON |
| POST | `/payments/invoices/{invoiceId}/pay` | Pay outstanding invoice (one-off) |

### Payment Methods
| Method | Path | Description |
|--------|------|-------------|
| GET | `/payments/payment-methods` | List saved payment methods for org |
| POST | `/payments/payment-methods` | Attach new payment method (Stripe setup-intent flow) |
| DELETE | `/payments/payment-methods/{methodId}` | Detach payment method |
| POST | `/payments/payment-methods/{methodId}/set-default` | Set default payment method |

### Webhooks  *public*
| Method | Path | Description |
|--------|------|-------------|
| POST | `/payments/webhooks/stripe` | Stripe webhook receiver – handles invoice.paid, payment_intent.succeeded, etc. |

## Data Schemas (excerpt)
```yaml
components:
  schemas:
    Subscription:
      type: object
      properties:
        id: { type: string, format: uuid }
        status: { type: string, enum: [active, trialing, past_due, canceled, unpaid] }
        planId: { type: string }
        currentPeriodStart: { type: string, format: date-time }
        currentPeriodEnd: { type: string, format: date-time }
        quantity: { type: integer }
        createdAt: { type: string, format: date-time }
    Invoice:
      type: object
      properties:
        id: { type: string, format: uuid }
        subscriptionId: { type: string, format: uuid }
        status: { type: string, enum: [draft, open, paid, void, uncollectible] }
        total: { type: integer }
        dueDate: { type: string, format: date }
        pdfUrl: { type: string, format: uri }
    PaymentMethod:
      type: object
      properties:
        id: { type: string }
        brand: { type: string }
        last4: { type: string }
        expMonth: { type: integer }
        expYear: { type: integer }
        isDefault: { type: boolean }
```

— *Draft v0.1* – will expand with refund flows and GDPR export costs. 