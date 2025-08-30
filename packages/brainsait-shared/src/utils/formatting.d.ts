/**
 * Utility functions for formatting data in both English and Arabic contexts
 */
export declare const formatDate: (date: Date | string, locale?: string) => string;
export declare const formatDateTime: (date: Date | string, locale?: string) => string;
export declare const formatTimeAgo: (date: Date | string, locale?: string) => string;
export declare const formatCurrency: (amount: number, currency?: string, locale?: string) => string;
export declare const formatNumber: (number: number, locale?: string) => string;
export declare const formatPercentage: (value: number, locale?: string) => string;
export declare const capitalize: (text: string) => string;
export declare const truncateText: (text: string, maxLength: number, suffix?: string) => string;
export declare const slugify: (text: string) => string;
export declare const formatFileSize: (bytes: number, locale?: string) => string;
export declare const formatPhoneNumber: (phoneNumber: string, countryCode?: string) => string;
export declare const formatAddress: (address: {
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
}, locale?: string) => string;
export declare const formatDuration: (minutes: number, locale?: string) => string;
//# sourceMappingURL=formatting.d.ts.map