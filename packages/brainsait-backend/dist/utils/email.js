"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const environment_1 = require("../config/environment");
const logger_1 = require("./logger");
// Create transporter
const transporter = nodemailer_1.default.createTransporter({
    host: environment_1.config.email.smtp.host,
    port: environment_1.config.email.smtp.port,
    secure: environment_1.config.email.smtp.secure,
    auth: {
        user: environment_1.config.email.smtp.user,
        pass: environment_1.config.email.smtp.pass,
    },
});
/**
 * Send email using configured SMTP
 */
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: environment_1.config.email.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };
        await transporter.sendMail(mailOptions);
        logger_1.logger.info(`Email sent successfully to: ${options.to}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
exports.sendEmail = sendEmail;
/**
 * Send email verification email
 */
const sendVerificationEmail = async (email, firstName, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - BrainSAIT</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to BrainSAIT!</h1>
                <p>Healthcare Innovation Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${firstName},</h2>
                <p>Thank you for joining the BrainSAIT healthcare innovation platform! To complete your registration and start your journey, please verify your email address.</p>
                
                <p>Click the button below to verify your email:</p>
                
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                
                <p><strong>This verification link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with BrainSAIT, please ignore this email.</p>
                
                <hr style="margin: 30px 0;">
                <p><strong>What's next after verification?</strong></p>
                <ul>
                    <li>Complete your SME profile</li>
                    <li>Explore our incubation programs</li>
                    <li>Connect with healthcare mentors</li>
                    <li>Access business development resources</li>
                </ul>
            </div>
            <div class="footer">
                <p>© 2024 BrainSAIT. All rights reserved.</p>
                <p>If you have any questions, contact us at support@brainsait.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
    const text = `
    Welcome to BrainSAIT!
    
    Hello ${firstName},
    
    Thank you for joining the BrainSAIT healthcare innovation platform! 
    To complete your registration, please verify your email address by visiting:
    
    ${verificationUrl}
    
    This verification link will expire in 24 hours.
    
    If you didn't create an account with BrainSAIT, please ignore this email.
    
    Best regards,
    The BrainSAIT Team
  `;
    await (0, exports.sendEmail)({
        to: email,
        subject: 'Verify Your Email - Welcome to BrainSAIT!',
        html,
        text,
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - BrainSAIT</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>BrainSAIT Healthcare Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${firstName},</h2>
                <p>We received a request to reset the password for your BrainSAIT account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
                
                <div class="warning">
                    <strong>Important:</strong>
                    <ul>
                        <li>This password reset link will expire in 1 hour</li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>For security, this link can only be used once</li>
                    </ul>
                </div>
                
                <p>If you're having trouble accessing your account or didn't request this reset, please contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2024 BrainSAIT. All rights reserved.</p>
                <p>For security questions, contact us at security@brainsait.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
    const text = `
    Password Reset Request - BrainSAIT
    
    Hello ${firstName},
    
    We received a request to reset the password for your BrainSAIT account.
    
    To reset your password, please visit:
    ${resetUrl}
    
    Important:
    - This password reset link will expire in 1 hour
    - If you didn't request this password reset, please ignore this email
    - For security, this link can only be used once
    
    If you're having trouble, please contact our support team.
    
    Best regards,
    The BrainSAIT Team
  `;
    await (0, exports.sendEmail)({
        to: email,
        subject: 'Reset Your Password - BrainSAIT',
        html,
        text,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
/**
 * Send welcome email after successful verification
 */
const sendWelcomeEmail = async (email, firstName) => {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to BrainSAIT!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #28a745; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to BrainSAIT!</h1>
                <p>Your healthcare innovation journey starts here</p>
            </div>
            <div class="content">
                <h2>Congratulations, ${firstName}!</h2>
                <p>Your email has been successfully verified, and your BrainSAIT account is now active. You're ready to explore the future of healthcare innovation!</p>
                
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                
                <h3>What you can do now:</h3>
                
                <div class="feature">
                    <h4>🏢 Complete Your SME Profile</h4>
                    <p>Tell us about your healthcare venture, goals, and what makes your innovation unique.</p>
                </div>
                
                <div class="feature">
                    <h4>📚 Explore Incubation Programs</h4>
                    <p>Discover tailored programs designed to accelerate your healthcare business.</p>
                </div>
                
                <div class="feature">
                    <h4>👥 Connect with Mentors</h4>
                    <p>Get matched with experienced healthcare industry professionals.</p>
                </div>
                
                <div class="feature">
                    <h4>📊 Access Business Tools</h4>
                    <p>Use our business plan generators, feasibility study tools, and progress trackers.</p>
                </div>
                
                <p>Need help getting started? Check out our <a href="${dashboardUrl}/help">Getting Started Guide</a> or contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2024 BrainSAIT. All rights reserved.</p>
                <p>Questions? Contact us at support@brainsait.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
    await (0, exports.sendEmail)({
        to: email,
        subject: '🎉 Welcome to BrainSAIT - Let\'s Innovate Healthcare Together!',
        html,
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
//# sourceMappingURL=email.js.map