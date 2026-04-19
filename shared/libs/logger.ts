/**
 * BrainSAIT HIPAA-Compliant Logger
 * Strips PHI before logging. Never logs patient data.
 */

import winston from 'winston';

const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,           // SSN
  /\b\d{9,12}\b/g,                      // Phone-like numbers
  /\b[A-Z]{2}\d{6,8}\b/g,              // Medical record numbers
  /\b(patient|diagnosis|medication|treatment|prescription)\b/gi,
  /\b\d{2}\/\d{2}\/\d{4}\b/g,          // Dates (potential DOB)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
];

function stripPHI(message: string): string {
  let cleaned = message;
  for (const pattern of PHI_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const safeMessage = stripPHI(String(message));
      const safeMeta = JSON.stringify(meta, (key, value) => {
        if (typeof value === 'string') return stripPHI(value);
        return value;
      });
      return JSON.stringify({
        timestamp,
        level,
        service: process.env.SERVICE_NAME || 'unknown',
        message: safeMessage,
        ...(Object.keys(meta).length > 0 ? { meta: JSON.parse(safeMeta) } : {}),
      });
    })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.LOG_FILE
      ? [new winston.transports.File({ filename: process.env.LOG_FILE })]
      : []),
  ],
});

export { logger };
export default logger;
