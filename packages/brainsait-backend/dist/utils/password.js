import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { config } from '../config/environment';
/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
    return bcrypt.hash(password, salt);
};
/**
 * Compare password with hash
 */
export const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};
/**
 * Generate a secure random token
 */
export const generateSecureToken = (length = 32) => {
    return randomBytes(length).toString('hex');
};
/**
 * Generate a random password for system use
 */
export const generateRandomPassword = (length = 16) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};
/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
    const errors = [];
    let score = 0;
    // Length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else if (password.length >= 12) {
        score += 2;
    }
    else {
        score += 1;
    }
    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    else {
        score += 1;
    }
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    else {
        score += 1;
    }
    // Number check
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    else {
        score += 1;
    }
    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    else {
        score += 1;
    }
    // Common patterns check
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /admin/i,
        /letmein/i,
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password contains common patterns that are easily guessed');
            score -= 1;
            break;
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        score: Math.max(0, score),
    };
};
//# sourceMappingURL=password.js.map