import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { register, verifyEmail, login, refresh, logout, logoutAll, forgotPassword, resetPassword, changePassword, getProfile, } from '../controllers/authController';
const router = Router();
// Validation schemas
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['SME_OWNER', 'MENTOR']).withMessage('Invalid role'),
];
const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];
const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
];
const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];
const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];
const verifyEmailValidation = [
    body('token').notEmpty().withMessage('Verification token is required'),
];
const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
// Public routes
router.post('/register', registerValidation, register);
router.post('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshTokenValidation, refresh);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);
router.get('/profile', authenticate, getProfile);
export default router;
//# sourceMappingURL=auth.js.map