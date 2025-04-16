import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import logger from '../config/logger';

// --- Email Configuration --- //

// For development/testing, use Ethereal.email to catch emails
// For production, configure with your actual email provider (e.g., SMTP, SendGrid)
const createTransporter = async (): Promise<Mail> => {
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
    logger.warn('Production email transporter not configured. Using Ethereal.');
    // Fallback to Ethereal if production isn't set up
  }
  
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();
  logger.debug({ user: testAccount.user }, 'Ethereal test account created');

  // Create reusable transporter object using the default SMTP transport
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

let transporter: Mail | null = null;

// Initialize the transporter
const getTransporter = async (): Promise<Mail> => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

// --- Email Sending Functions --- //

/**
 * Sends the password reset email.
 */
export const sendPasswordResetEmail = async (to: string, resetUrl: string): Promise<void> => {
  try {
    const mailer = await getTransporter();
    const mailOptions: Mail.Options = {
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

    let info = await mailer.sendMail(mailOptions);

    logger.info({ messageId: info.messageId, recipient: to }, 'Password reset email sent');
    // Preview only available when sending through an Ethereal account
    if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info({ previewUrl }, 'Password reset email preview URL');
        }
    }

  } catch (error) {
    logger.error({ err: error, recipient: to }, 'Error sending password reset email');
    // In a real app, you might want to throw this error or handle it differently
    // throw new Error('Failed to send password reset email');
  }
};

// Add other email sending functions here (e.g., sendWelcomeEmail) 