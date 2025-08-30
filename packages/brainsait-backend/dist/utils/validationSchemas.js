"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchemas = exports.customValidation = exports.fileValidation = exports.userValidation = exports.analyticsValidation = exports.documentValidation = exports.programValidation = exports.smeValidation = exports.authValidation = exports.commonValidation = void 0;
const express_validator_1 = require("express-validator");
const shared_1 = require("@brainsait/shared");
// Common validation rules
exports.commonValidation = {
    id: (0, express_validator_1.param)('id').isUUID().withMessage('Invalid ID format'),
    email: (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    password: (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    name: (field) => (0, express_validator_1.body)(field).trim().isLength({ min: 1, max: 100 }).withMessage(`${field} must be between 1 and 100 characters`),
    pagination: [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    ],
    search: (0, express_validator_1.query)('search').optional().isString().isLength({ max: 255 }).withMessage('Search term is too long'),
};
// Authentication validation schemas
exports.authValidation = {
    register: [
        exports.commonValidation.email,
        exports.commonValidation.password,
        exports.commonValidation.name('firstName'),
        exports.commonValidation.name('lastName'),
        (0, express_validator_1.body)('role').optional().isIn(Object.values(shared_1.UserRole)).withMessage('Invalid role'),
    ],
    login: [
        exports.commonValidation.email,
        (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    ],
    verifyEmail: [
        (0, express_validator_1.body)('token').notEmpty().isLength({ min: 32, max: 128 }).withMessage('Invalid verification token'),
    ],
    forgotPassword: [
        exports.commonValidation.email,
    ],
    resetPassword: [
        (0, express_validator_1.body)('token').notEmpty().isLength({ min: 32, max: 128 }).withMessage('Invalid reset token'),
        exports.commonValidation.password,
    ],
    changePassword: [
        (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
        (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
    ],
    refreshToken: [
        (0, express_validator_1.body)('refreshToken').notEmpty().isJWT().withMessage('Valid refresh token is required'),
    ],
};
// SME validation schemas
exports.smeValidation = {
    create: [
        (0, express_validator_1.body)('companyName').trim().isLength({ min: 1, max: 255 }).withMessage('Company name is required and must be less than 255 characters'),
        (0, express_validator_1.body)('companyType').isIn(Object.values(shared_1.SMEType)).withMessage('Invalid company type'),
        (0, express_validator_1.body)('industryFocus').isArray({ min: 1 }).withMessage('At least one industry focus is required'),
        (0, express_validator_1.body)('industryFocus.*').isIn(Object.values(shared_1.IndustryFocus)).withMessage('Invalid industry focus'),
        (0, express_validator_1.body)('description').optional().isString().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
        (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
        (0, express_validator_1.body)('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
        (0, express_validator_1.body)('employeeCount').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid employee count'),
        (0, express_validator_1.body)('annualRevenue').optional().isString().isLength({ max: 50 }).withMessage('Annual revenue must be a string less than 50 characters'),
        (0, express_validator_1.body)('address').optional().isObject().withMessage('Address must be an object'),
    ],
    update: [
        (0, express_validator_1.body)('companyName').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Company name must be less than 255 characters'),
        (0, express_validator_1.body)('companyType').optional().isIn(Object.values(shared_1.SMEType)).withMessage('Invalid company type'),
        (0, express_validator_1.body)('industryFocus').optional().isArray({ min: 1 }).withMessage('At least one industry focus is required'),
        (0, express_validator_1.body)('industryFocus.*').optional().isIn(Object.values(shared_1.IndustryFocus)).withMessage('Invalid industry focus'),
        (0, express_validator_1.body)('description').optional().isString().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
        (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
        (0, express_validator_1.body)('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
        (0, express_validator_1.body)('employeeCount').optional().isInt({ min: 0, max: 1000000 }).withMessage('Invalid employee count'),
        (0, express_validator_1.body)('annualRevenue').optional().isString().isLength({ max: 50 }).withMessage('Annual revenue must be a string less than 50 characters'),
        (0, express_validator_1.body)('address').optional().isObject().withMessage('Address must be an object'),
    ],
    list: [
        ...exports.commonValidation.pagination,
        exports.commonValidation.search,
        (0, express_validator_1.query)('companyType').optional().isIn(Object.values(shared_1.SMEType)).withMessage('Invalid company type'),
        (0, express_validator_1.query)('industryFocus').optional().isIn(Object.values(shared_1.IndustryFocus)).withMessage('Invalid industry focus'),
        (0, express_validator_1.query)('verificationStatus').optional().isIn(Object.values(shared_1.VerificationStatus)).withMessage('Invalid verification status'),
    ],
    updateVerification: [
        exports.commonValidation.id,
        (0, express_validator_1.body)('verificationStatus').isIn(Object.values(shared_1.VerificationStatus)).withMessage('Invalid verification status'),
        (0, express_validator_1.body)('rejectionReason').optional().isString().isLength({ max: 500 }).withMessage('Rejection reason must be less than 500 characters'),
    ],
    uploadDocuments: [
        exports.commonValidation.id,
        (0, express_validator_1.body)('documents').isObject().withMessage('Documents must be an object'),
    ],
};
// Program validation schemas
exports.programValidation = {
    create: [
        (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
        (0, express_validator_1.body)('titleAr').optional().isString().isLength({ max: 255 }).withMessage('Arabic title must be less than 255 characters'),
        (0, express_validator_1.body)('description').trim().isLength({ min: 1, max: 5000 }).withMessage('Description is required and must be less than 5000 characters'),
        (0, express_validator_1.body)('descriptionAr').optional().isString().isLength({ max: 5000 }).withMessage('Arabic description must be less than 5000 characters'),
        (0, express_validator_1.body)('type').isIn(Object.values(shared_1.ProgramType)).withMessage('Invalid program type'),
        (0, express_validator_1.body)('duration').isInt({ min: 1, max: 520 }).withMessage('Duration must be between 1 and 520 weeks'),
        (0, express_validator_1.body)('maxParticipants').isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10,000'),
        (0, express_validator_1.body)('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
        (0, express_validator_1.body)('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        (0, express_validator_1.body)('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        (0, express_validator_1.body)('requirements').optional().isObject().withMessage('Requirements must be an object'),
        (0, express_validator_1.body)('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
        (0, express_validator_1.body)('resources').optional().isObject().withMessage('Resources must be an object'),
    ],
    update: [
        exports.commonValidation.id,
        (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be less than 255 characters'),
        (0, express_validator_1.body)('titleAr').optional().isString().isLength({ max: 255 }).withMessage('Arabic title must be less than 255 characters'),
        (0, express_validator_1.body)('description').optional().trim().isLength({ min: 1, max: 5000 }).withMessage('Description must be less than 5000 characters'),
        (0, express_validator_1.body)('descriptionAr').optional().isString().isLength({ max: 5000 }).withMessage('Arabic description must be less than 5000 characters'),
        (0, express_validator_1.body)('type').optional().isIn(Object.values(shared_1.ProgramType)).withMessage('Invalid program type'),
        (0, express_validator_1.body)('duration').optional().isInt({ min: 1, max: 520 }).withMessage('Duration must be between 1 and 520 weeks'),
        (0, express_validator_1.body)('maxParticipants').optional().isInt({ min: 1, max: 10000 }).withMessage('Max participants must be between 1 and 10,000'),
        (0, express_validator_1.body)('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
        (0, express_validator_1.body)('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        (0, express_validator_1.body)('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        (0, express_validator_1.body)('status').optional().isIn(Object.values(shared_1.ProgramStatus)).withMessage('Invalid program status'),
        (0, express_validator_1.body)('requirements').optional().isObject().withMessage('Requirements must be an object'),
        (0, express_validator_1.body)('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
        (0, express_validator_1.body)('resources').optional().isObject().withMessage('Resources must be an object'),
    ],
    list: [
        ...exports.commonValidation.pagination,
        exports.commonValidation.search,
        (0, express_validator_1.query)('type').optional().isIn(Object.values(shared_1.ProgramType)).withMessage('Invalid program type'),
        (0, express_validator_1.query)('status').optional().isIn(Object.values(shared_1.ProgramStatus)).withMessage('Invalid program status'),
        (0, express_validator_1.query)('minDuration').optional().isInt({ min: 1 }).withMessage('Min duration must be a positive integer'),
        (0, express_validator_1.query)('maxDuration').optional().isInt({ min: 1 }).withMessage('Max duration must be a positive integer'),
    ],
    enroll: [
        exports.commonValidation.id,
    ],
    updateEnrollmentStatus: [
        (0, express_validator_1.param)('enrollmentId').isUUID().withMessage('Invalid enrollment ID format'),
        (0, express_validator_1.body)('status').isIn(Object.values(shared_1.EnrollmentStatus)).withMessage('Invalid enrollment status'),
        (0, express_validator_1.body)('rejectionReason').optional().isString().isLength({ max: 500 }).withMessage('Rejection reason must be less than 500 characters'),
    ],
    updateProgress: [
        (0, express_validator_1.param)('enrollmentId').isUUID().withMessage('Invalid enrollment ID format'),
        (0, express_validator_1.body)('progress').isFloat({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
    ],
};
// Document validation schemas
exports.documentValidation = {
    feasibilityStudy: [
        (0, express_validator_1.body)('businessModel').trim().isLength({ min: 1, max: 2000 }).withMessage('Business model is required and must be less than 2000 characters'),
        (0, express_validator_1.body)('targetMarket').trim().isLength({ min: 1, max: 2000 }).withMessage('Target market is required and must be less than 2000 characters'),
        (0, express_validator_1.body)('competitiveAdvantage').trim().isLength({ min: 1, max: 2000 }).withMessage('Competitive advantage is required and must be less than 2000 characters'),
        (0, express_validator_1.body)('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
        (0, express_validator_1.body)('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
        (0, express_validator_1.body)('riskAssessment').optional().isObject().withMessage('Risk assessment must be an object'),
        (0, express_validator_1.body)('timeline').optional().isObject().withMessage('Timeline must be an object'),
    ],
    businessPlan: [
        (0, express_validator_1.body)('executiveSummary').optional().isString().isLength({ max: 5000 }).withMessage('Executive summary must be less than 5000 characters'),
        (0, express_validator_1.body)('businessDescription').optional().isString().isLength({ max: 5000 }).withMessage('Business description must be less than 5000 characters'),
        (0, express_validator_1.body)('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
        (0, express_validator_1.body)('organizationManagement').optional().isObject().withMessage('Organization management must be an object'),
        (0, express_validator_1.body)('serviceProductLine').optional().isObject().withMessage('Service/product line must be an object'),
        (0, express_validator_1.body)('marketingSales').optional().isObject().withMessage('Marketing/sales must be an object'),
        (0, express_validator_1.body)('fundingRequest').optional().isObject().withMessage('Funding request must be an object'),
        (0, express_validator_1.body)('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
        (0, express_validator_1.body)('appendix').optional().isString().isLength({ max: 10000 }).withMessage('Appendix must be less than 10000 characters'),
    ],
    certificate: [
        (0, express_validator_1.body)('enrollmentId').optional().isUUID().withMessage('Invalid enrollment ID format'),
        (0, express_validator_1.body)('recipientName').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Recipient name must be between 1 and 255 characters'),
        (0, express_validator_1.body)('programTitle').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Program title must be between 1 and 255 characters'),
        (0, express_validator_1.body)('completionDate').optional().isISO8601().withMessage('Invalid completion date format'),
        (0, express_validator_1.body)('certificateType').optional().isIn(['COMPLETION', 'ACHIEVEMENT', 'PARTICIPATION']).withMessage('Invalid certificate type'),
        (0, express_validator_1.body)('signatory').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Signatory must be between 1 and 255 characters'),
        (0, express_validator_1.body)('signatoryTitle').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Signatory title must be between 1 and 255 characters'),
    ],
    fileName: [
        (0, express_validator_1.param)('fileName').isString().matches(/^[a-zA-Z0-9_\-\.]+$/).withMessage('Invalid filename format'),
    ],
};
// Analytics validation schemas
exports.analyticsValidation = {
    export: [
        (0, express_validator_1.query)('type').isIn(['users', 'smes', 'programs', 'enrollments']).withMessage('Invalid export type'),
        (0, express_validator_1.query)('format').isIn(['csv', 'json']).withMessage('Invalid export format'),
    ],
    dateRange: [
        (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    ],
};
// User validation schemas
exports.userValidation = {
    updateProfile: [
        (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
        (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
        (0, express_validator_1.body)('phoneNumber').optional().isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number'),
        (0, express_validator_1.body)('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    ],
    list: [
        ...exports.commonValidation.pagination,
        exports.commonValidation.search,
        (0, express_validator_1.query)('role').optional().isIn(Object.values(shared_1.UserRole)).withMessage('Invalid role'),
        (0, express_validator_1.query)('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
        (0, express_validator_1.query)('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean'),
    ],
    updateRole: [
        exports.commonValidation.id,
        (0, express_validator_1.body)('role').isIn(Object.values(shared_1.UserRole)).withMessage('Invalid role'),
    ],
    updateStatus: [
        exports.commonValidation.id,
        (0, express_validator_1.body)('isActive').isBoolean().withMessage('isActive must be a boolean'),
    ],
};
// File upload validation
exports.fileValidation = {
    single: [
        (0, express_validator_1.body)('uploadType').optional().isIn(['avatar', 'document', 'certificate']).withMessage('Invalid upload type'),
    ],
    multiple: [
        (0, express_validator_1.body)('uploadType').isIn(['documents']).withMessage('Invalid upload type for multiple files'),
    ],
};
// Custom validation functions
exports.customValidation = {
    // Validate that end date is after start date
    dateRange: (startField, endField) => [
        (0, express_validator_1.body)(endField).custom((endDate, { req }) => {
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
        (0, express_validator_1.body)('confirmPassword').custom((confirmPassword, { req }) => {
            if (confirmPassword !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
    ],
    // Validate array length
    arrayLength: (field, min, max) => [
        (0, express_validator_1.body)(field).isArray({ min, max }).withMessage(`${field} must be an array with ${min}-${max || 'unlimited'} items`),
    ],
    // Validate unique values in array
    uniqueArray: (field) => [
        (0, express_validator_1.body)(field).custom((array) => {
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
        (0, express_validator_1.body)('email').custom(async (email) => {
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
        (0, express_validator_1.body)('file').custom((file, { req }) => {
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
exports.validationSchemas = {
    auth: exports.authValidation,
    sme: exports.smeValidation,
    program: exports.programValidation,
    document: exports.documentValidation,
    analytics: exports.analyticsValidation,
    user: exports.userValidation,
    file: exports.fileValidation,
    common: exports.commonValidation,
    custom: exports.customValidation,
};
//# sourceMappingURL=validationSchemas.js.map