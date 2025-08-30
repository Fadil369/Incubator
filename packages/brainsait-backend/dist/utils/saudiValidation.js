/**
 * Validate Saudi Commercial Registration (CR) Number
 * Format: 10 digits, first digit indicates business type
 */
export function validateCRNumber(crNumber) {
    const errors = [];
    if (!crNumber) {
        errors.push('CR number is required');
        return { isValid: false, errors };
    }
    // Remove any spaces or hyphens
    const cleanCR = crNumber.replace(/[\s-]/g, '');
    // Check if it's exactly 10 digits
    if (!/^\d{10}$/.test(cleanCR)) {
        errors.push('CR number must be exactly 10 digits');
        return { isValid: false, errors };
    }
    // Validate first digit (business type indicator)
    const firstDigit = parseInt(cleanCR[0]);
    const validFirstDigits = [1, 2, 3, 4, 5, 6, 7]; // Each represents different business types
    if (!validFirstDigits.includes(firstDigit)) {
        errors.push('Invalid CR number format - first digit must be 1-7');
        return { isValid: false, errors };
    }
    // Additional checksum validation could be added here if the algorithm is available
    return {
        isValid: true,
        errors: [],
        formattedCR: cleanCR
    };
}
/**
 * Validate Saudi VAT Registration Number
 * Format: 15 digits starting with '3' and ending with '00003'
 */
export function validateVATNumber(vatNumber) {
    const errors = [];
    if (!vatNumber) {
        errors.push('VAT number is required');
        return { isValid: false, errors };
    }
    // Remove any spaces or hyphens
    const cleanVAT = vatNumber.replace(/[\s-]/g, '');
    // Check if it's exactly 15 digits
    if (!/^\d{15}$/.test(cleanVAT)) {
        errors.push('VAT number must be exactly 15 digits');
        return { isValid: false, errors };
    }
    // Must start with '3'
    if (!cleanVAT.startsWith('3')) {
        errors.push('VAT number must start with 3');
        return { isValid: false, errors };
    }
    // Must end with '00003'
    if (!cleanVAT.endsWith('00003')) {
        errors.push('VAT number must end with 00003');
        return { isValid: false, errors };
    }
    return {
        isValid: true,
        errors: [],
        formattedVAT: cleanVAT
    };
}
/**
 * Validate Saudi Postal Code
 * Format: 5 digits, specific ranges for each region
 */
export function validateSaudiPostalCode(postalCode) {
    if (!postalCode || !/^\d{5}$/.test(postalCode)) {
        return false;
    }
    const code = parseInt(postalCode);
    // Saudi postal code ranges (approximate)
    const validRanges = [
        [11000, 11999], // Riyadh
        [21000, 21999], // Makkah/Jeddah
        [30000, 30999], // Dammam/Eastern Province
        [31000, 31999], // Al Khobar/Eastern Province  
        [41000, 41999], // Madinah
        [23000, 23999], // Taif
        [32000, 32999], // Qatif/Eastern Province
        [42000, 42999], // Yanbu
        [61000, 61999], // Abha/Asir
        [71000, 71999], // Tabuk
        [51000, 51999], // Hail
        [81000, 81999], // Sakaka/Al Jawf
        [91000, 91999], // Arar/Northern Borders
        [82000, 82999], // Jazan
        [68000, 68999], // Najran
        [65000, 65999], // Al Bahah
    ];
    return validRanges.some(([min, max]) => code >= min && code <= max);
}
/**
 * Validate Saudi mobile phone number
 * Format: +966 5X XXX XXXX or 05X XXX XXXX
 */
export function validateSaudiMobile(mobile) {
    if (!mobile)
        return false;
    // Remove all non-digits
    const cleanMobile = mobile.replace(/\D/g, '');
    // Check for +966 format
    if (cleanMobile.startsWith('966')) {
        const localNumber = cleanMobile.substring(3);
        return /^5[0-9]{8}$/.test(localNumber);
    }
    // Check for 05X format
    if (cleanMobile.startsWith('05')) {
        return /^05[0-9]{8}$/.test(cleanMobile);
    }
    return false;
}
/**
 * Validate complete Saudi address according to WASL standards
 */
export function validateSaudiAddress(address) {
    const errors = [];
    if (!address.buildingNumber || !/^\d{4}$/.test(address.buildingNumber)) {
        errors.push('Building number must be exactly 4 digits');
    }
    if (!address.streetName || address.streetName.trim().length < 3) {
        errors.push('Street name must be at least 3 characters');
    }
    if (!address.district || address.district.trim().length < 3) {
        errors.push('District name must be at least 3 characters');
    }
    if (!address.city || address.city.trim().length < 3) {
        errors.push('City name must be at least 3 characters');
    }
    if (!address.region) {
        errors.push('Region is required');
    }
    if (!address.postalCode || !validateSaudiPostalCode(address.postalCode)) {
        errors.push('Valid 5-digit Saudi postal code is required');
    }
    if (address.additionalNumber && !/^\d{4}$/.test(address.additionalNumber)) {
        errors.push('Additional number must be exactly 4 digits if provided');
    }
    if (errors.length > 0) {
        return { isValid: false, errors };
    }
    return {
        isValid: true,
        errors: [],
        formattedAddress: {
            buildingNumber: address.buildingNumber,
            streetName: address.streetName.trim(),
            district: address.district.trim(),
            city: address.city.trim(),
            region: address.region,
            postalCode: address.postalCode,
            additionalNumber: address.additionalNumber?.trim()
        }
    };
}
/**
 * Generate checksum for Saudi ID number validation
 * This is for future implementation when the algorithm is available
 */
export function validateSaudiID(idNumber) {
    if (!idNumber || !/^\d{10}$/.test(idNumber)) {
        return false;
    }
    // Basic format validation
    // The first digit indicates nationality (1 = Saudi, 2 = Non-Saudi)
    const firstDigit = parseInt(idNumber[0]);
    return firstDigit === 1 || firstDigit === 2;
}
/**
 * Format Saudi phone number for display
 */
export function formatSaudiMobile(mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.startsWith('966')) {
        const localNumber = cleanMobile.substring(3);
        return `+966 ${localNumber.substring(0, 2)} ${localNumber.substring(2, 5)} ${localNumber.substring(5)}`;
    }
    if (cleanMobile.startsWith('05')) {
        return `${cleanMobile.substring(0, 3)} ${cleanMobile.substring(3, 6)} ${cleanMobile.substring(6)}`;
    }
    return mobile;
}
/**
 * Format CR number for display
 */
export function formatCRNumber(crNumber) {
    const cleanCR = crNumber.replace(/\D/g, '');
    if (cleanCR.length === 10) {
        return `${cleanCR.substring(0, 4)}-${cleanCR.substring(4, 7)}-${cleanCR.substring(7)}`;
    }
    return crNumber;
}
/**
 * Format VAT number for display
 */
export function formatVATNumber(vatNumber) {
    const cleanVAT = vatNumber.replace(/\D/g, '');
    if (cleanVAT.length === 15) {
        return `${cleanVAT.substring(0, 3)}-${cleanVAT.substring(3, 6)}-${cleanVAT.substring(6, 9)}-${cleanVAT.substring(9, 12)}-${cleanVAT.substring(12)}`;
    }
    return vatNumber;
}
/**
 * Get Saudi region name in Arabic
 */
export const SAUDI_REGIONS_AR = {
    RIYADH: 'الرياض',
    MAKKAH: 'مكة المكرمة',
    MADINAH: 'المدينة المنورة',
    EASTERN_PROVINCE: 'المنطقة الشرقية',
    ASIR: 'عسير',
    TABUK: 'تبوك',
    QASSIM: 'القصيم',
    HAIL: 'حائل',
    NORTHERN_BORDERS: 'الحدود الشمالية',
    JAZAN: 'جازان',
    NAJRAN: 'نجران',
    AL_BAHAH: 'الباحة',
    AL_JAWF: 'الجوف'
};
/**
 * Get Saudi region name in English
 */
export const SAUDI_REGIONS_EN = {
    RIYADH: 'Riyadh',
    MAKKAH: 'Makkah',
    MADINAH: 'Madinah',
    EASTERN_PROVINCE: 'Eastern Province',
    ASIR: 'Asir',
    TABUK: 'Tabuk',
    QASSIM: 'Qassim',
    HAIL: 'Hail',
    NORTHERN_BORDERS: 'Northern Borders',
    JAZAN: 'Jazan',
    NAJRAN: 'Najran',
    AL_BAHAH: 'Al Bahah',
    AL_JAWF: 'Al Jawf'
};
export default {
    validateCRNumber,
    validateVATNumber,
    validateSaudiPostalCode,
    validateSaudiMobile,
    validateSaudiAddress,
    validateSaudiID,
    formatSaudiMobile,
    formatCRNumber,
    formatVATNumber,
    SAUDI_REGIONS_AR,
    SAUDI_REGIONS_EN
};
//# sourceMappingURL=saudiValidation.js.map