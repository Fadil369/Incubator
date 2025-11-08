/**
 * Verify Email Page
 * Email verification with token
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Send } from '@mui/icons-material';
import authService from '@/services/authService';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [isVerifying, setIsVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState(email || '');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authService.verifyEmail(verificationToken);
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من البريد الإلكتروني');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رابط التفعيل');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          جاري التحقق من بريدك الإلكتروني...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          يرجى الانتظار
        </Typography>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          تم تفعيل حسابك بنجاح!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          يمكنك الآن تسجيل الدخول واستخدام المنصة
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          سيتم توجيهك إلى صفحة تسجيل الدخول...
        </Typography>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error && token) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          فشل التحقق
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          قد يكون الرابط منتهي الصلاحية. يمكنك طلب رابط جديد أدناه.
        </Typography>

        <TextField
          fullWidth
          label="البريد الإلكتروني"
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleResend}
          disabled={isResending}
          startIcon={isResending ? <CircularProgress size={20} /> : <Send />}
          sx={{ mb: 2 }}
        >
          {isResending ? 'جاري الإرسال...' : 'إرسال رابط تفعيل جديد'}
        </Button>

        <Link href="/auth/login" passHref>
          <Button variant="text" fullWidth>
            العودة إلى تسجيل الدخول
          </Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
          تحقق من بريدك الإلكتروني
        </Typography>
        <Typography variant="body2" color="text.secondary">
          تم إرسال رابط التفعيل إلى بريدك
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        قمنا بإرسال رابط تفعيل إلى <strong>{email}</strong>. يرجى التحقق من صندوق الوارد وصندوق البريد المزعج.
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          لم تستلم الرابط؟
        </Typography>

        <TextField
          fullWidth
          label="البريد الإلكتروني"
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        {resendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            تم إرسال رابط تفعيل جديد إلى بريدك الإلكتروني
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleResend}
          disabled={isResending}
          startIcon={isResending ? <CircularProgress size={20} /> : <Send />}
        >
          {isResending ? 'جاري الإرسال...' : 'إعادة إرسال رابط التفعيل'}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Link href="/auth/login" passHref>
          <Button variant="text">
            العودة إلى تسجيل الدخول
          </Button>
        </Link>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
        <Typography variant="caption" color="warning.dark">
          💡 تحقق من صندوق البريد المزعج إذا لم تجد الرسالة
        </Typography>
      </Box>
    </Box>
  );
}
