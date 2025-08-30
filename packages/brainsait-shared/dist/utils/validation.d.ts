/**
 * Common validation utilities for BrainSAIT platform
 */
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPhoneNumber: (phoneNumber: string) => boolean;
export declare const validatePasswordStrength: (password: string) => {
    isValid: boolean;
    errors: string[];
    score: number;
};
export declare const isValidUrl: (url: string) => boolean;
export declare const isValidBusinessName: (name: string) => boolean;
export declare const validateFile: (file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    maxNameLength?: number;
}) => {
    isValid: boolean;
    errors: string[];
};
export declare const containsArabic: (text: string) => boolean;
export declare const isPositiveNumber: (value: number) => boolean;
export declare const isValidPercentage: (value: number) => boolean;
export declare const isValidDate: (date: string | Date) => boolean;
export declare const isDateInFuture: (date: string | Date) => boolean;
export declare const isDateInPast: (date: string | Date) => boolean;
export declare const calculateAge: (birthDate: Date) => number;
export declare const isValidAge: (birthDate: Date, minAge?: number, maxAge?: number) => boolean;
export declare const isValidFoundedYear: (year: number) => boolean;
export declare const isValidEmployeeCount: (count: number) => boolean;
export declare const isValidTextLength: (text: string, minLength?: number, maxLength?: number) => boolean;
export declare const isValidLinkedInUrl: (url: string) => boolean;
export declare const isValidRating: (rating: number, min?: number, max?: number) => boolean;
export declare const sanitizeText: (text: string) => string;
export declare const sanitizeEmail: (email: string) => string;
export declare const validateForm: (data: Record<string, any>, rules: Record<string, (value: any) => boolean | {
    isValid: boolean;
    message: string;
}>) => {
    isValid: boolean;
    errors: Record<string, string>;
};
//# sourceMappingURL=validation.d.ts.map