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
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[400px] right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero section */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Empowering Career Growth
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 max-w-3xl mx-auto leading-tight">
          Find your next challenge in future recruitment
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto font-light">
          Explore opportunities from verified companies. AuraRecruit conducts smart interviews using
          talking avatars.
        </p>

        {/* Search & filter bars */}
        <div className="mt-12 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 p-2.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
          <div className="md:col-span-2 relative flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, skills, keywords..."
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
      </div>

      {/* Jobs list container */}
      <div className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-2xl">
            <p className="text-slate-400">No active job listings match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Latest Openings ({filteredJobs.length})
            </h2>
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="group p-6 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-900 hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Job and Company details */}
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

                  {/* Right side apply button */}
                  <div className="self-start md:self-center shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold hover:bg-white hover:text-slate-950 transition-all group/btn">
                      Apply Now
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-1 transition-transform group-hover:text-slate-950" />
                    </button>
                  </div>
                </div>

                {/* Job metadata badges */}
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

                {/* Skills section */}
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

                {/* Job description summary */}
                <p className="mt-4 text-sm text-slate-400 line-clamp-2 leading-relaxed">
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
