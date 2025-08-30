"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = exports.generateRandomPassword = exports.generateSecureToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const environment_1 = require("../config/environment");
/**
 * Hash a password using bcrypt
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(environment_1.config.security.bcryptSaltRounds);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 */
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Generate a secure random token
 */
const generateSecureToken = (length = 32) => {
    return (0, crypto_1.randomBytes)(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
/**
 * Generate a random password for system use
 */
const generateRandomPassword = (length = 16) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};
exports.generateRandomPassword = generateRandomPassword;
/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
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
exports.validatePasswordStrength = validatePasswordStrength;
//# sourceMappingURL=password.js.map