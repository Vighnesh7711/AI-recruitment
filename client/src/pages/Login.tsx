import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveSession } from '../lib/api';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onAuthChange: () => void;
}

export function Login({ onAuthChange }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      saveSession(accessToken, user);
      onAuthChange();

      if (user.role === 'hr') {
        navigate('/hr/jobs');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: '#4f5f54' }}>
          Or{' '}
          <Link
            to="/register"
            className="font-semibold transition-colors"
            style={{ color: '#1b3b2c' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c8f24c')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1b3b2c')}
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cddcc9',
            borderRadius: '20px',
            padding: '32px 40px',
            boxShadow: '0 8px 30px rgba(27,59,44,0.08)',
          }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className="flex items-start gap-3"
                style={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  padding: '16px',
                }}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <div className="text-sm" style={{ color: '#dc2626' }}>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#2b3d33' }}>
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: '#8a9a8e' }} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    padding: '10px 12px 10px 40px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e3eae0',
                    borderRadius: '12px',
                    color: '#12261c',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#2b3d33' }}>
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: '#8a9a8e' }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e3eae0',
                    borderRadius: '12px',
                    color: '#12261c',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{ width: 16, height: 16, accentColor: '#1b3b2c', borderRadius: '4px' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#4f5f54' }}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold transition-colors"
                  style={{ color: '#1b3b2c' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#244d3a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#1b3b2c')}
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ width: '100%' }}
              >
                {loading ? (
                  <span
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(18,38,28,0.3)', borderTopColor: '#12261c' }}
                  />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
