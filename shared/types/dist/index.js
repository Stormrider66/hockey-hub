// Export shared placeholder types for tests
export var GoalStatus;
(function (GoalStatus) {
    GoalStatus["NOT_STARTED"] = "not_started";
    GoalStatus["IN_PROGRESS"] = "in_progress";
    GoalStatus["ACHIEVED"] = "achieved";
    GoalStatus["PARTIALLY_ACHIEVED"] = "partially_achieved";
    GoalStatus["NOT_ACHIEVED"] = "not_achieved";
    GoalStatus["ON_HOLD"] = "on_hold";
})(GoalStatus || (GoalStatus = {}));
// ---------------- Payment & Finance ---------------
export var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["SEK"] = "SEK";
    CurrencyCode["EUR"] = "EUR";
    CurrencyCode["USD"] = "USD";
})(CurrencyCode || (CurrencyCode = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethodType["SWISH"] = "swish";
    PaymentMethodType["CASH"] = "cash";
})(PaymentMethodType || (PaymentMethodType = {}));
export var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (InvoiceStatus = {}));
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAUSED"] = "paused";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["EXPIRED"] = "expired";
})(SubscriptionStatus || (SubscriptionStatus = {}));
export var ConversationType;
(function (ConversationType) {
    ConversationType["DIRECT"] = "direct";
    ConversationType["GROUP"] = "group";
    ConversationType["BROADCAST"] = "broadcast";
})(ConversationType || (ConversationType = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["FILE"] = "file";
})(MessageType || (MessageType = {}));
export var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
})(MessageStatus || (MessageStatus = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["GENERAL"] = "general";
    NotificationType["EVENT"] = "event";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (NotificationType = {}));
export var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["PUSH"] = "push";
})(NotificationChannel || (NotificationChannel = {}));
export var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["CREATED"] = "created";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["READ"] = "read";
    NotificationStatus["DISMISSED"] = "dismissed";
    NotificationStatus["PENDING"] = "pending";
})(NotificationStatus || (NotificationStatus = {}));
// ---------------- Core Roles ----------------------
export var UserRole;
(function (UserRole) {
    UserRole["PLAYER"] = "player";
    UserRole["COACH"] = "coach";
    UserRole["MEDICAL"] = "medical";
    UserRole["ADMIN"] = "admin";
    UserRole["CLUB_ADMIN"] = "club_admin";
})(UserRole || (UserRole = {}));
// ---------------- Task & Planning -----------------
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
})(TaskPriority || (TaskPriority = {}));
export var GoalType;
(function (GoalType) {
    GoalType["PERFORMANCE"] = "performance";
    GoalType["SKILL"] = "skill";
    GoalType["STRATEGIC"] = "strategic";
})(GoalType || (GoalType = {}));
// ---------------- Injury / Medical ---------------
export var InjuryType;
(function (InjuryType) {
    InjuryType["MUSCLE"] = "muscle";
    InjuryType["JOINT"] = "joint";
    InjuryType["BONE"] = "bone";
    InjuryType["OTHER"] = "other";
})(InjuryType || (InjuryType = {}));
export var InjuryStatus;
(function (InjuryStatus) {
    InjuryStatus["NEW"] = "new";
    InjuryStatus["UNDER_TREATMENT"] = "under_treatment";
    InjuryStatus["HEALED"] = "healed";
    InjuryStatus["CHRONIC"] = "chronic";
})(InjuryStatus || (InjuryStatus = {}));
export var InjurySeverity;
(function (InjurySeverity) {
    InjurySeverity["MINOR"] = "minor";
    InjurySeverity["MODERATE"] = "moderate";
    InjurySeverity["SEVERE"] = "severe";
})(InjurySeverity || (InjurySeverity = {}));
// ---------------- Player Availability -------------
export var PlayerAvailabilityStatus;
(function (PlayerAvailabilityStatus) {
    PlayerAvailabilityStatus["FULLY_AVAILABLE"] = "fully_available";
    PlayerAvailabilityStatus["LIMITED"] = "limited";
    PlayerAvailabilityStatus["INDIVIDUAL_TRAINING"] = "individual_training";
    PlayerAvailabilityStatus["REHAB"] = "rehab";
    PlayerAvailabilityStatus["UNAVAILABLE"] = "unavailable";
})(PlayerAvailabilityStatus || (PlayerAvailabilityStatus = {}));
// ---------------- Training / Exercise -------------
export var ExerciseCategory;
(function (ExerciseCategory) {
    ExerciseCategory["STRENGTH"] = "strength";
    ExerciseCategory["CONDITIONING"] = "conditioning";
    ExerciseCategory["MOBILITY"] = "mobility";
    ExerciseCategory["SPEED"] = "speed";
    ExerciseCategory["SKILL"] = "skill";
    ExerciseCategory["OTHER"] = "other";
})(ExerciseCategory || (ExerciseCategory = {}));
export var IntensityLevel;
(function (IntensityLevel) {
    IntensityLevel["LOW"] = "low";
    IntensityLevel["MODERATE"] = "moderate";
    IntensityLevel["HIGH"] = "high";
    IntensityLevel["MAX"] = "max";
})(IntensityLevel || (IntensityLevel = {}));
export var MeasurementUnit;
(function (MeasurementUnit) {
    MeasurementUnit["KG"] = "kg";
    MeasurementUnit["LBS"] = "lbs";
    MeasurementUnit["REPS"] = "reps";
    MeasurementUnit["SECONDS"] = "seconds";
    MeasurementUnit["MINUTES"] = "minutes";
    MeasurementUnit["METERS"] = "meters";
    MeasurementUnit["YARDS"] = "yards";
})(MeasurementUnit || (MeasurementUnit = {}));
