import { useState, useEffect } from 'react';
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

export function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  useEffect(() => {
    fetchActiveJobs();
  }, [selectedDomain]);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      setError('');
      // Query parameters: ?domain=&status= (Candidates can only see active anyway)
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

  // Local search filter
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // Extract unique domains/departments for filter dropdown
  const uniqueDomains = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#12261c', minHeight: 'calc(100vh - 72px)' }}>
      {/* ── Hero Band ── */}
      <div
        style={{
          backgroundColor: '#1b3b2c',
          borderRadius: '0 0 32px 32px',
          padding: '96px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative floating badges */}
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '10%',
            backgroundColor: '#faf8f0',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            transform: 'rotate(3deg)',
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

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '8%',
            backgroundColor: '#faf8f0',
            borderRadius: '9999px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            transform: 'rotate(-2deg)',
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3 h-3" style={{ color: '#c8f24c', fill: '#c8f24c' }} />
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#12261c' }}>4.9 Rating</span>
        </div>

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
            className="text-display-xl"
            style={{
              color: '#ffffff',
              maxWidth: '720px',
              margin: '0 auto',
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
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '520px',
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
              <Search className="absolute left-3 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
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
                  padding: '10px 16px 10px 40px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            <div className="relative flex items-center">
              <Filter
                className="absolute left-3 w-4 h-4 pointer-events-none"
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
                  padding: '10px 16px 10px 36px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.75)',
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

      {/* ── Jobs List Band (light surface) ── */}
      <div className="max-w-5xl mx-auto px-6 pb-24" style={{ paddingTop: '64px' }}>
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
            <h2
              className="text-display-sm mb-4"
              style={{ color: '#12261c' }}
            >
              Latest openings ({filteredJobs.length})
            </h2>
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="group"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e3eae0',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c8f24c';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(27,59,44,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e3eae0';
                  e.currentTarget.style.boxShadow = 'none';
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
                        className="text-title-lg group-hover:text-brand-dark-green transition-colors"
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
                    <button className="btn-primary group/btn" style={{ fontSize: '14px', padding: '10px 20px', height: '40px' }}>
                      Apply Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
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
    </div>
  );
}
