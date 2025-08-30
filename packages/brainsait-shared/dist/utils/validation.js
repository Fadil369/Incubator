"use strict";
/**
 * Common validation utilities for BrainSAIT platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForm = exports.sanitizeEmail = exports.sanitizeText = exports.isValidRating = exports.isValidLinkedInUrl = exports.isValidTextLength = exports.isValidEmployeeCount = exports.isValidFoundedYear = exports.isValidAge = exports.calculateAge = exports.isDateInPast = exports.isDateInFuture = exports.isValidDate = exports.isValidPercentage = exports.isPositiveNumber = exports.containsArabic = exports.validateFile = exports.isValidBusinessName = exports.isValidUrl = exports.validatePasswordStrength = exports.isValidPhoneNumber = exports.isValidEmail = void 0;
// Email validation
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
// Phone number validation (international format)
const isValidPhoneNumber = (phoneNumber) => {
    // Remove all non-digits and check if it's between 10-15 digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
};
exports.isValidPhoneNumber = isValidPhoneNumber;
// Password strength validation
const validatePasswordStrength = (password) => {
    const errors = [];
    let score = 0;
    // Minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else {
        score += 1;
    }
    // Contains lowercase
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    else {
        score += 1;
    }
    // Contains uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    else {
        score += 1;
    }
    // Contains number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    else {
        score += 1;
    }
    // Contains special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    else {
        score += 1;
    }
    return {
        isValid: errors.length === 0,
        errors,
        score,
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
// URL validation
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
// Business name validation (supports Arabic and English)
const isValidBusinessName = (name) => {
    // Allow letters, numbers, spaces, and common business symbols
    const businessNameRegex = /^[\w\s\u0600-\u06FF\u0750-\u077F&.,'-]+$/;
    return name.length >= 2 && name.length <= 100 && businessNameRegex.test(name);
};
exports.isValidBusinessName = isValidBusinessName;
// File validation
const validateFile = (file, options = {}) => {
    const errors = [];
    const { maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'], maxNameLength = 255, } = options;
    // File size check
    if (file.size > maxSize) {
        errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }
    // File type check
    if (!allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`);
    }
    // File name length check
    if (file.name.length > maxNameLength) {
        errors.push(`File name must be less than ${maxNameLength} characters`);
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validateFile = validateFile;
// Arabic text validation
const containsArabic = (text) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicRegex.test(text);
};
exports.containsArabic = containsArabic;
// Numeric validation
const isPositiveNumber = (value) => {
    return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
};
exports.isPositiveNumber = isPositiveNumber;
const isValidPercentage = (value) => {
    return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value);
};
exports.isValidPercentage = isValidPercentage;
// Date validation
const isValidDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
};
exports.isValidDate = isValidDate;
const isDateInFuture = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return (0, exports.isValidDate)(dateObj) && dateObj.getTime() > Date.now();
};
exports.isDateInFuture = isDateInFuture;
const isDateInPast = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return (0, exports.isValidDate)(dateObj) && dateObj.getTime() < Date.now();
};
exports.isDateInPast = isDateInPast;
// Age validation
const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
exports.calculateAge = calculateAge;
const isValidAge = (birthDate, minAge = 18, maxAge = 100) => {
    const age = (0, exports.calculateAge)(birthDate);
    return age >= minAge && age <= maxAge;
};
exports.isValidAge = isValidAge;
// Company validation
const isValidFoundedYear = (year) => {
    const currentYear = new Date().getFullYear();
    return year >= 1800 && year <= currentYear;
};
exports.isValidFoundedYear = isValidFoundedYear;
const isValidEmployeeCount = (count) => {
    return Number.isInteger(count) && count >= 1 && count <= 1000000;
};
exports.isValidEmployeeCount = isValidEmployeeCount;
// Text length validation
const isValidTextLength = (text, minLength = 0, maxLength = 1000) => {
    return text.length >= minLength && text.length <= maxLength;
};
exports.isValidTextLength = isValidTextLength;
// LinkedIn URL validation
const isValidLinkedInUrl = (url) => {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
};
exports.isValidLinkedInUrl = isValidLinkedInUrl;
// Rating validation
const isValidRating = (rating, min = 1, max = 5) => {
    return Number.isInteger(rating) && rating >= min && rating <= max;
};
exports.isValidRating = isValidRating;
// Sanitization utilities
const sanitizeText = (text) => {
    return text
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[<>]/g, ''); // Remove potential HTML tags
};
exports.sanitizeText = sanitizeText;
const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.sanitizeEmail = sanitizeEmail;
// Form validation helper
const validateForm = (data, rules) => {
    const errors = {};
    Object.keys(rules).forEach(field => {
        const value = data[field];
        const rule = rules[field];
        const result = rule(value);
        if (typeof result === 'boolean') {
            if (!result) {
                errors[field] = `Invalid ${field}`;
            }
        }
        else {
            if (!result.isValid) {
                errors[field] = result.message;
            }
        }
    });
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
exports.validateForm = validateForm;
//# sourceMappingURL=validation.js.map