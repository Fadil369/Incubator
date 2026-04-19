/**
 * BrainSAIT Data Contracts Validator
 * Validates data schemas for HIPAA compliance and cross-startup compatibility
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface DataContract {
  name: string;
  version: string;
  description: string;
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required: string[];
  hipaa_compliant: boolean;
  pii_fields: string[];
  sharing_policy: 'public' | 'internal' | 'anonymized-only' | 'restricted';
  encryption?: 'at-rest' | 'in-transit' | 'both';
  retention_days?: number;
}

interface SchemaProperty {
  type: string;
  format?: string;
  enum?: string[];
  description?: string;
  example?: unknown;
}

// Known PII field name patterns
const PII_PATTERNS = [
  'name', 'email', 'phone', 'ssn', 'address', 'dob', 'birth',
  'mrn', 'patient', 'diagnosis', 'medication', 'treatment',
  'insurance', 'passport', 'license', 'biometric', 'genetic',
];

// HIPAA Safe Harbor identifiers (18 types)
const HIPAA_SAFE_HARBOR = [
  'name', 'address', 'date', 'phone', 'fax', 'email', 'ssn',
  'mrn', 'health_plan', 'account', 'certificate', 'vehicle',
  'device', 'url', 'ip', 'biometric', 'photo', 'other_unique',
];

export function validateDataContract(contract: DataContract): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure
  if (!contract.name) errors.push('Contract name is required');
  if (!contract.version) errors.push('Contract version is required (semver)');
  if (!contract.properties || Object.keys(contract.properties).length === 0) {
    errors.push('Contract must have at least one property');
  }

  // HIPAA compliance check
  if (contract.hipaa_compliant) {
    const declaredPII = new Set(contract.pii_fields.map((f) => f.toLowerCase()));

    // Check for undeclared PII fields
    for (const [fieldName, prop] of Object.entries(contract.properties)) {
      const lowerName = fieldName.toLowerCase();
      const isPII = PII_PATTERNS.some((pattern) => lowerName.includes(pattern));

      if (isPII && !declaredPII.has(lowerName)) {
        errors.push(
          `HIPAA: Field "${fieldName}" appears to be PII but is not declared in pii_fields`
        );
      }

      // Check for free-text fields that might contain PHI
      if (prop.type === 'string' && !prop.enum && !prop.format) {
        warnings.push(
          `HIPAA: Field "${fieldName}" is a free-text string — consider adding enum or format constraints to prevent PHI leakage`
        );
      }
    }

    // Sharing policy validation
    if (contract.sharing_policy === 'public' && contract.pii_fields.length > 0) {
      errors.push('HIPAA: Cannot share PII fields with "public" sharing policy');
    }

    if (contract.sharing_policy === 'anonymized-only') {
      for (const piiField of contract.pii_fields) {
        if (contract.properties[piiField]) {
          const prop = contract.properties[piiField];
          if (prop.type === 'string' && !prop.enum) {
            warnings.push(
              `Anonymized sharing: PII field "${piiField}" should use enum or bucketed values`
            );
          }
        }
      }
    }

    // Encryption check
    if (!contract.encryption) {
      warnings.push('HIPAA: Consider specifying encryption policy (at-rest, in-transit, or both)');
    }

    // Retention check
    if (contract.retention_days && contract.retention_days > 2555) {
      warnings.push('Retention period exceeds 7 years — verify compliance requirements');
    }
  }

  // Cross-startup compatibility
  for (const [fieldName, prop] of Object.entries(contract.properties)) {
    if (prop.type === 'string' && !prop.format && !prop.enum) {
      warnings.push(`Field "${fieldName}" has no format constraint — may cause compatibility issues`);
    }
  }

  // Validate schema structure with AJV
  try {
    ajv.compile({
      type: contract.type,
      properties: contract.properties,
      required: contract.required,
    });
  } catch (err: any) {
    errors.push(`Schema validation error: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function generateContractTemplate(sector: string): DataContract {
  return {
    name: `${sector}-data-exchange`,
    version: '1.0.0',
    description: `Data exchange contract for ${sector} domain`,
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      sector: { type: 'string', enum: [sector] },
      data: { type: 'object', description: 'Domain-specific data payload' },
    },
    required: ['id', 'created_at', 'sector'],
    hipaa_compliant: true,
    pii_fields: [],
    sharing_policy: 'anonymized-only',
    encryption: 'both',
    retention_days: 365,
  };
}
