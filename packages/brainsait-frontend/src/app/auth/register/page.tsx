/**
 * Register Page
 * New user registration with role selection
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  HowToReg,
} from '@mui/icons-material';
import { useAuthStore } from '@/lib/store';
import { UserRole } from '@brainsait/shared/types/user.types';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: UserRole.SME_OWNER,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'الاسم الأول مطلوب';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'الاسم الأول يجب أن يكون حرفين على الأقل';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'اسم العائلة مطلوب';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'اسم العائلة يجب أن يكون حرفين على الأقل';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Phone validation (optional but if provided, must be valid Saudi format)
    if (formData.phoneNumber) {
      const phoneRegex = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
        errors.phoneNumber = 'رقم الجوال غير صحيح (مثال: 0501234567)';
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);

      // Redirect to email verification page
      router.push('/auth/verify-email?email=' + encodeURIComponent(formData.email));
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const roleOptions = [
    { value: UserRole.SME_OWNER, label: 'صاحب منشأة صحية', icon: '🏥' },
    { value: UserRole.MENTOR, label: 'مرشد/استشاري', icon: '👨‍🏫' },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
          إنشاء حساب جديد
        </Typography>
        <Typography variant="body2" color="text.secondary">
          انضم إلى منصة BrainSAIT اليوم
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* First Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="firstName"
            name="firstName"
            label="الاسم الأول"
            placeholder="محمد"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
            error={!!validationErrors.firstName}
            helperText={validationErrors.firstName}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            id="lastName"
            name="lastName"
            label="اسم العائلة"
            placeholder="أحمد"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
            error={!!validationErrors.lastName}
            helperText={validationErrors.lastName}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            id="email"
            name="email"
            label="البريد الإلكتروني"
            placeholder="example@healthcare.sa"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Phone Number */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="phoneNumber"
            name="phoneNumber"
            label="رقم الجوال (اختياري)"
            placeholder="0501234567"
            type="tel"
            autoComplete="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={!!validationErrors.phoneNumber}
            helperText={validationErrors.phoneNumber || 'مثال: 0501234567'}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Role Selection */}
        <Grid item xs={12}>
          <FormControl fullWidth required error={!!validationErrors.role}>
            <InputLabel id="role-label">نوع الحساب</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={formData.role}
              label="نوع الحساب"
              onChange={handleChange as any}
              disabled={isLoading}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {validationErrors.role && (
              <FormHelperText>{validationErrors.role}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Password */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            id="password"
            name="password"
            label="كلمة المرور"
            placeholder="أدخل كلمة مرور قوية"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={!!validationErrors.password}
            helperText={
              validationErrors.password ||
              '8 أحرف على الأقل، مع أحرف كبيرة وصغيرة وأرقام'
            }
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Confirm Password */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            id="confirmPassword"
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            placeholder="أعد إدخال كلمة المرور"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Register Button */}
      <Button
        fullWidth
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <HowToReg />
          )
        }
        sx={{
          mt: 3,
          mb: 2,
          py: 1.5,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
      </Button>

      {/* Terms Notice */}
      <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 2 }}>
        بإنشاء حساب، أنت توافق على{' '}
        <Link href="/terms" passHref>
          <Typography component="span" variant="caption" color="primary">
            شروط الاستخدام
          </Typography>
        </Link>
        {' '}و{' '}
        <Link href="/privacy" passHref>
          <Typography component="span" variant="caption" color="primary">
            سياسة الخصوصية
          </Typography>
        </Link>
      </Typography>

      {/* Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          أو
        </Typography>
      </Divider>

      {/* Login Link */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" passHref>
            <Typography
              component="span"
              color="primary"
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              تسجيل الدخول
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
