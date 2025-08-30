/**
 * Hash a password using bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash
 */
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
/**
 * Generate a secure random token
 */
export declare const generateSecureToken: (length?: number) => string;
/**
 * Generate a random password for system use
 */
export declare const generateRandomPassword: (length?: number) => string;
/**
 * Validate password strength
 */
export declare const validatePasswordStrength: (password: string) => {
    isValid: boolean;
    errors: string[];
    score: number;
};
//# sourceMappingURL=password.d.ts.map