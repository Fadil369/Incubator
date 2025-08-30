"use strict";
/**
 * Application constants for BrainSAIT platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUCCESS_MESSAGES_AR = exports.SUCCESS_MESSAGES = exports.ERROR_CODES = exports.STORAGE_KEYS = exports.ROUTES = exports.STATUS_TYPES_AR = exports.STATUS_TYPES = exports.PROGRAM_TYPES_AR = exports.PROGRAM_TYPES = exports.INDUSTRY_FOCUS_AR = exports.INDUSTRY_FOCUS = exports.BUSINESS_TYPES_AR = exports.BUSINESS_TYPES = exports.THEME_COLORS = exports.LOCALES = exports.DATE_FORMATS = exports.RATING_CONFIG = exports.PROGRAM_CONFIG = exports.VALIDATION_RULES = exports.FILE_UPLOAD = exports.PAGINATION = exports.API_CONFIG = void 0;
// API Configuration
exports.API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:5002',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
};
// Pagination
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 5,
};
// File Upload Limits
exports.FILE_UPLOAD = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 5,
    ALLOWED_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        DOCUMENTS: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        ALL: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    },
};
// Validation Rules
exports.VALIDATION_RULES = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
        REQUIRE_SPECIAL_CHAR: true,
    },
    EMAIL: {
        MAX_LENGTH: 254,
    },
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50,
    },
    COMPANY_NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 100,
    },
    DESCRIPTION: {
        MIN_LENGTH: 10,
        MAX_LENGTH: 2000,
    },
    BIO: {
        MAX_LENGTH: 1000,
    },
    PHONE: {
        MIN_LENGTH: 10,
        MAX_LENGTH: 15,
    },
};
// Program Configuration
exports.PROGRAM_CONFIG = {
    MIN_DURATION_WEEKS: 1,
    MAX_DURATION_WEEKS: 52,
    MIN_PARTICIPANTS: 1,
    MAX_PARTICIPANTS: 100,
    SESSION_DURATION: {
        MIN_MINUTES: 15,
        MAX_MINUTES: 480, // 8 hours
        DEFAULT_MINUTES: 60,
    },
};
// Rating Configuration
exports.RATING_CONFIG = {
    MIN_RATING: 1,
    MAX_RATING: 5,
    DEFAULT_RATING: 0,
};
// Date Formats
exports.DATE_FORMATS = {
    DISPLAY: 'MMM dd, yyyy',
    DISPLAY_AR: 'dd MMM yyyy',
    INPUT: 'yyyy-MM-dd',
    DATETIME: 'MMM dd, yyyy HH:mm',
    TIME: 'HH:mm',
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};
// Localization
exports.LOCALES = {
    DEFAULT: 'en',
    SUPPORTED: ['en', 'ar'],
    RTL_LANGUAGES: ['ar'],
};
// Theme Colors (BrainSAIT Brand)
exports.THEME_COLORS = {
    PRIMARY: '#2E7D32', // BrainSAIT Green
    PRIMARY_LIGHT: '#4CAF50',
    PRIMARY_DARK: '#1B5E20',
    SECONDARY: '#1976D2', // BrainSAIT Blue
    SECONDARY_LIGHT: '#42A5F5',
    SECONDARY_DARK: '#0D47A1',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    ERROR: '#F44336',
    INFO: '#2196F3',
    BACKGROUND: '#F8F9FA',
    SURFACE: '#FFFFFF',
    TEXT_PRIMARY: '#212121',
    TEXT_SECONDARY: '#757575',
};
// Business Types
exports.BUSINESS_TYPES = {
    STARTUP: 'Startup',
    SMALL_BUSINESS: 'Small Business',
    MEDIUM_ENTERPRISE: 'Medium Enterprise',
    NON_PROFIT: 'Non-Profit',
};
exports.BUSINESS_TYPES_AR = {
    STARTUP: 'شركة ناشئة',
    SMALL_BUSINESS: 'شركة صغيرة',
    MEDIUM_ENTERPRISE: 'مؤسسة متوسطة',
    NON_PROFIT: 'منظمة غير ربحية',
};
// Industry Focus Areas
exports.INDUSTRY_FOCUS = {
    HEALTHCARE_TECHNOLOGY: 'Healthcare Technology',
    MEDICAL_DEVICES: 'Medical Devices',
    PHARMACEUTICALS: 'Pharmaceuticals',
    BIOTECHNOLOGY: 'Biotechnology',
    DIGITAL_HEALTH: 'Digital Health',
    TELEMEDICINE: 'Telemedicine',
    HEALTH_ANALYTICS: 'Health Analytics',
    MEDICAL_RESEARCH: 'Medical Research',
    HEALTHCARE_SERVICES: 'Healthcare Services',
    HEALTH_INSURANCE: 'Health Insurance',
};
exports.INDUSTRY_FOCUS_AR = {
    HEALTHCARE_TECHNOLOGY: 'تكنولوجيا الرعاية الصحية',
    MEDICAL_DEVICES: 'الأجهزة الطبية',
    PHARMACEUTICALS: 'المستحضرات الصيدلانية',
    BIOTECHNOLOGY: 'التكنولوجيا الحيوية',
    DIGITAL_HEALTH: 'الصحة الرقمية',
    TELEMEDICINE: 'الطب عن بعد',
    HEALTH_ANALYTICS: 'تحليلات الصحة',
    MEDICAL_RESEARCH: 'البحوث الطبية',
    HEALTHCARE_SERVICES: 'خدمات الرعاية الصحية',
    HEALTH_INSURANCE: 'التأمين الصحي',
};
// Program Types
exports.PROGRAM_TYPES = {
    INCUBATION: 'Incubation Program',
    ACCELERATION: 'Acceleration Program',
    MENTORSHIP: 'Mentorship Program',
    WORKSHOP: 'Workshop',
    MASTERCLASS: 'Masterclass',
};
exports.PROGRAM_TYPES_AR = {
    INCUBATION: 'برنامج الاحتضان',
    ACCELERATION: 'برنامج التسريع',
    MENTORSHIP: 'برنامج الإرشاد',
    WORKSHOP: 'ورشة عمل',
    MASTERCLASS: 'فئة رئيسية',
};
// Status Types
exports.STATUS_TYPES = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
};
exports.STATUS_TYPES_AR = {
    ACTIVE: 'نشط',
    INACTIVE: 'غير نشط',
    PENDING: 'قيد الانتظار',
    APPROVED: 'مقبول',
    REJECTED: 'مرفوض',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغى',
    DRAFT: 'مسودة',
    PUBLISHED: 'منشور',
    ARCHIVED: 'مؤرشف',
};
// Navigation Routes
exports.ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    PROGRAMS: '/programs',
    MENTORS: '/mentors',
    SME: '/sme',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
};
// Local Storage Keys
exports.STORAGE_KEYS = {
    TOKEN: 'brainsait_token',
    REFRESH_TOKEN: 'brainsait_refresh_token',
    USER: 'brainsait_user',
    LANGUAGE: 'brainsait_language',
    THEME: 'brainsait_theme',
    PREFERENCES: 'brainsait_preferences',
};
// Error Codes
exports.ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
};
// Success Messages
exports.SUCCESS_MESSAGES = {
    ACCOUNT_CREATED: 'Account created successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    EMAIL_SENT: 'Email sent successfully',
    DATA_SAVED: 'Data saved successfully',
    FILE_UPLOADED: 'File uploaded successfully',
};
exports.SUCCESS_MESSAGES_AR = {
    ACCOUNT_CREATED: 'تم إنشاء الحساب بنجاح',
    LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
    LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
    PROFILE_UPDATED: 'تم تحديث الملف الشخصي بنجاح',
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
    EMAIL_SENT: 'تم إرسال البريد الإلكتروني بنجاح',
    DATA_SAVED: 'تم حفظ البيانات بنجاح',
    FILE_UPLOADED: 'تم رفع الملف بنجاح',
};
//# sourceMappingURL=index.js.map