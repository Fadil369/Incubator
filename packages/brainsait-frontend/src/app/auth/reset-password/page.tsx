/**
 * Reset Password Page
 * Reset password with token
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, CheckCircle } from '@mui/icons-material';
import authService from '@/services/authService';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setError('رابط غير صحيح. يرجى طلب رابط جديد.');
    }
  }, [token]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.password) {
      errors.password = 'كلمة المرور الجديدة مطلوبة';
    } else if (formData.password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('رابط غير صحيح');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'فشلت عملية إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          تم تغيير كلمة المرور بنجاح!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          سيتم توجيهك إلى صفحة تسجيل الدخول...
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
          إعادة تعيين كلمة المرور
        </Typography>
        <Typography variant="body2" color="text.secondary">
          أدخل كلمة المرور الجديدة
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        required
        id="password"
        name="password"
        label="كلمة المرور الجديدة"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={(e) => {
          setFormData({ ...formData, password: e.target.value });
          setValidationErrors((prev) => ({ ...prev, password: '' }));
        }}
        error={!!validationErrors.password}
        helperText={validationErrors.password || '8 أحرف على الأقل، مع أحرف كبيرة وصغيرة وأرقام'}
        disabled={isLoading || !token}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        required
        id="confirmPassword"
        name="confirmPassword"
        label="تأكيد كلمة المرور"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={(e) => {
          setFormData({ ...formData, confirmPassword: e.target.value });
          setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }}
        error={!!validationErrors.confirmPassword}
        helperText={validationErrors.confirmPassword}
        disabled={isLoading || !token}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        type="submit"
        variant="contained"
        size="large"
        disabled={isLoading || !token}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
        sx={{ mb: 2, py: 1.5 }}
      >
        {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Link href="/auth/login" passHref>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            العودة إلى تسجيل الدخول
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}
