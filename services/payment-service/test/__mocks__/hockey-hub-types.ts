export type UUID = string;
export type ISODateString = string;

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethodType {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  SWISH = 'swish',
  CASH = 'cash',
}

export enum UserRole {
  ADMIN = 'admin',
  CLUB_ADMIN = 'club_admin',
  PLAYER = 'player',
}

export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  SEK = 'SEK',
} 