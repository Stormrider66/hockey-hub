export type UUID = string & {
    readonly __uuidBrand: unique symbol;
};
export type ISODateString = string;
export declare enum GoalStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    ACHIEVED = "achieved",
    PARTIALLY_ACHIEVED = "partially_achieved",
    NOT_ACHIEVED = "not_achieved",
    ON_HOLD = "on_hold"
}
export declare enum CurrencyCode {
    SEK = "SEK",
    EUR = "EUR",
    USD = "USD"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
}
export declare enum PaymentMethodType {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    SWISH = "swish",
    CASH = "cash"
}
export declare enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    CANCELLED = "cancelled",
    EXPIRED = "expired"
}
export type UrlString = string;
export declare enum ConversationType {
    DIRECT = "direct",
    GROUP = "group",
    BROADCAST = "broadcast"
}
export declare enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    FILE = "file"
}
export declare enum MessageStatus {
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read"
}
export declare enum NotificationType {
    GENERAL = "general",
    EVENT = "event",
    SYSTEM = "system"
}
export declare enum NotificationChannel {
    IN_APP = "in_app",
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push"
}
export declare enum NotificationStatus {
    CREATED = "created",
    SENT = "sent",
    READ = "read",
    DISMISSED = "dismissed",
    PENDING = "pending"
}
export declare enum UserRole {
    PLAYER = "player",
    COACH = "coach",
    MEDICAL = "medical",
    ADMIN = "admin",
    CLUB_ADMIN = "club_admin"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum GoalType {
    PERFORMANCE = "performance",
    SKILL = "skill",
    STRATEGIC = "strategic"
}
export type PhoneString = string;
export declare enum InjuryType {
    MUSCLE = "muscle",
    JOINT = "joint",
    BONE = "bone",
    OTHER = "other"
}
export declare enum InjuryStatus {
    NEW = "new",
    UNDER_TREATMENT = "under_treatment",
    HEALED = "healed",
    CHRONIC = "chronic"
}
export declare enum InjurySeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    SEVERE = "severe"
}
export declare enum PlayerAvailabilityStatus {
    FULLY_AVAILABLE = "fully_available",
    LIMITED = "limited",
    INDIVIDUAL_TRAINING = "individual_training",
    REHAB = "rehab",
    UNAVAILABLE = "unavailable"
}
export declare enum ExerciseCategory {
    STRENGTH = "strength",
    CONDITIONING = "conditioning",
    MOBILITY = "mobility",
    SPEED = "speed",
    SKILL = "skill",
    OTHER = "other"
}
export declare enum IntensityLevel {
    LOW = "low",
    MODERATE = "moderate",
    HIGH = "high",
    MAX = "max"
}
export declare enum MeasurementUnit {
    KG = "kg",
    LBS = "lbs",
    REPS = "reps",
    SECONDS = "seconds",
    MINUTES = "minutes",
    METERS = "meters",
    YARDS = "yards"
}
//# sourceMappingURL=index.d.ts.map