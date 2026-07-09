import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No verification token provided in the URL.');
        setLoading(false);
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Verification link is invalid or has expired.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div
      className="flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ minHeight: 'calc(100vh - 72px)', backgroundColor: '#eef8df' }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2
          className="text-center text-display-md"
          style={{ color: '#12261c' }}
        >
          Account Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div
          className="text-center"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cddcc9',
            borderRadius: '20px',
            padding: '32px 40px',
            boxShadow: '0 8px 30px rgba(27,59,44,0.08)',
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2
                className="w-12 h-12 animate-spin"
                style={{ color: '#1b3b2c' }}
              />
              <p className="text-sm font-medium" style={{ color: '#4f5f54' }}>
                Verifying your email address, please wait...
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle className="w-16 h-16" style={{ color: '#3fa34d' }} />
              <h3
                className="text-xl font-bold"
                style={{ color: '#12261c' }}
              >
                Email Verified Successfully!
              </h3>
              <p className="text-sm" style={{ color: '#4f5f54' }}>
                Your account is active. Redirecting you to the login page...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <XCircle className="w-16 h-16" style={{ color: '#dc2626' }} />
              <h3
                className="text-xl font-bold"
                style={{ color: '#12261c' }}
              >
                Verification Failed
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4f5f54' }}>
                {error}
              </p>
              <div
                className="mt-4 pt-4 w-full flex flex-col gap-2"
                style={{ borderTop: '1px solid #e3eae0' }}
              >
                <Link
                  to="/register"
                  className="btn-accent w-full text-sm"
                  style={{ textDecoration: 'none', height: '40px', fontSize: '14px' }}
                >
                  Go to Registration
                </Link>
                <Link
                  to="/login"
                  className="btn-primary w-full text-sm"
                  style={{ textDecoration: 'none', height: '40px', fontSize: '14px' }}
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
