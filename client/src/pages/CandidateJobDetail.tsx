import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
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
    industry?: string;
  };
}

interface Resume {
  _id: string;
  resumeUrl: string;
  uploadDate: string;
}

export function CandidateJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        // Load job details
        const jobRes = await api.get(`/jobs/${id}`);
        setJob(jobRes.data);

        // Check resumes
        const resumesRes = await api.get('/resume/mine');
        setResumes(resumesRes.data);
        if (resumesRes.data.length > 0) {
          setSelectedResumeId(resumesRes.data[0]._id);
        }

        // Check if candidate already applied by listing my applications.
        // A rejected application does not block reapplying, so treat it as
        // not-yet-applied and show the Apply UI again.
        const appsRes = await api.get('/application/mine');
        const existingApp = appsRes.data.find((app: any) => app.jobId?._id === id);
        setAlreadyApplied(!!existingApp && existingApp.status !== 'rejected');
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Failed to load details.';
        setMessage({ type: 'error', text: msg });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleApply = async () => {
    if (!id || !selectedResumeId) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/application', {
        jobId: id,
        resumeId: selectedResumeId,
      });

      setAlreadyApplied(true);
      setMessage({
        type: 'success',
        text: 'Application submitted successfully! Tracking status...',
      });
      setTimeout(() => {
        navigate('/candidate/applications');
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to submit application.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 flex flex-col items-center justify-center py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Job Listing Not Found</h2>
        <Link to="/candidate/jobs" className="text-indigo-400 hover:underline">
          Back to Job Listings
        </Link>
      </div>
    );
  }

  const noResumes = resumes.length === 0;

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/candidate/jobs')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors border border-slate-800 bg-slate-950/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>
        </div>

        {message.text && (
          <div
            className={`rounded-lg border p-4 flex items-start gap-3 mb-6 ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-200'
                : 'bg-red-500/10 border-red-500/20 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">{message.text}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="flex gap-4 items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2.5 shrink-0">
                  {job.companyId?.logoUrl ? (
                    <img
                      src={job.companyId.logoUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain rounded-md"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                  <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
                    {job.companyId?.name || 'AuraRecruit Client'}
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-indigo-400 uppercase tracking-wider text-xs">
                      {job.department}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-slate-900/80 py-4 mb-6">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <MapPin className="w-4.5 h-4.5 text-slate-650" />
                  <span>
                    {job.location} ({job.locationType})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Briefcase className="w-4.5 h-4.5 text-slate-650" />
                  <span className="capitalize">
                    {job.employmentType} ({job.experienceLevel})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <DollarSign className="w-4.5 h-4.5 text-slate-650" />
                  <span>
                    {job.salaryMax ? `$${job.salaryMax.toLocaleString()}/yr` : 'Competitive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Calendar className="w-4.5 h-4.5 text-slate-650" />
                  <span>
                    Deadline:{' '}
                    {job.applicationDeadline
                      ? new Date(job.applicationDeadline).toLocaleDateString()
                      : 'Open'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-3">Job Description</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl bg-slate-950 text-xs font-semibold text-slate-400 border border-slate-900"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Application Panel</h3>

              {alreadyApplied ? (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white text-sm">Application Submitted</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    You have already applied to this opening.
                  </p>
                  <Link
                    to="/candidate/applications"
                    className="inline-block mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Track Application Status
                  </Link>
                </div>
              ) : noResumes ? (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
                  <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-white text-sm">No Resume Found</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    You must upload a resume before you can apply to job listings.
                  </p>
                  <Link
                    to="/candidate/resume"
                    className="mt-4 w-full flex justify-center py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs transition-colors shadow"
                  >
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      SELECT RESUME
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          Uploaded {new Date(r.uploadDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="w-full flex justify-center items-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Apply for Job
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
