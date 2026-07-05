import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Filter,
  ArrowRight,
  Building,
  Sparkles,
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

export function CandidateJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveJobs();
  }, [selectedDomain]);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      setError('');
      // Candidate route: GET /jobs (only shows status: 'active')
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

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const uniqueDomains = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white relative overflow-hidden py-12 px-6 lg:px-8">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            Explore Open Positions <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Find opportunities matching your skills and background. Select a job to view details and
            apply.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2.5 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl mb-8">
          <div className="md:col-span-2 relative flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or skills..."
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
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

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-2xl">
            <p className="text-slate-400">No active job listings found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                onClick={() => navigate(`/candidate/jobs/${job._id}`)}
                className="group p-6 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-900 hover:border-indigo-500/30 transition-all duration-300 shadow-xl cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 group-hover:border-indigo-500/20 transition-all shrink-0">
                      {job.companyId?.logoUrl ? (
                        <img
                          src={job.companyId.logoUrl}
                          alt={`${job.companyId.name} logo`}
                          className="max-w-full max-h-full object-contain rounded-md"
                        />
                      ) : (
                        <Building className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                        {job.companyId?.name || 'AuraRecruit Client'}
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-indigo-400 text-xs font-semibold uppercase">
                          {job.department}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="self-start md:self-center shrink-0">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold group-hover:bg-white group-hover:text-slate-950 transition-all">
                      View details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Job metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-900/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>
                      {job.location} ({job.locationType})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Briefcase className="w-4 h-4 text-slate-600" />
                    <span className="capitalize">
                      {job.employmentType} ({job.experienceLevel})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span>
                      {job.salaryMax ? `$${job.salaryMax.toLocaleString()}/yr` : 'Competitive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>
                      Deadline:{' '}
                      {job.applicationDeadline
                        ? new Date(job.applicationDeadline).toLocaleDateString()
                        : 'Open'}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-[11px] font-medium text-slate-400 border border-slate-900"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
