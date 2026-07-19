import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Filter,
  ArrowRight,
  Sparkles,
  Building,
  Star,
  Bot,
  FileSearch,
  Zap,
  CalendarCheck,
  ShieldCheck,
  Users,
  BarChart3,
  Clock,
  Play,
  GitPullRequest,
  Send,
  Workflow,
  CheckCircle,
  Globe,
} from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  department: string;
  experienceLevel: string;
  location: string;
  locationType: string;
  employmentType: string;
  salaryMax?: number;
  applicationDeadline?: string;
  description: string;
  skills: string[];
  companyId?: {
    name: string;
    logoUrl?: string;
    website?: string;
  };
}

interface PlatformStats {
  activeJobs: number;
  applicationsScreened: number;
  interviewsCompleted: number;
  avgShortlistSpeed: string;
}

export function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  // Platform stats state
  const [stats, setStats] = useState<PlatformStats>({
    activeJobs: 0,
    applicationsScreened: 0,
    interviewsCompleted: 0,
    avgShortlistSpeed: '< 2 mins',
  });

  // Interactive Demo Tab State
  const [activeTab, setActiveTab] = useState<'avatar' | 'parser'>('avatar');

  // Demo Tab (a) Avatar simulation state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    fetchActiveJobs();
    fetchStats();
  }, [selectedDomain]);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const url = selectedDomain ? `/jobs?domain=${selectedDomain}` : '/jobs';
      const res = await api.get(url);
      setJobs(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to fetch job opportunities.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/jobs/stats/public');
      if (res.data) {
        setStats(res.data);
      }
    } catch {
      // Non-critical fallback
    }
  };

  // Local search filter
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // Extract unique domains/departments for filter dropdown
  const uniqueDomains = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  const realJobCount = jobs.length > 0 ? jobs.length : (stats.activeJobs || 12);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#12261c', minHeight: 'calc(100vh - 72px)' }}>
      {/* ── 1. HERO BAND ── */}
      <div
        style={{
          backgroundColor: '#1b3b2c',
          borderRadius: '0 0 32px 32px',
          padding: '104px 24px 88px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Floating Element 1 (Top-Right Badge) */}
        <div
          className="hidden 2xl:flex"
          style={{
            position: 'absolute',
            top: '36px',
            right: '6%',
            backgroundColor: '#faf8f0',
            borderRadius: '20px',
            padding: '8px 16px',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            transform: 'rotate(3deg)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8f24c, #3fa34d)',
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#12261c' }}>AI-Powered</span>
        </div>

        {/* Floating Element 2 (Bottom-Left Badge) */}
        <div
          className="hidden 2xl:flex"
          style={{
            position: 'absolute',
            bottom: '44px',
            left: '5%',
            backgroundColor: '#faf8f0',
            borderRadius: '9999px',
            padding: '6px 14px',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            transform: 'rotate(-2deg)',
            zIndex: 10,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3 h-3" style={{ color: '#c8f24c', fill: '#c8f24c' }} />
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#12261c' }}>4.9 Rating</span>
        </div>

        {/* ── HIGH-CONTRAST Floating Card (Hero Left Side) ── */}
        <div
          className="hidden 2xl:flex flex-col gap-2 p-4 rounded-2xl border shadow-2xl transition-all hover:scale-105"
          style={{
            position: 'absolute',
            top: '24%',
            left: '2.5%',
            width: '240px',
            backgroundColor: '#ffffff',
            borderColor: '#1b3b2c',
            borderWidth: '2px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            transform: 'rotate(-3deg)',
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              Avatar Interview Live
            </span>
          </div>
          <p className="text-xs font-extrabold" style={{ color: '#12261c' }}>
            Full-Stack Engineering Role
          </p>
          <div
            className="flex items-center justify-between mt-1 pt-2 border-t text-[11px]"
            style={{ borderColor: '#e3eae0' }}
          >
            <span className="font-semibold" style={{ color: '#4f5f54' }}>Speech & Code Score</span>
            <span
              className="font-extrabold px-2 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: '#1b3b2c', color: '#c8f24c' }}
            >
              96% Match
            </span>
          </div>
        </div>

        {/* ── HIGH-CONTRAST Floating Card (Hero Right Side) ── */}
        <div
          className="hidden 2xl:flex flex-col gap-2 p-4 rounded-2xl border shadow-2xl transition-all hover:scale-105"
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '2.5%',
            width: '240px',
            backgroundColor: '#ffffff',
            borderColor: '#1b3b2c',
            borderWidth: '2px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            transform: 'rotate(3deg)',
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              ATS Resume Screened
            </span>
          </div>
          <p className="text-xs font-extrabold" style={{ color: '#12261c' }}>
            Alex Morgan • 8+ Yrs Exp
          </p>
          <div
            className="flex items-center justify-between mt-1 pt-2 border-t text-[11px]"
            style={{ borderColor: '#e3eae0' }}
          >
            <span className="font-semibold" style={{ color: '#4f5f54' }}>Cutoff Passed</span>
            <span
              className="font-extrabold px-2 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
            >
              Auto-Shortlisted
            </span>
          </div>
        </div>

        {/* Hero Center Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div
            className="text-label-uppercase inline-flex items-center gap-2 mb-6"
            style={{
              backgroundColor: 'rgba(200,242,76,0.12)',
              color: '#c8f24c',
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1px solid rgba(200,242,76,0.2)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Empowering career growth
          </div>

          {/* Headline */}
          <h1
            className="text-display-xl font-black"
            style={{
              color: '#ffffff',
              maxWidth: '740px',
              margin: '0 auto',
              fontSize: '52px',
              lineHeight: 1.08,
              letterSpacing: '-0.8px',
            }}
          >
            Find your next challenge in future recruitment
          </h1>

          {/* Sub-paragraph */}
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '540px',
              margin: '24px auto 0',
            }}
          >
            Explore opportunities from verified companies. AuraRecruit conducts smart interviews using
            talking avatars.
          </p>

          {/* Search & filter bars */}
          <div
            className="mt-12 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '10px',
            }}
          >
            <div className="md:col-span-2 relative flex items-center">
              <Search className="absolute left-3.5 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, skills, keywords..."
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '10px 16px 10px 42px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            <div className="relative flex items-center">
              <Filter
                className="absolute left-3.5 w-4 h-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '10px 16px 10px 38px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)',
                  outline: 'none',
                  appearance: 'none' as const,
                  cursor: 'pointer',
                }}
              >
                <option value="">All Domains</option>
                {uniqueDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. JOBS LIST BAND ── */}
      <div id="openings" className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        {/* Standardized Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#eef8df', color: '#1b3b2c', border: '1px solid #cddcc9' }}
          >
            <Briefcase className="w-3.5 h-3.5" /> Current Opportunities
          </span>
          <h2
            className="text-display-md font-black mt-3 mb-3"
            style={{ color: '#12261c', fontSize: '36px', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Latest openings ({filteredJobs.length})
          </h2>
          <p className="text-sm font-medium" style={{ color: '#4f5f54', maxWidth: '540px', margin: '0 auto' }}>
            Explore verified career positions with direct AI Avatar screening & instant cutoff evaluation.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: '4px solid #e3eae0',
                borderTopColor: '#1b3b2c',
              }}
            />
          </div>
        ) : error ? (
          <div
            className="text-center py-12"
            style={{
              borderRadius: '20px',
              backgroundColor: 'rgba(244,161,58,0.08)',
              border: '1px solid rgba(244,161,58,0.2)',
              color: '#f4a13a',
            }}
          >
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              backgroundColor: '#eef8df',
              border: '1px solid #cddcc9',
              borderRadius: '20px',
              color: '#4f5f54',
            }}
          >
            <p>No active job listings match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="group transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-xl"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e3eae0',
                  boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Job and Company details */}
                  <div className="flex gap-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center p-2 shrink-0 transition-all"
                      style={{
                        borderRadius: '12px',
                        backgroundColor: '#eef8df',
                        border: '1px solid #cddcc9',
                      }}
                    >
                      {job.companyId?.logoUrl ? (
                        <img
                          src={job.companyId.logoUrl}
                          alt={`${job.companyId.name} logo`}
                          className="max-w-full max-h-full object-contain"
                          style={{ borderRadius: '6px' }}
                        />
                      ) : (
                        <Building className="w-6 h-6" style={{ color: '#1b3b2c' }} />
                      )}
                    </div>
                    <div>
                      <h3
                        className="text-title-lg font-bold group-hover:text-brand-dark-green transition-colors"
                        style={{ color: '#12261c' }}
                      >
                        {job.title}
                      </h3>
                      <p
                        className="flex items-center gap-1.5 mt-1"
                        style={{ fontSize: '14px', color: '#4f5f54' }}
                      >
                        {job.companyId?.name || 'AuraRecruit Client'}
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: '#cddcc9' }}
                        />
                        <span
                          className="text-label-uppercase"
                          style={{ color: '#1b3b2c', fontSize: '11px' }}
                        >
                          {job.department}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right side apply button */}
                  <div className="self-start md:self-center shrink-0">
                    <Link
                      to="/register?role=candidate"
                      className="btn-primary group/btn"
                      style={{
                        fontSize: '14px',
                        padding: '10px 20px',
                        height: '40px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Apply Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Job metadata badges */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6"
                  style={{ borderTop: '1px solid #e3eae0' }}
                >
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4f5f54' }}>
                    <MapPin className="w-4 h-4" style={{ color: '#8a9a8e' }} />
                    <span>
                      {job.location}
                      {job.locationType ? ` (${job.locationType})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4f5f54' }}>
                    <Briefcase className="w-4 h-4" style={{ color: '#8a9a8e' }} />
                    <span className="capitalize">
                      {job.employmentType}
                      {job.experienceLevel ? ` (${job.experienceLevel})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4f5f54' }}>
                    <DollarSign className="w-4 h-4" style={{ color: '#8a9a8e' }} />
                    <span>
                      {job.salaryMax ? `$${job.salaryMax.toLocaleString()}/yr` : 'Competitive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#4f5f54' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#8a9a8e' }} />
                    <span>
                      Deadline:{' '}
                      {job.applicationDeadline
                        ? new Date(job.applicationDeadline).toLocaleDateString()
                        : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Skills section */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#eef8df',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#2b3d33',
                        border: '1px solid #cddcc9',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Job description summary */}
                <p
                  className="mt-4 line-clamp-2"
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.55,
                    color: '#4f5f54',
                  }}
                >
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. STATS ROW ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        {/* Standardized Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#eef8df', color: '#1b3b2c', border: '1px solid #cddcc9' }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Real-Time Analytics
          </span>
          <h2
            className="text-display-md font-black mt-3 mb-3"
            style={{ color: '#12261c', fontSize: '36px', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Platform Impact & Metrics
          </h2>
          <p className="text-sm font-medium" style={{ color: '#4f5f54', maxWidth: '540px', margin: '0 auto' }}>
            Data-backed speed and screening metrics powering modern hiring workflows.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:border-lime-400 hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e3eae0',
              boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black" style={{ color: '#12261c' }}>
              {realJobCount}+
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: '#4f5f54' }}>
              Active Jobs Posted
            </p>
          </div>

          <div
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:border-lime-400 hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e3eae0',
              boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              <FileSearch className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black" style={{ color: '#12261c' }}>
              {stats.applicationsScreened || 85}+
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: '#4f5f54' }}>
              Resumes ATS Screened
            </p>
          </div>

          <div
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:border-lime-400 hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e3eae0',
              boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black" style={{ color: '#12261c' }}>
              {stats.interviewsCompleted || 42}+
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: '#4f5f54' }}>
              AI Avatar Interviews
            </p>
          </div>

          <div
            className="p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:border-lime-400 hover:shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e3eae0',
              boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black" style={{ color: '#12261c' }}>
              {stats.avgShortlistSpeed}
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: '#4f5f54' }}>
              Avg. Shortlist Time
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. INTERACTIVE DEMO TABS (BROWSER CHROME FRAME) ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        {/* Standardized Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span
            className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#eef8df', color: '#1b3b2c', border: '1px solid #cddcc9' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Product Experience
          </span>
          <h2
            className="text-display-md font-black mt-3 mb-3"
            style={{ color: '#12261c', fontSize: '36px', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Experience the Core AI Engines
          </h2>
          <p className="text-sm font-medium" style={{ color: '#4f5f54', maxWidth: '540px', margin: '0 auto' }}>
            Interact with candidate evaluation engines below to see how AI avatars score speech & skills in real-time.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div
          className="flex justify-center gap-2 p-1.5 rounded-2xl max-w-md mx-auto mb-8"
          style={{ backgroundColor: '#f4f8f3', border: '1px solid #e3eae0' }}
        >
          <button
            onClick={() => setActiveTab('avatar')}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: activeTab === 'avatar' ? '#1b3b2c' : 'transparent',
              color: activeTab === 'avatar' ? '#c8f24c' : '#4f5f54',
            }}
          >
            <Bot className="w-4 h-4" />
            AI Avatar Interview
          </button>
          <button
            onClick={() => setActiveTab('parser')}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: activeTab === 'parser' ? '#1b3b2c' : 'transparent',
              color: activeTab === 'parser' ? '#c8f24c' : '#4f5f54',
            }}
          >
            <FileSearch className="w-4 h-4" />
            Resume ATS Parser
          </button>
        </div>

        {/* ── Sleek Browser Chrome Frame ── */}
        <div
          className="rounded-3xl border shadow-xl overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderColor: '#e3eae0' }}
        >
          {/* Browser Window Header */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b"
            style={{ backgroundColor: '#f4f8f3', borderColor: '#e3eae0' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#cddcc9' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#cddcc9' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#cddcc9' }} />
            </div>

            {/* URL Pill */}
            <div
              className="flex items-center gap-2 px-4 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e3eae0',
                color: '#4f5f54',
              }}
            >
              <Globe className="w-3 h-3" style={{ color: '#8a9a8e' }} />
              <span>https://app.aurarecruit.ai/demo</span>
            </div>

            <span
              className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md hidden sm:inline-block"
              style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
            >
              Live Preview
            </span>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 sm:p-8">
            {/* TAB (a): AI Avatar Interview */}
            {activeTab === 'avatar' && (
              <div className="space-y-6">
                <div
                  className="flex items-center justify-between border-b pb-4"
                  style={{ borderColor: '#e3eae0' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: '#1b3b2c', color: '#c8f24c' }}
                    >
                      AI
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: '#12261c' }}>
                        Aura AI Interviewer (Talking Avatar)
                      </h4>
                      <p className="text-xs" style={{ color: '#4f5f54' }}>
                        Evaluating technical reasoning & communication skills
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
                  >
                    <Play className="w-3 h-3 fill-current" /> Live Simulation
                  </span>
                </div>

                {/* Sample Question Box */}
                <div
                  className="p-5 rounded-2xl border"
                  style={{ backgroundColor: '#fafbf9', borderColor: '#e3eae0' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Question #3 of 5 • Distributed Systems
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#12261c' }}>
                    "How do you handle unexpected microservice traffic spikes while maintaining
                    database read replica consistency?"
                  </p>
                </div>

                {/* Simulated Answer Options */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold" style={{ color: '#4f5f54' }}>
                    Select a simulated response to see real-time AI scoring:
                  </p>
                  {[
                    {
                      id: 0,
                      text: 'Implement horizontal autoscaling with Redis caching and asynchronous message queues for traffic decoupling.',
                      score: 94,
                      feedback: 'Excellent response! Strong understanding of queue decoupling & caching.',
                    },
                    {
                      id: 1,
                      text: 'Increase connection pool size on the primary DB and set strict connection timeout limits.',
                      score: 78,
                      feedback: 'Good approach for pool limits, but lacks traffic smoothing buffers.',
                    },
                    {
                      id: 2,
                      text: 'Add manual retry loops on the client side until database read replica latency resolves.',
                      score: 62,
                      feedback: 'Client retry loops can worsen cascading thundering herd failures.',
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedAnswer(option.id)}
                      className="w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start justify-between gap-4"
                      style={{
                        backgroundColor: selectedAnswer === option.id ? '#eef8df' : '#ffffff',
                        borderColor: selectedAnswer === option.id ? '#1b3b2c' : '#e3eae0',
                        color: selectedAnswer === option.id ? '#1b3b2c' : '#4f5f54',
                      }}
                    >
                      <span>{option.text}</span>
                      {selectedAnswer === option.id && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0"
                          style={{ backgroundColor: '#1b3b2c', color: '#c8f24c' }}
                        >
                          AI Score: {option.score}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* AI Evaluation Scorecard Output */}
                {selectedAnswer !== null && (
                  <div
                    className="p-4 rounded-2xl border animate-in fade-in duration-300"
                    style={{ backgroundColor: '#1b3b2c', borderColor: '#1b3b2c', color: '#ffffff' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> AI Avatar Score Breakdown
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        Recommendation: STRONG HIRE
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                      <div className="p-2 rounded-xl bg-white/10">
                        <p className="text-[10px] text-slate-300">Technical</p>
                        <p className="font-extrabold text-lime-400 text-sm">95%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10">
                        <p className="text-[10px] text-slate-300">Communication</p>
                        <p className="font-extrabold text-lime-400 text-sm">92%</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/10">
                        <p className="text-[10px] text-slate-300">Problem Solving</p>
                        <p className="font-extrabold text-lime-400 text-sm">94%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB (b): Resume ATS Parser */}
            {activeTab === 'parser' && (
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between border-b pb-4"
                  style={{ borderColor: '#e3eae0' }}
                >
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#12261c' }}>ATS Resume Screening Engine</h4>
                    <p className="text-xs" style={{ color: '#4f5f54' }}>
                      Automated match scoring against job requirements
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#eef8df', color: '#1b3b2c' }}
                  >
                    Cutoff Threshold: 60%
                  </span>
                </div>

                {/* Sample Candidates List */}
                {[
                  {
                    name: 'Alex Morgan',
                    role: 'Senior Full-Stack Engineer',
                    score: 94,
                    skills: ['React', 'TypeScript', 'Node.js', 'Docker'],
                    match: 'High Match',
                  },
                  {
                    name: 'Priya Sharma',
                    role: 'AI/ML Pipeline Lead',
                    score: 88,
                    skills: ['Python', 'FastAPI', 'PyTorch', 'Gemini AI'],
                    match: 'Strong Match',
                  },
                  {
                    name: 'Marcus Vance',
                    role: 'Cloud Infrastructure Dev',
                    score: 82,
                    skills: ['Go', 'MongoDB', 'Redis', 'Kubernetes'],
                    match: 'Good Match',
                  },
                ].map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-lime-500"
                    style={{ backgroundColor: '#fafbf9', borderColor: '#e3eae0' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: '#1b3b2c', color: '#ffffff' }}
                      >
                        {cand.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold" style={{ color: '#12261c' }}>{cand.name}</h5>
                        <p className="text-xs" style={{ color: '#4f5f54' }}>{cand.role}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cand.skills.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                backgroundColor: '#eef8df',
                                color: '#1b3b2c',
                                border: '1px solid #cddcc9',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-bold block" style={{ color: '#4f5f54' }}>ATS Score</span>
                        <span
                          className="text-lg font-black"
                          style={{ color: '#1b3b2c' }}
                        >
                          {cand.score}%
                        </span>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-extrabold"
                        style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                      >
                        {cand.match}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. FEATURE GRID (6 CARDS) ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        {/* Standardized Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#eef8df', color: '#1b3b2c', border: '1px solid #cddcc9' }}
          >
            <Zap className="w-3.5 h-3.5" /> Capabilities
          </span>
          <h2
            className="text-display-md font-black mt-3 mb-3"
            style={{ color: '#12261c', fontSize: '36px', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Built for High-Velocity Teams
          </h2>
          <p className="text-sm font-medium" style={{ color: '#4f5f54', maxWidth: '540px', margin: '0 auto' }}>
            Everything required to automate candidate evaluation and eliminate hiring bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Bot,
              title: 'AI Avatar Interviews',
              desc: 'Interactive voice and video avatars conduct 1-on-1 interviews with dynamic technical follow-ups.',
            },
            {
              icon: FileSearch,
              title: 'ATS Resume Parser',
              desc: 'Automated PDF resume extraction scoring skills and experience against customizable cutoffs.',
            },
            {
              icon: BarChart3,
              title: 'Dual-Sided Transparency',
              desc: 'Comprehensive score breakdown for candidates paired with HR candidate radar metrics.',
            },
            {
              icon: GitPullRequest,
              title: 'n8n Workflow Automation',
              desc: 'Automated email offer generation, rejection triggers, and real-time Google Sheets sync.',
            },
            {
              icon: CalendarCheck,
              title: 'Auto-Scheduling Pipeline',
              desc: 'Smart calendar management issuing instant candidate interview links and automated reminders.',
            },
            {
              icon: ShieldCheck,
              title: 'Enterprise Security',
              desc: 'JWT authentication, bcrypt password hashing, and role-based access control (RBAC).',
            },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-xl group"
                style={{
                  borderColor: '#e3eae0',
                  boxShadow: '0 4px 20px rgba(27,59,44,0.03)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                >
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-title-md font-extrabold mb-2" style={{ color: '#12261c' }}>
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#4f5f54' }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. HIGH-CONTRAST VISUAL BLOCK DIAGRAM ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        {/* Standardized Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#eef8df', color: '#1b3b2c', border: '1px solid #cddcc9' }}
          >
            <Workflow className="w-3.5 h-3.5" /> System Architecture Flow
          </span>
          <h2
            className="text-display-md font-black mt-3 mb-3"
            style={{ color: '#12261c', fontSize: '36px', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            Autonomous Recruitment Block Diagram
          </h2>
          <p className="text-sm font-medium" style={{ color: '#4f5f54', maxWidth: '540px', margin: '0 auto' }}>
            Visual event flow connecting candidate inputs, AI engines, and automated webhooks.
          </p>
        </div>

        {/* Outer Mint Shell Container */}
        <div
          className="p-6 sm:p-10 rounded-3xl border shadow-lg"
          style={{ backgroundColor: '#f4f8f3', borderColor: '#e3eae0' }}
        >
          {/* Header Row inside Diagram */}
          <div
            className="flex items-center justify-between mb-8 border-b pb-4"
            style={{ borderColor: '#e3eae0' }}
          >
            <div className="flex items-center gap-2.5">
              <Workflow className="w-5 h-5" style={{ color: '#1b3b2c' }} />
              <span className="text-sm sm:text-base font-extrabold" style={{ color: '#12261c' }}>
                Live Architecture Diagram
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5"
              style={{ backgroundColor: '#1b3b2c', color: '#c8f24c' }}
            >
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Active n8n Pipeline
            </span>
          </div>

          {/* 4 White Block Cards with Equal Spacing & Responsive Stacking */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative">
            {/* Block 1 */}
            <div
              className="flex-1 w-full p-5 rounded-2xl border bg-white flex flex-col justify-between min-h-[185px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-md"
              style={{ borderColor: '#1b3b2c', borderWidth: '1.5px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-7 h-7 rounded-full font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                  >
                    1
                  </span>
                  <FileSearch className="w-5 h-5" style={{ color: '#1b3b2c' }} />
                </div>
                <h4 className="text-sm font-extrabold mb-1" style={{ color: '#12261c' }}>
                  Resume ATS Parser
                </h4>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#4f5f54' }}>
                  PDF Extraction & Skill Cutoff Scoring
                </p>
              </div>
              <div
                className="mt-4 pt-2 border-t text-[10px] font-extrabold uppercase tracking-wider"
                style={{ borderColor: '#e3eae0', color: '#1b3b2c' }}
              >
                STAGE: SCREENING
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="shrink-0 flex items-center justify-center py-2 lg:py-0">
              <div className="hidden lg:flex items-center gap-1">
                <div className="w-5 h-1 rounded" style={{ backgroundColor: '#1b3b2c' }} />
                <ArrowRight className="w-5 h-5" style={{ color: '#1b3b2c' }} />
              </div>
              <div className="lg:hidden">
                <ArrowRight className="w-5 h-5 rotate-90" style={{ color: '#1b3b2c' }} />
              </div>
            </div>

            {/* Block 2 */}
            <div
              className="flex-1 w-full p-5 rounded-2xl border bg-white flex flex-col justify-between min-h-[185px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-md"
              style={{ borderColor: '#1b3b2c', borderWidth: '1.5px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-7 h-7 rounded-full font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                  >
                    2
                  </span>
                  <Bot className="w-5 h-5" style={{ color: '#1b3b2c' }} />
                </div>
                <h4 className="text-sm font-extrabold mb-1" style={{ color: '#12261c' }}>
                  AI Avatar Interview
                </h4>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#4f5f54' }}>
                  Speech & Q&A Transcript Evaluation
                </p>
              </div>
              <div
                className="mt-4 pt-2 border-t text-[10px] font-extrabold uppercase tracking-wider"
                style={{ borderColor: '#e3eae0', color: '#1b3b2c' }}
              >
                STAGE: INTERVIEWING
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="shrink-0 flex items-center justify-center py-2 lg:py-0">
              <div className="hidden lg:flex items-center gap-1">
                <div className="w-5 h-1 rounded" style={{ backgroundColor: '#1b3b2c' }} />
                <ArrowRight className="w-5 h-5" style={{ color: '#1b3b2c' }} />
              </div>
              <div className="lg:hidden">
                <ArrowRight className="w-5 h-5 rotate-90" style={{ color: '#1b3b2c' }} />
              </div>
            </div>

            {/* Block 3 */}
            <div
              className="flex-1 w-full p-5 rounded-2xl border bg-white flex flex-col justify-between min-h-[185px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-md"
              style={{ borderColor: '#1b3b2c', borderWidth: '1.5px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-7 h-7 rounded-full font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                  >
                    3
                  </span>
                  <GitPullRequest className="w-5 h-5" style={{ color: '#1b3b2c' }} />
                </div>
                <h4 className="text-sm font-extrabold mb-1" style={{ color: '#12261c' }}>
                  n8n Workflow Broker
                </h4>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#4f5f54' }}>
                  Event-Driven Rules & Webhook Routing
                </p>
              </div>
              <div
                className="mt-4 pt-2 border-t text-[10px] font-extrabold uppercase tracking-wider"
                style={{ borderColor: '#e3eae0', color: '#1b3b2c' }}
              >
                STAGE: AUTOMATION
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="shrink-0 flex items-center justify-center py-2 lg:py-0">
              <div className="hidden lg:flex items-center gap-1">
                <div className="w-5 h-1 rounded" style={{ backgroundColor: '#1b3b2c' }} />
                <ArrowRight className="w-5 h-5" style={{ color: '#1b3b2c' }} />
              </div>
              <div className="lg:hidden">
                <ArrowRight className="w-5 h-5 rotate-90" style={{ color: '#1b3b2c' }} />
              </div>
            </div>

            {/* Block 4 */}
            <div
              className="flex-1 w-full p-5 rounded-2xl border bg-white flex flex-col justify-between min-h-[185px] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-lime-500 hover:shadow-md"
              style={{ borderColor: '#1b3b2c', borderWidth: '1.5px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-7 h-7 rounded-full font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#c8f24c', color: '#12261c' }}
                  >
                    4
                  </span>
                  <Send className="w-5 h-5" style={{ color: '#1b3b2c' }} />
                </div>
                <h4 className="text-sm font-extrabold mb-1" style={{ color: '#12261c' }}>
                  Multi-Channel Sync
                </h4>
                <p className="text-xs leading-relaxed font-medium" style={{ color: '#4f5f54' }}>
                  In-App Alerts, Offer Email & Sheets Mirror
                </p>
              </div>
              <div
                className="mt-4 pt-2 border-t text-[10px] font-extrabold uppercase tracking-wider"
                style={{ borderColor: '#e3eae0', color: '#1b3b2c' }}
              >
                STAGE: OUTCOME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. FINAL CTA BAND ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        <div
          className="p-10 sm:p-14 rounded-3xl text-center relative overflow-hidden"
          style={{ backgroundColor: '#1b3b2c' }}
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <span
              className="text-label-uppercase inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{
                backgroundColor: 'rgba(200,242,76,0.15)',
                color: '#c8f24c',
                border: '1px solid rgba(200,242,76,0.3)',
              }}
            >
              <Users className="w-3.5 h-3.5" /> Join AuraRecruit
            </span>

            {/* Explicit White Title */}
            <h2
              className="text-display-md font-black mb-3"
              style={{ color: '#ffffff', fontSize: '32px', lineHeight: 1.25 }}
            >
              Ready to transform your recruitment pipeline?
            </h2>

            {/* Explicit Light Subtitle */}
            <p
              className="text-sm mb-8 max-w-xl mx-auto leading-relaxed font-medium"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Accelerate candidate screening with talking AI avatars, instant ATS resume scoring,
              and automated decision workflows.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register?role=hr"
                className="btn-accent w-full sm:w-auto"
                style={{
                  fontSize: '15px',
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                Post a Job <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#openings"
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold transition-all text-white border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Explore Careers
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
