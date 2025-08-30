export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
/**
 * Send email using configured SMTP
 */
export declare const sendEmail: (options: EmailOptions) => Promise<void>;
/**
 * Send email verification email
 */
export declare const sendVerificationEmail: (email: string, firstName: string, verificationToken: string) => Promise<void>;
/**
 * Send password reset email
 */
export declare const sendPasswordResetEmail: (email: string, firstName: string, resetToken: string) => Promise<void>;
/**
 * Send welcome email after successful verification
 */
export declare const sendWelcomeEmail: (email: string, firstName: string) => Promise<void>;
//# sourceMappingURL=email.d.ts.map