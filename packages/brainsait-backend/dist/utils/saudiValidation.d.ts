/**
 * Saudi Arabia validation utilities for regulatory compliance
 */
export interface CRValidationResult {
    isValid: boolean;
    errors: string[];
    formattedCR?: string;
}
export interface VATValidationResult {
    isValid: boolean;
    errors: string[];
    formattedVAT?: string;
}
export interface SaudiAddressValidationResult {
    isValid: boolean;
    errors: string[];
    formattedAddress?: SaudiAddress;
}
export interface SaudiAddress {
    buildingNumber: string;
    streetName: string;
    district: string;
    city: string;
    region: string;
    postalCode: string;
    additionalNumber?: string;
}
/**
 * Validate Saudi Commercial Registration (CR) Number
 * Format: 10 digits, first digit indicates business type
 */
export declare function validateCRNumber(crNumber: string): CRValidationResult;
/**
 * Validate Saudi VAT Registration Number
 * Format: 15 digits starting with '3' and ending with '00003'
 */
export declare function validateVATNumber(vatNumber: string): VATValidationResult;
/**
 * Validate Saudi Postal Code
 * Format: 5 digits, specific ranges for each region
 */
export declare function validateSaudiPostalCode(postalCode: string): boolean;
/**
 * Validate Saudi mobile phone number
 * Format: +966 5X XXX XXXX or 05X XXX XXXX
 */
export declare function validateSaudiMobile(mobile: string): boolean;
/**
 * Validate complete Saudi address according to WASL standards
 */
export declare function validateSaudiAddress(address: Partial<SaudiAddress>): SaudiAddressValidationResult;
/**
 * Generate checksum for Saudi ID number validation
 * This is for future implementation when the algorithm is available
 */
export declare function validateSaudiID(idNumber: string): boolean;
/**
 * Format Saudi phone number for display
 */
export declare function formatSaudiMobile(mobile: string): string;
/**
 * Format CR number for display
 */
export declare function formatCRNumber(crNumber: string): string;
/**
 * Format VAT number for display
 */
export declare function formatVATNumber(vatNumber: string): string;
/**
 * Get Saudi region name in Arabic
 */
export declare const SAUDI_REGIONS_AR: Record<string, string>;
/**
 * Get Saudi region name in English
 */
export declare const SAUDI_REGIONS_EN: Record<string, string>;
declare const _default: {
    validateCRNumber: typeof validateCRNumber;
    validateVATNumber: typeof validateVATNumber;
    validateSaudiPostalCode: typeof validateSaudiPostalCode;
    validateSaudiMobile: typeof validateSaudiMobile;
    validateSaudiAddress: typeof validateSaudiAddress;
    validateSaudiID: typeof validateSaudiID;
    formatSaudiMobile: typeof formatSaudiMobile;
    formatCRNumber: typeof formatCRNumber;
    formatVATNumber: typeof formatVATNumber;
    SAUDI_REGIONS_AR: Record<string, string>;
    SAUDI_REGIONS_EN: Record<string, string>;
};
export default _default;
//# sourceMappingURL=saudiValidation.d.ts.map