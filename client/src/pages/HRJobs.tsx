import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Edit3, Trash2, Power, AlertCircle, Sparkles, AlertTriangle } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  department: string;
  experienceLevel: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  createdAt: string;
  applicationCount: number;
}

export function HRJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      // In GET /jobs, HR can request all jobs. Since it populated by creator, we can get list.
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to fetch job postings.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    setActionId(jobId);
    setError('');
    // If active, toggle to paused. If draft/paused/closed, toggle to active.
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
      setJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, status: res.data.status } : j)));
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update job status.';
      setError(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this job posting? This action cannot be undone.'
      )
    ) {
      return;
    }
    setActionId(jobId);
    setError('');
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to delete job posting.';
      setError(msg);
    } finally {
      setActionId(null);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const config =
      {
        draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        closed: 'bg-red-500/10 text-red-400 border-red-500/20',
      }[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Job Postings <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Create, edit, delete and toggle status of jobs in your organization.
            </p>
          </div>
          <Link
            to="/hr/jobs/new"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Post new Job
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl p-8 backdrop-blur-xl">
            <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Jobs Found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              You haven&apos;t posted any jobs yet. Create a job listing to start receiving applications.
            </p>
            <Link
              to="/hr/jobs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              Create First Job
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl shadow-2xl">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Applicants
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">{job.title}</div>
                      <div className="text-xs text-slate-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {job.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {job.experienceLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {job.applicationCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(job._id, job.status)}
                        disabled={actionId === job._id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          job.status === 'active'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                        }`}
                        title={job.status === 'active' ? 'Pause job' : 'Activate job'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {job.status === 'active' ? 'Pause' : 'Activate'}
                      </button>

                      {/* Edit */}
                      <Link
                        to={`/hr/jobs/${job._id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(job._id)}
                        disabled={actionId === job._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
