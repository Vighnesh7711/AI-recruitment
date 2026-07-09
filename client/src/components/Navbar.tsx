import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSessionUser, clearSession, api, resolveAssetUrl } from '../lib/api';
import { Briefcase, Building, LogOut, LayoutDashboard, FileText } from 'lucide-react';

interface NavbarProps {
  onAuthChange: () => void;
}

export function Navbar({ onAuthChange }: NavbarProps) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [profileName, setProfileName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Load lightweight profile info (name + picture) for the navbar chip.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfileName('');
      setProfilePicture('');
      return;
    }
    api
      .get('/profile/me')
      .then((res) => {
        if (cancelled) return;
        setProfileName(res.data?.name || '');
        setProfilePicture(resolveAssetUrl(res.data?.profilePicture));
      })
      .catch(() => {
        /* non-critical — fall back to role label */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleLogout = () => {
    clearSession();
    onAuthChange();
    navigate('/');
  };

  return (
    <nav
      className="sticky top-0 z-50 px-6 flex items-center justify-between"
      style={{
        backgroundColor: '#1b3b2c',
        height: '72px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: '#c8f24c',
              borderRadius: '12px',
            }}
          >
            <Briefcase className="w-5 h-5" style={{ color: '#12261c' }} />
          </div>
          <span
            className="text-xl font-extrabold tracking-tight"
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              color: '#ffffff',
            }}
          >
            AuraRecruit
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <Link
          to="/"
          className="text-[15px] font-medium transition-colors"
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: 'rgba(255,255,255,0.75)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        >
          Explore Careers
        </Link>

        {user ? (
          <>
            {user.role === 'hr' && (
              <>
                <Link
                  to="/hr/jobs"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Manage Jobs
                </Link>
                <Link
                  to="/hr/applications"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <FileText className="w-4 h-4" />
                  Applications
                </Link>
                <Link
                  to="/hr/company-setup"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <Building className="w-4 h-4" />
                  Company Setup
                </Link>
                <Link
                  to="/hr/interviews"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <Briefcase className="w-4 h-4" />
                  Interviews
                </Link>
              </>
            )}

            {user.role === 'candidate' && (
              <>
                <Link
                  to="/candidate/jobs"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <Briefcase className="w-4 h-4" />
                  Browse Jobs
                </Link>
                <Link
                  to="/candidate/resume"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <FileText className="w-4 h-4" />
                  My Resume
                </Link>
                <Link
                  to="/candidate/applications"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Applications
                </Link>
              </>
            )}

            <div className="h-5 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                title="View profile"
                className="flex items-center gap-2 px-3 py-1.5 transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '9999px',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.borderColor = 'rgba(200,242,76,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover"
                    style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
                  />
                ) : (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{
                      backgroundColor: 'rgba(200,242,76,0.2)',
                      border: '1.5px solid rgba(200,242,76,0.3)',
                      color: '#c8f24c',
                    }}
                  >
                    {(profileName || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-semibold max-w-[120px] truncate" style={{ color: '#ffffff' }}>
                  {profileName || user.email}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider pl-2"
                  style={{
                    color: '#c8f24c',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
                style={{
                  borderRadius: '9999px',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-[15px] font-medium transition-colors"
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: 'rgba(255,255,255,0.75)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-accent"
              style={{ textDecoration: 'none' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
