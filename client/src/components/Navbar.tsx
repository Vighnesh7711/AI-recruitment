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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/60 border-b border-slate-900 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AuraRecruit
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Explore Careers
        </Link>

        {user ? (
          <>
            {user.role === 'hr' && (
              <>
                <Link
                  to="/hr/jobs"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Manage Jobs
                </Link>
                <Link
                  to="/hr/applications"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Applications
                </Link>
                <Link
                  to="/hr/company-setup"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Building className="w-4 h-4" />
                  Company Setup
                </Link>
                <Link
                  to="/hr/interviews"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
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
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  Browse Jobs
                </Link>
                <Link
                  to="/candidate/resume"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  My Resume
                </Link>
                <Link
                  to="/candidate/applications"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Applications
                </Link>
              </>
            )}

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                title="View profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/80 text-slate-200 transition-all"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-6 h-6 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-300">
                    {(profileName || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                  {profileName || user.email}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 border-l border-slate-700 pl-2">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
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
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
