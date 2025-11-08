/**
 * Forgot Password Page
 * Request password reset link
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, Send, CheckCircle, ArrowBack } from '@mui/icons-material';
import authService from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) {
      return 'البريد الإلكتروني مطلوب';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'البريد الإلكتروني غير صحيح';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError('');

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رابط إعادة التعيين');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircle
          sx={{
            fontSize: 80,
            color: 'success.main',
            mb: 2,
          }}
        />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          تم إرسال الرابط بنجاح!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          تم إرسال رابط إعادة تعيين كلمة المرور إلى:
        </Typography>
        <Typography variant="body1" fontWeight={600} color="primary" sx={{ mb: 3 }}>
          {email}
        </Typography>
        <Alert severity="info" sx={{ mb: 3, textAlign: 'right' }}>
          يرجى التحقق من صندوق الوارد وصندوق البريد المزعج. الرابط صالح لمدة ساعة واحدة.
        </Alert>
        <Link href="/auth/login" passHref>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            fullWidth
            size="large"
          >
            العودة إلى تسجيل الدخول
          </Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
          نسيت كلمة المرور؟
        </Typography>
        <Typography variant="body2" color="text.secondary">
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
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
        id="email"
        name="email"
        label="البريد الإلكتروني"
        placeholder="example@healthcare.sa"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError('');
          setError(null);
        }}
        error={!!emailError}
        helperText={emailError}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
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
        disabled={isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <Send />
          )
        }
        sx={{ mb: 2, py: 1.5 }}
      >
        {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Link href="/auth/login" passHref>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            disabled={isLoading}
          >
            العودة إلى تسجيل الدخول
          </Button>
        </Link>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
        <Typography variant="caption" color="warning.dark">
          💡 لم تستلم الرابط؟ تحقق من صندوق البريد المزعج أو حاول مرة أخرى بعد دقيقة
        </Typography>
      </Box>
    </Box>
  );
}
