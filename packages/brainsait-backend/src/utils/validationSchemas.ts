import { body, query, param } from 'express-validator';
import { SMEType, IndustryFocus, UserRole, ProgramType, ProgramStatus, EnrollmentStatus, VerificationStatus } from '@brainsait/shared';

// Common validation rules
export const commonValidation = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  name: (field: string) => body(field).trim().isLength({ min: 1, max: 100 }).withMessage(`${field} must be between 1 and 100 characters`),
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  search: query('search').optional().isString().isLength({ max: 255 }).withMessage('Search term is too long'),
};

// Authentication validation schemas
export const authValidation = {
  register: [
    commonValidation.email,
    commonValidation.password,
    commonValidation.name('firstName'),
    commonValidation.name('lastName'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
  ],

  login: [
    commonValidation.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],

  verifyEmail: [
    body('token').notEmpty().isLength({ min: 32, max: 128 }).withMessage('Invalid verification token'),
  ],

  forgotPassword: [
    commonValidation.email,
  ],

  resetPassword: [
    body('token').notEmpty().isLength({ min: 32, max: 128 }).withMessage('Invalid reset token'),
    commonValidation.password,
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  ],

  refreshToken: [
    body('refreshToken').notEmpty().isJWT().withMessage('Valid refresh token is required'),
  ],
};

// SME validation schemas
export const smeValidation = {
  create: [
    body('companyName').trim().isLength({ min: 1, max: 255 }).withMessage('Company name is required and must be less than 255 characters'),
    body('companyType').isIn(Object.values(SMEType)).withMessage('Invalid company type'),
    body('industryFocus').isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    body('industryFocus.*').isIn(Object.values(IndustryFocus)).withMessage('Invalid industry focus'),
    body('description').optional().isString().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('employeeCount').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid employee count'),
    body('annualRevenue').optional().isString().isLength({ max: 50 }).withMessage('Annual revenue must be a string less than 50 characters'),
    body('address').optional().isObject().withMessage('Address must be an object'),
  ],

  update: [
    body('companyName').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Company name must be less than 255 characters'),
    body('companyType').optional().isIn(Object.values(SMEType)).withMessage('Invalid company type'),
    body('industryFocus').optional().isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    body('industryFocus.*').optional().isIn(Object.values(IndustryFocus)).withMessage('Invalid industry focus'),
    body('description').optional().isString().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('employeeCount').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid employee count'),
    body('annualRevenue').optional().isString().isLength({ max: 50 }).withMessage('Annual revenue must be a string less than 50 characters'),
    body('address').optional().isObject().withMessage('Address must be an object'),
  ],

  list: [
    ...commonValidation.pagination,
    commonValidation.search,
    query('companyType').optional().isIn(Object.values(SMEType)).withMessage('Invalid company type'),
    query('industryFocus').optional().isIn(Object.values(IndustryFocus)).withMessage('Invalid industry focus'),
    query('verificationStatus').optional().isIn(Object.values(VerificationStatus)).withMessage('Invalid verification status'),
  ],

  updateVerification: [
    commonValidation.id,
    body('verificationStatus').isIn(Object.values(VerificationStatus)).withMessage('Invalid verification status'),
    body('rejectionReason').optional().isString().isLength({ max: 500 }).withMessage('Rejection reason must be less than 500 characters'),
  ],

  uploadDocuments: [
    commonValidation.id,
    body('documents').isObject().withMessage('Documents must be an object'),
  ],
};

// Program validation schemas
export const programValidation = {
  create: [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
    body('titleAr').optional().isString().isLength({ max: 255 }).withMessage('Arabic title must be less than 255 characters'),
    body('description').trim().isLength({ min: 1, max: 5000 }).withMessage('Description is required and must be less than 5000 characters'),
    body('descriptionAr').optional().isString().isLength({ max: 5000 }).withMessage('Arabic description must be less than 5000 characters'),
    body('type').isIn(Object.values(ProgramType)).withMessage('Invalid program type'),
    body('duration').isInt({ min: 1, max: 520 }).withMessage('Duration must be between 1 and 520 weeks'),
    body('maxParticipants').isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10,000'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    body('requirements').optional().isObject().withMessage('Requirements must be an object'),
    body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    body('resources').optional().isObject().withMessage('Resources must be an object'),
  ],

  update: [
    commonValidation.id,
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
    body('titleAr').optional().isString().isLength({ max: 255 }).withMessage('Arabic title must be less than 255 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 5000 }).withMessage('Description must be less than 5000 characters'),
    body('descriptionAr').optional().isString().isLength({ max: 5000 }).withMessage('Arabic description must be less than 5000 characters'),
    body('type').optional().isIn(Object.values(ProgramType)).withMessage('Invalid program type'),
    body('duration').optional().isInt({ min: 1, max: 520 }).withMessage('Duration must be between 1 and 520 weeks'),
    body('maxParticipants').optional().isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10,000'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    body('status').optional().isIn(Object.values(ProgramStatus)).withMessage('Invalid program status'),
    body('requirements').optional().isObject().withMessage('Requirements must be an object'),
    body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    body('resources').optional().isObject().withMessage('Resources must be an object'),
  ],

  list: [
    ...commonValidation.pagination,
    commonValidation.search,
    query('type').optional().isIn(Object.values(ProgramType)).withMessage('Invalid program type'),
    query('status').optional().isIn(Object.values(ProgramStatus)).withMessage('Invalid program status'),
    query('minDuration').optional().isInt({ min: 1 }).withMessage('Min duration must be a positive integer'),
    query('maxDuration').optional().isInt({ min: 1 }).withMessage('Max duration must be a positive integer'),
  ],

  enroll: [
    commonValidation.id,
  ],

  updateEnrollmentStatus: [
    param('enrollmentId').isUUID().withMessage('Invalid enrollment ID format'),
    body('status').isIn(Object.values(EnrollmentStatus)).withMessage('Invalid enrollment status'),
    body('rejectionReason').optional().isString().isLength({ max: 500 }).withMessage('Rejection reason must be less than 500 characters'),
  ],

  updateProgress: [
    param('enrollmentId').isUUID().withMessage('Invalid enrollment ID format'),
    body('progress').isFloat({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
  ],
};

// Document validation schemas
export const documentValidation = {
  feasibilityStudy: [
    body('businessModel').trim().isLength({ min: 1, max: 2000 }).withMessage('Business model is required and must be less than 2000 characters'),
    body('targetMarket').trim().isLength({ min: 1, max: 2000 }).withMessage('Target market is required and must be less than 2000 characters'),
    body('competitiveAdvantage').trim().isLength({ min: 1, max: 2000 }).withMessage('Competitive advantage is required and must be less than 2000 characters'),
    body('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
    body('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
    body('riskAssessment').optional().isObject().withMessage('Risk assessment must be an object'),
    body('timeline').optional().isObject().withMessage('Timeline must be an object'),
  ],

  businessPlan: [
    body('executiveSummary').optional().isString().isLength({ max: 5000 }).withMessage('Executive summary must be less than 5000 characters'),
    body('businessDescription').optional().isString().isLength({ max: 5000 }).withMessage('Business description must be less than 5000 characters'),
    body('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
    body('organizationManagement').optional().isObject().withMessage('Organization management must be an object'),
    body('serviceProductLine').optional().isObject().withMessage('Service/product line must be an object'),
    body('marketingSales').optional().isObject().withMessage('Marketing/sales must be an object'),
    body('fundingRequest').optional().isObject().withMessage('Funding request must be an object'),
    body('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
    body('appendix').optional().isString().isLength({ max: 10000 }).withMessage('Appendix must be less than 10000 characters'),
  ],

  certificate: [
    body('enrollmentId').optional().isUUID().withMessage('Invalid enrollment ID format'),
    body('recipientName').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Recipient name must be between 1 and 255 characters'),
    body('programTitle').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Program title must be between 1 and 255 characters'),
    body('completionDate').optional().isISO8601().withMessage('Invalid completion date format'),
    body('certificateType').optional().isIn(['COMPLETION', 'ACHIEVEMENT', 'PARTICIPATION']).withMessage('Invalid certificate type'),
    body('signatory').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Signatory must be between 1 and 255 characters'),
    body('signatoryTitle').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Signatory title must be between 1 and 255 characters'),
  ],

  fileName: [
    param('fileName').isString().matches(/^[a-zA-Z0-9_\-\.]+$/).withMessage('Invalid filename format'),
  ],
};

// Analytics validation schemas
export const analyticsValidation = {
  export: [
    query('type').isIn(['users', 'smes', 'programs', 'enrollments']).withMessage('Invalid export type'),
    query('format').isIn(['csv', 'json']).withMessage('Invalid export format'),
  ],

  dateRange: [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  ],
};

// User validation schemas
export const userValidation = {
  updateProfile: [
    body('firstName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
    body('phoneNumber').optional().isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],

  list: [
    ...commonValidation.pagination,
    commonValidation.search,
    query('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
  ],

  updateRole: [
    commonValidation.id,
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
  ],

  updateStatus: [
    commonValidation.id,
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
};

// File upload validation
export const fileValidation = {
  single: [
    body('uploadType').optional().isIn(['avatar', 'document', 'certificate']).withMessage('Invalid upload type'),
  ],

  multiple: [
    body('uploadType').isIn(['documents']).withMessage('Invalid upload type for multiple files'),
  ],
};

// Custom validation functions
export const customValidation = {
  // Validate that end date is after start date
  dateRange: (startField: string, endField: string) => [
    body(endField).custom((endDate, { req }) => {
      if (endDate && req.body[startField]) {
        const start = new Date(req.body[startField]);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  ],

  // Validate password confirmation
  passwordConfirmation: [
    body('confirmPassword').custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  ],

  // Validate array length
  arrayLength: (field: string, min: number, max?: number) => [
    body(field).isArray({ min, max }).withMessage(`${field} must be an array with ${min}-${max || 'unlimited'} items`),
  ],

  // Validate unique values in array
  uniqueArray: (field: string) => [
    body(field).custom((array) => {
      if (Array.isArray(array)) {
        const uniqueValues = [...new Set(array)];
        if (uniqueValues.length !== array.length) {
          throw new Error(`${field} must contain unique values`);
        }
      }
      return true;
    }),
  ],

  // Validate email uniqueness (would require database check)
  emailUnique: [
    body('email').custom(async (email) => {
      // This would need to be implemented with actual database check
      // const existingUser = await User.findOne({ email });
      // if (existingUser) {
      //   throw new Error('Email already in use');
      // }
      return true;
    }),
  ],

  // Validate file size and type
  fileValidation: [
    body('file').custom((file, { req }) => {
      if (req.file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
          throw new Error('File size too large (max 10MB)');
        }

        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedMimes.includes(req.file.mimetype)) {
          throw new Error('Invalid file type');
        }
      }
      return true;
    }),
  ],
};

// Combine all validation schemas
export const validationSchemas = {
  auth: authValidation,
  sme: smeValidation,
  program: programValidation,
  document: documentValidation,
  analytics: analyticsValidation,
  user: userValidation,
  file: fileValidation,
  common: commonValidation,
  custom: customValidation,
};