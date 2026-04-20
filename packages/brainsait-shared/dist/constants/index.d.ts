/**
 * Application constants for BrainSAIT platform
 */
export declare const API_CONFIG: {
    readonly BASE_URL: string;
    readonly DOCS_URL: string;
    readonly TIMEOUT: 30000;
    readonly RETRY_ATTEMPTS: 3;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 5;
};
export declare const FILE_UPLOAD: {
    readonly MAX_FILE_SIZE: number;
    readonly MAX_FILES: 5;
    readonly ALLOWED_TYPES: {
        readonly IMAGES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
        readonly DOCUMENTS: readonly ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
        readonly ALL: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    };
};
export declare const VALIDATION_RULES: {
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 128;
        readonly REQUIRE_UPPERCASE: true;
        readonly REQUIRE_LOWERCASE: true;
        readonly REQUIRE_NUMBER: true;
        readonly REQUIRE_SPECIAL_CHAR: true;
    };
    readonly EMAIL: {
        readonly MAX_LENGTH: 254;
    };
    readonly NAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 50;
    };
    readonly COMPANY_NAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 100;
    };
    readonly DESCRIPTION: {
        readonly MIN_LENGTH: 10;
        readonly MAX_LENGTH: 2000;
    };
    readonly BIO: {
        readonly MAX_LENGTH: 1000;
    };
    readonly PHONE: {
        readonly MIN_LENGTH: 10;
        readonly MAX_LENGTH: 15;
    };
};
export declare const PROGRAM_CONFIG: {
    readonly MIN_DURATION_WEEKS: 1;
    readonly MAX_DURATION_WEEKS: 52;
    readonly MIN_PARTICIPANTS: 1;
    readonly MAX_PARTICIPANTS: 100;
    readonly SESSION_DURATION: {
        readonly MIN_MINUTES: 15;
        readonly MAX_MINUTES: 480;
        readonly DEFAULT_MINUTES: 60;
    };
};
export declare const RATING_CONFIG: {
    readonly MIN_RATING: 1;
    readonly MAX_RATING: 5;
    readonly DEFAULT_RATING: 0;
};
export declare const DATE_FORMATS: {
    readonly DISPLAY: "MMM dd, yyyy";
    readonly DISPLAY_AR: "dd MMM yyyy";
    readonly INPUT: "yyyy-MM-dd";
    readonly DATETIME: "MMM dd, yyyy HH:mm";
    readonly TIME: "HH:mm";
    readonly ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
};
export declare const LOCALES: {
    readonly DEFAULT: "en";
    readonly SUPPORTED: readonly ["en", "ar"];
    readonly RTL_LANGUAGES: readonly ["ar"];
};
export declare const THEME_COLORS: {
    readonly PRIMARY: "#2E7D32";
    readonly PRIMARY_LIGHT: "#4CAF50";
    readonly PRIMARY_DARK: "#1B5E20";
    readonly SECONDARY: "#1976D2";
    readonly SECONDARY_LIGHT: "#42A5F5";
    readonly SECONDARY_DARK: "#0D47A1";
    readonly SUCCESS: "#4CAF50";
    readonly WARNING: "#FF9800";
    readonly ERROR: "#F44336";
    readonly INFO: "#2196F3";
    readonly BACKGROUND: "#F8F9FA";
    readonly SURFACE: "#FFFFFF";
    readonly TEXT_PRIMARY: "#212121";
    readonly TEXT_SECONDARY: "#757575";
};
export declare const BUSINESS_TYPES: {
    readonly STARTUP: "Startup";
    readonly SMALL_BUSINESS: "Small Business";
    readonly MEDIUM_ENTERPRISE: "Medium Enterprise";
    readonly NON_PROFIT: "Non-Profit";
};
export declare const BUSINESS_TYPES_AR: {
    readonly STARTUP: "شركة ناشئة";
    readonly SMALL_BUSINESS: "شركة صغيرة";
    readonly MEDIUM_ENTERPRISE: "مؤسسة متوسطة";
    readonly NON_PROFIT: "منظمة غير ربحية";
};
export declare const INDUSTRY_FOCUS: {
    readonly HEALTHCARE_TECHNOLOGY: "Healthcare Technology";
    readonly MEDICAL_DEVICES: "Medical Devices";
    readonly PHARMACEUTICALS: "Pharmaceuticals";
    readonly BIOTECHNOLOGY: "Biotechnology";
    readonly DIGITAL_HEALTH: "Digital Health";
    readonly TELEMEDICINE: "Telemedicine";
    readonly HEALTH_ANALYTICS: "Health Analytics";
    readonly MEDICAL_RESEARCH: "Medical Research";
    readonly HEALTHCARE_SERVICES: "Healthcare Services";
    readonly HEALTH_INSURANCE: "Health Insurance";
};
export declare const INDUSTRY_FOCUS_AR: {
    readonly HEALTHCARE_TECHNOLOGY: "تكنولوجيا الرعاية الصحية";
    readonly MEDICAL_DEVICES: "الأجهزة الطبية";
    readonly PHARMACEUTICALS: "المستحضرات الصيدلانية";
    readonly BIOTECHNOLOGY: "التكنولوجيا الحيوية";
    readonly DIGITAL_HEALTH: "الصحة الرقمية";
    readonly TELEMEDICINE: "الطب عن بعد";
    readonly HEALTH_ANALYTICS: "تحليلات الصحة";
    readonly MEDICAL_RESEARCH: "البحوث الطبية";
    readonly HEALTHCARE_SERVICES: "خدمات الرعاية الصحية";
    readonly HEALTH_INSURANCE: "التأمين الصحي";
};
export declare const PROGRAM_TYPES: {
    readonly INCUBATION: "Incubation Program";
    readonly ACCELERATION: "Acceleration Program";
    readonly MENTORSHIP: "Mentorship Program";
    readonly WORKSHOP: "Workshop";
    readonly MASTERCLASS: "Masterclass";
};
export declare const PROGRAM_TYPES_AR: {
    readonly INCUBATION: "برنامج الاحتضان";
    readonly ACCELERATION: "برنامج التسريع";
    readonly MENTORSHIP: "برنامج الإرشاد";
    readonly WORKSHOP: "ورشة عمل";
    readonly MASTERCLASS: "فئة رئيسية";
};
export * from './training';
export * from './incubator';
export declare const STATUS_TYPES: {
    readonly ACTIVE: "Active";
    readonly INACTIVE: "Inactive";
    readonly PENDING: "Pending";
    readonly APPROVED: "Approved";
    readonly REJECTED: "Rejected";
    readonly COMPLETED: "Completed";
    readonly CANCELLED: "Cancelled";
    readonly DRAFT: "Draft";
    readonly PUBLISHED: "Published";
    readonly ARCHIVED: "Archived";
};
export declare const STATUS_TYPES_AR: {
    readonly ACTIVE: "نشط";
    readonly INACTIVE: "غير نشط";
    readonly PENDING: "قيد الانتظار";
    readonly APPROVED: "مقبول";
    readonly REJECTED: "مرفوض";
    readonly COMPLETED: "مكتمل";
    readonly CANCELLED: "ملغى";
    readonly DRAFT: "مسودة";
    readonly PUBLISHED: "منشور";
    readonly ARCHIVED: "مؤرشف";
};
export declare const ROUTES: {
    readonly HOME: "/";
    readonly DASHBOARD: "/dashboard";
    readonly PROFILE: "/profile";
    readonly PROGRAMS: "/programs";
    readonly MENTORS: "/mentors";
    readonly SME: "/sme";
    readonly LOGIN: "/auth/login";
    readonly REGISTER: "/auth/register";
    readonly FORGOT_PASSWORD: "/auth/forgot-password";
    readonly RESET_PASSWORD: "/auth/reset-password";
};
export declare const STORAGE_KEYS: {
    readonly TOKEN: "brainsait_token";
    readonly REFRESH_TOKEN: "brainsait_refresh_token";
    readonly USER: "brainsait_user";
    readonly LANGUAGE: "brainsait_language";
    readonly THEME: "brainsait_theme";
    readonly PREFERENCES: "brainsait_preferences";
};
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly SERVER_ERROR: "SERVER_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
};
export declare const SUCCESS_MESSAGES: {
    readonly ACCOUNT_CREATED: "Account created successfully";
    readonly LOGIN_SUCCESS: "Login successful";
    readonly LOGOUT_SUCCESS: "Logout successful";
    readonly PROFILE_UPDATED: "Profile updated successfully";
    readonly PASSWORD_CHANGED: "Password changed successfully";
    readonly EMAIL_SENT: "Email sent successfully";
    readonly DATA_SAVED: "Data saved successfully";
    readonly FILE_UPLOADED: "File uploaded successfully";
};
export declare const SUCCESS_MESSAGES_AR: {
    readonly ACCOUNT_CREATED: "تم إنشاء الحساب بنجاح";
    readonly LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح";
    readonly LOGOUT_SUCCESS: "تم تسجيل الخروج بنجاح";
    readonly PROFILE_UPDATED: "تم تحديث الملف الشخصي بنجاح";
    readonly PASSWORD_CHANGED: "تم تغيير كلمة المرور بنجاح";
    readonly EMAIL_SENT: "تم إرسال البريد الإلكتروني بنجاح";
    readonly DATA_SAVED: "تم حفظ البيانات بنجاح";
    readonly FILE_UPLOADED: "تم رفع الملف بنجاح";
};
//# sourceMappingURL=index.d.ts.map