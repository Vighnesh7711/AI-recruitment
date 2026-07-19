import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSessionUser, clearSession, api, resolveAssetUrl } from '../lib/api';
import { Briefcase, Building, LogOut, LayoutDashboard, FileText, FileSearch, Bot } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  onAuthChange: () => void;
}

export function Navbar({ onAuthChange }: NavbarProps) {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [profileName, setProfileName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Load lightweight profile info (name + picture) for navbar chip.
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
        <Link to="/" className="flex items-center group relative">
          {/* Logo Image (Stylized 'A') */}
          <img
            src="/logo.png"
            alt="AuraRecruit Logo"
            className="object-contain transition-transform duration-200 group-hover:scale-105"
            style={{
              height: '51px',
              transform: 'translate(8px, 0px)',
            }}
          />

          {/* Brand Text ('uraRecruit') */}
          <span
            className="font-extrabold tracking-tight"
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              color: '#ffffff',
              fontSize: '25px',
              marginLeft: '-2px',
              transform: 'translateY(4px)',
              display: 'inline-block',
            }}
          >
            uraRecruit
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
                  to="/hr/interviews"
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                >
                  <Bot className="w-4 h-4" />
                  Interviews
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
                  Company Profile
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
                  Jobs
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
                  <FileSearch className="w-4 h-4" />
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
                  <FileText className="w-4 h-4" />
                  My Applications
                </Link>
              </>
            )}

            {/* Notification Bell Icon */}
            <NotificationBell />

            <div
              className="flex items-center gap-3 pl-3"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Link
                to="/profile"
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{ textDecoration: 'none' }}
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={profileName || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '1.5px solid #c8f24c' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                  >
                    {(profileName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-bold leading-tight" style={{ color: '#ffffff' }}>
                    {profileName || user.email.split('@')[0]}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider leading-tight"
                    style={{ color: '#c8f24c' }}
                  >
                    {user.role} Account
                  </span>
                </div>
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
