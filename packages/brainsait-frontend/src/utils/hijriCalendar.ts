/**
 * Hijri (Islamic) Calendar Utilities for Saudi Arabia
 * Integrates both Hijri and Gregorian calendars for complete date support
 */

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  monthNameAr: string;
  dayName: string;
  dayNameAr: string;
}

export interface BilingualDate {
  gregorian: Date;
  hijri: HijriDate;
  formatted: {
    gregorianAr: string;
    gregorianEn: string;
    hijriAr: string;
    hijriEn: string;
    combined: string;
  };
}

// Hijri month names in Arabic and English
const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 'Jumada al-awwal', 'Jumada al-thani',
  'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

// Arabic day names
const HIJRI_DAYS_AR = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

const HIJRI_DAYS_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert Western/Arabic numerals to Arabic-Indic numerals
 */
export function toArabicNumerals(num: number | string): string {
  return num.toString().replace(/\d/g, (digit) => ARABIC_NUMERALS[parseInt(digit)]);
}

/**
 * Convert Arabic-Indic numerals to Western numerals
 */
export function fromArabicNumerals(arabicNum: string): string {
  let result = arabicNum;
  ARABIC_NUMERALS.forEach((arabicDigit, index) => {
    result = result.replace(new RegExp(arabicDigit, 'g'), index.toString());
  });
  return result;
}

/**
 * Convert Gregorian date to Hijri using Umm al-Qura calendar
 * This is a simplified conversion algorithm - for production use, 
 * consider using a specialized library like moment-hijri or hijri-date
 */
export function gregorianToHijri(date: Date): HijriDate {
  // Simplified conversion algorithm
  // For accurate conversion, this should use the official Umm al-Qura calendar
  const HIJRI_EPOCH = 227015; // July 16, 622 CE (Julian day number)
  const GREGORIAN_EPOCH = 1721426; // January 1, 1 CE (Julian day number)
  
  // Calculate Julian Day Number for the Gregorian date
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let jdn: number;
  if (month <= 2) {
    jdn = Math.floor(365.25 * (year - 1)) + Math.floor(30.6001 * (month + 13)) + day + GREGORIAN_EPOCH - 1;
  } else {
    jdn = Math.floor(365.25 * year) + Math.floor(30.6001 * (month + 1)) + day + GREGORIAN_EPOCH - 1;
  }
  
  // Convert to Hijri
  const daysSinceHijriEpoch = jdn - HIJRI_EPOCH;
  const hijriYear = Math.floor(daysSinceHijriEpoch / 354.367) + 1;
  const remainingDays = daysSinceHijriEpoch - Math.floor((hijriYear - 1) * 354.367);
  
  let hijriMonth = 1;
  let hijriDay = remainingDays;
  
  // Simplified month calculation (should use actual Hijri month lengths)
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]; // Simplified
  
  for (let i = 0; i < 12; i++) {
    if (hijriDay <= monthLengths[i]) {
      hijriMonth = i + 1;
      break;
    }
    hijriDay -= monthLengths[i];
  }
  
  const dayOfWeek = date.getDay();
  
  return {
    year: hijriYear,
    month: hijriMonth,
    day: Math.max(1, Math.floor(hijriDay)),
    monthName: HIJRI_MONTHS_EN[hijriMonth - 1],
    monthNameAr: HIJRI_MONTHS_AR[hijriMonth - 1],
    dayName: HIJRI_DAYS_EN[dayOfWeek],
    dayNameAr: HIJRI_DAYS_AR[dayOfWeek]
  };
}

/**
 * Create a bilingual date object with both Gregorian and Hijri representations
 */
export function createBilingualDate(date: Date): BilingualDate {
  const hijri = gregorianToHijri(date);
  
  // Format Gregorian date in Arabic locale
  const gregorianArOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory',
    numberingSystem: 'arab'
  };
  
  const gregorianEnOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const gregorianAr = new Intl.DateTimeFormat('ar-SA', gregorianArOptions).format(date);
  const gregorianEn = new Intl.DateTimeFormat('en-US', gregorianEnOptions).format(date);
  
  // Format Hijri date
  const hijriAr = `${hijri.dayNameAr}، ${toArabicNumerals(hijri.day)} ${hijri.monthNameAr} ${toArabicNumerals(hijri.year)}هـ`;
  const hijriEn = `${hijri.dayName}, ${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
  
  // Combined format (commonly used in Saudi Arabia)
  const combined = `${hijriAr} الموافق ${gregorianAr}`;
  
  return {
    gregorian: date,
    hijri,
    formatted: {
      gregorianAr,
      gregorianEn,
      hijriAr,
      hijriEn,
      combined
    }
  };
}

/**
 * Format date for Saudi business context
 */
export function formatSaudiBusinessDate(date: Date, format: 'short' | 'long' | 'official' = 'long'): string {
  const bilingualDate = createBilingualDate(date);
  
  switch (format) {
    case 'short':
      return `${toArabicNumerals(bilingualDate.hijri.day)}/${toArabicNumerals(bilingualDate.hijri.month)}/${toArabicNumerals(bilingualDate.hijri.year)}هـ`;
    
    case 'official':
      // Format commonly used in Saudi government documents
      return `${toArabicNumerals(bilingualDate.hijri.day)} ${bilingualDate.hijri.monthNameAr} ${toArabicNumerals(bilingualDate.hijri.year)}هـ الموافق ${toArabicNumerals(date.getDate())}/${toArabicNumerals(date.getMonth() + 1)}/${toArabicNumerals(date.getFullYear())}م`;
    
    case 'long':
    default:
      return bilingualDate.formatted.combined;
  }
}

/**
 * Get current Hijri date
 */
export function getCurrentHijriDate(): HijriDate {
  return gregorianToHijri(new Date());
}

/**
 * Check if a date falls in Ramadan
 */
export function isRamadan(date: Date = new Date()): boolean {
  const hijri = gregorianToHijri(date);
  return hijri.month === 9; // Ramadan is the 9th month
}

/**
 * Check if a date falls in Hajj season (Dhu al-Hijjah)
 */
export function isHajjSeason(date: Date = new Date()): boolean {
  const hijri = gregorianToHijri(date);
  return hijri.month === 12; // Dhu al-Hijjah is the 12th month
}

/**
 * Get Saudi weekend days (Friday and Saturday)
 */
export function isSaudiWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 5 || dayOfWeek === 6; // Friday = 5, Saturday = 6
}

/**
 * Get next Saudi business day (excluding weekends and potential holidays)
 */
export function getNextSaudiBusinessDay(date: Date, daysToAdd: number = 1): Date {
  const result = new Date(date);
  let daysAdded = 0;
  
  while (daysAdded < daysToAdd) {
    result.setDate(result.getDate() + 1);
    
    if (!isSaudiWeekend(result)) {
      daysAdded++;
    }
  }
  
  return result;
}

/**
 * Format time considering Saudi prayer times context
 */
export function formatSaudiTime(date: Date, use24Hour: boolean = false): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
    numberingSystem: 'arab'
  };
  
  return new Intl.DateTimeFormat('ar-SA', timeOptions).format(date);
}

/**
 * Get relative time in Arabic (e.g., "منذ ساعتين")
 */
export function getRelativeTimeArabic(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${toArabicNumerals(diffMinutes)} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
  if (diffHours < 24) return `منذ ${toArabicNumerals(diffHours)} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
  if (diffDays < 7) return `منذ ${toArabicNumerals(diffDays)} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
  if (diffWeeks < 4) return `منذ ${toArabicNumerals(diffWeeks)} ${diffWeeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  if (diffMonths < 12) return `منذ ${toArabicNumerals(diffMonths)} ${diffMonths === 1 ? 'شهر' : 'أشهر'}`;
  
  return `منذ ${toArabicNumerals(diffYears)} ${diffYears === 1 ? 'سنة' : 'سنوات'}`;
}

/**
 * Validate Hijri date input
 */
export function validateHijriDate(year: number, month: number, day: number): boolean {
  if (year < 1 || year > 2000) return false; // Reasonable range
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 30) return false; // Hijri months are 29-30 days
  
  return true;
}

/**
 * Parse Arabic date string input
 */
export function parseArabicDateString(dateString: string): Date | null {
  try {
    // Convert Arabic numerals to Western numerals first
    const westernDateString = fromArabicNumerals(dateString);
    
    // Try to parse various Arabic date formats
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // dd/mm/yyyy
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // dd-mm-yyyy
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,  // yyyy/mm/dd
    ];
    
    for (const pattern of patterns) {
      const match = westernDateString.match(pattern);
      if (match) {
        const [, first, second, third] = match;
        
        // Assume dd/mm/yyyy format for Saudi context
        const day = parseInt(first);
        const month = parseInt(second) - 1; // JavaScript months are 0-indexed
        const year = parseInt(third);
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Export commonly used functions
export default {
  gregorianToHijri,
  createBilingualDate,
  formatSaudiBusinessDate,
  getCurrentHijriDate,
  isRamadan,
  isHajjSeason,
  isSaudiWeekend,
  getNextSaudiBusinessDay,
  formatSaudiTime,
  getRelativeTimeArabic,
  toArabicNumerals,
  fromArabicNumerals,
  validateHijriDate,
  parseArabicDateString
};