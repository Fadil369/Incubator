"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Validation schemas
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('role').optional().isIn(['SME_OWNER', 'MENTOR']).withMessage('Invalid role'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const forgotPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];
const changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];
const verifyEmailValidation = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Verification token is required'),
];
const refreshTokenValidation = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
// Public routes
router.post('/register', registerValidation, authController_1.register);
router.post('/verify-email', verifyEmailValidation, authController_1.verifyEmail);
router.post('/login', loginValidation, authController_1.login);
router.post('/refresh', refreshTokenValidation, authController_1.refresh);
router.post('/forgot-password', forgotPasswordValidation, authController_1.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController_1.resetPassword);
// Protected routes
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.post('/logout-all', auth_1.authenticate, authController_1.logoutAll);
router.post('/change-password', auth_1.authenticate, changePasswordValidation, authController_1.changePassword);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map