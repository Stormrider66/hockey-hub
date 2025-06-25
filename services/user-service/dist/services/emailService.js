"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../config/logger"));
// --- Email Configuration --- //
// For development/testing, use Ethereal.email to catch emails
// For production, configure with your actual email provider (e.g., SMTP, SendGrid)
const createTransporter = () => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === 'production') {
        // TODO: Configure for production email provider
        // Example using SMTP:
        // return nodemailer.createTransport({
        //   host: process.env.EMAIL_HOST,
        //   port: parseInt(process.env.EMAIL_PORT || '587', 10),
        //   secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        //   auth: {
        //     user: process.env.EMAIL_USER,
        //     pass: process.env.EMAIL_PASS,
        //   },
        // });
        logger_1.default.warn('Production email transporter not configured. Using Ethereal.');
        // Fallback to Ethereal if production isn't set up
    }
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = yield nodemailer_1.default.createTestAccount();
    logger_1.default.debug({ user: testAccount.user }, 'Ethereal test account created');
    // Create reusable transporter object using the default SMTP transport
    return nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
});
let transporter = null;
// Initialize the transporter
const getTransporter = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!transporter) {
        transporter = yield createTransporter();
    }
    return transporter;
});
// --- Email Sending Functions --- //
/**
 * Sends the password reset email.
 */
const sendPasswordResetEmail = (to, resetUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailer = yield getTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Hockey Hub" <noreply@hockeyhub.com>', // sender address
            to: to, // list of receivers
            subject: 'Reset Your Hockey Hub Password', // Subject line
            text: `You requested a password reset. Click this link to reset your password: ${resetUrl} 

This link will expire in 1 hour. If you did not request this, please ignore this email.`, // plain text body
            html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link will expire in 1 hour.</p>
             <p>If you did not request this, please ignore this email.</p>`, // html body
        };
        const info = yield mailer.sendMail(mailOptions);
        logger_1.default.info({ messageId: info.messageId, recipient: to }, 'Password reset email sent');
        // Preview only available when sending through an Ethereal account
        if (process.env.NODE_ENV !== 'production') {
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                logger_1.default.info({ previewUrl }, 'Password reset email preview URL');
            }
        }
    }
    catch (error) {
        logger_1.default.error({ err: error, recipient: to }, 'Error sending password reset email');
        // In a real app, you might want to throw this error or handle it differently
        // throw new Error('Failed to send password reset email');
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// Add other email sending functions here (e.g., sendWelcomeEmail) 
//# sourceMappingURL=emailService.js.map