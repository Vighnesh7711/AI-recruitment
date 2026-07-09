import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, resolveAssetUrl } from '../lib/api';
import {
  Briefcase,
  MapPin,
  Building,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Video,
  RotateCcw,
  Ban,
  AlertTriangle,
  UserSquare2,
  Mail,
} from 'lucide-react';

interface RecruiterProfile {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  profilePicture?: string;
  company?: { _id: string; companyName: string; logo?: string } | null;
}

interface ApplicationItem {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
    location: string;
    companyId?: {
      name: string;
      logoUrl?: string;
    };
  };
  status:
    | 'applied'
    | 'submitted'
    | 'under_review'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offered'
    | 'hired'
    | 'rejected'
    | 'withdrawn';
  createdAt: string;
}

export function CandidateApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviewMap, setInterviewMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Recruiter profile modal
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [loadingRecruiter, setLoadingRecruiter] = useState(false);

  const viewRecruiter = async (applicationId: string) => {
    setLoadingRecruiter(true);
    setRecruiter(null);
    try {
      const res = await api.get(`/profile/hr/by-application/${applicationId}`);
      setRecruiter(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load recruiter details.');
      setLoadingRecruiter(false);
    } finally {
      setLoadingRecruiter(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCancel = async (appId: string) => {
    try {
      setCancelingId(appId);
      setError('');
      await api.delete(`/application/${appId}`);
      setConfirmCancelId(null);
      await fetchApplications();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to cancel application.';
      setError(msg);
    } finally {
      setCancelingId(null);
    }
  };

  // Cancel is only possible before the outcome is final.
  const canCancel = (status: string) => !['selected', 'hired', 'rejected'].includes(status);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/application/mine');
      setApplications(res.data);

      // Fetch interviews for interview_scheduled applications
      try {
        const interviewRes = await api.get('/interview');
        const iMap: Record<string, string> = {};
        for (const iv of interviewRes.data) {
          iMap[iv.applicationId] = iv._id;
        }
        setInterviewMap(iMap);
      } catch {
        // Non-critical
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to fetch applications.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine the active step index based on the application status
  const getActiveStep = (status: string) => {
    if (status === 'rejected') return { step: 2, isRejected: true };
    if (status === 'applied' || status === 'submitted') return { step: 0, isRejected: false };
    if (status === 'under_review') return { step: 1, isRejected: false };
    if (status === 'shortlisted') return { step: 2, isRejected: false };
    if (status === 'interview_scheduled' || status === 'interviewed')
      return { step: 3, isRejected: false };
    if (status === 'offered' || status === 'hired') return { step: 4, isRejected: false };
    return { step: 0, isRejected: false }; // fallback
  };

  const stepsList = ['Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Selected'];

  const renderStepper = (status: string) => {
    const { step, isRejected } = getActiveStep(status);

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          {/* Connector Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-10" />
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 transition-all duration-500 -z-10 ${
              isRejected ? 'bg-red-500/50' : 'bg-indigo-500'
            }`}
            style={{ width: `${(Math.min(step, isRejected ? 2 : 4) / 4) * 100}%` }}
          />

          {stepsList.map((label, idx) => {
            const isCompleted = idx < step;
            const isActive = idx === step;

            let circleClass = 'bg-slate-950 border-slate-800 text-slate-500';
            if (isCompleted) {
              circleClass =
                isRejected && idx >= 2
                  ? 'bg-red-950 border-red-500 text-red-400'
                  : 'bg-indigo-600 border-indigo-500 text-white';
            } else if (isActive) {
              circleClass = isRejected
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : 'bg-indigo-500 border-indigo-400 text-white animate-pulse';
            }

            return (
              <div key={label} className="flex flex-col items-center gap-1.5 relative">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${circleClass}`}
                >
                  {isRejected && isActive && idx === 2 ? (
                    <XCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide uppercase ${
                    isActive
                      ? isRejected
                        ? 'text-red-400'
                        : 'text-indigo-400'
                      : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                  }`}
                >
                  {isRejected && isActive && idx === 2 ? 'Rejected' : label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            My Applications <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Track status updates for your submitted applications in real-time.
          </p>
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
        ) : applications.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-2xl p-8">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Applications</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
              You haven&apos;t applied to any job postings yet. Find open positions on the job
              board.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app._id}
                className="p-6 rounded-2xl bg-slate-900/30 backdrop-blur-xl border border-slate-900 hover:border-slate-800 transition-colors shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/80 pb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2 shrink-0">
                      {app.jobId?.companyId?.logoUrl ? (
                        <img
                          src={app.jobId.companyId.logoUrl}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain rounded-md"
                        />
                      ) : (
                        <Building className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {app.jobId?.title || 'Unknown Job'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                        {app.jobId?.companyId?.name || 'AuraRecruit Client'}
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-600" />
                          {app.jobId?.location || 'Remote'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Applied on{' '}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => viewRecruiter(app._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-800/60 text-xs font-semibold transition-colors"
                    >
                      <UserSquare2 className="w-3.5 h-3.5 text-indigo-400" /> View Recruiter
                    </button>
                  </div>
                </div>

                {/* Stepper progress indicator */}
                {renderStepper(app.status)}

                {/* Start Interview Button */}
                {app.status === 'interview_scheduled' && interviewMap[app._id] && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => navigate(`/candidate/interview/${interviewMap[app._id]}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                      <Video className="w-4 h-4" /> Start AI Interview
                    </button>
                  </div>
                )}

                {/* Reapply after rejection */}
                {app.status === 'rejected' && app.jobId?._id && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-500">
                      Not the outcome you hoped for? You can apply again with an updated resume.
                    </p>
                    <button
                      onClick={() => navigate(`/candidate/jobs/${app.jobId!._id}`)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                      <RotateCcw className="w-4 h-4" /> Reapply
                    </button>
                  </div>
                )}

                {/* Cancel Application */}
                {canCancel(app.status) && (
                  <div className="mt-4 flex justify-center">
                    {confirmCancelId === app._id ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-red-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Cancel this application? This cannot be undone.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCancel(app._id)}
                            disabled={cancelingId === app._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            {cancelingId === app._id ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            Yes, cancel
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            disabled={cancelingId === app._id}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            Keep it
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(app._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-300 hover:border-red-500/30 text-xs font-semibold transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel Application
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recruiter Profile Modal */}
      {(recruiter || loadingRecruiter) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          onClick={() => {
            setRecruiter(null);
            setLoadingRecruiter(false);
          }}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setRecruiter(null);
                setLoadingRecruiter(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-sm font-semibold border border-slate-800 rounded-lg px-2.5 py-1 hover:bg-slate-800"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              Recruiter <UserSquare2 className="text-indigo-400 w-5 h-5" />
            </h2>

            {loadingRecruiter ? (
              <div className="flex justify-center py-12">
                <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : recruiter ? (
              <div className="flex flex-col items-center text-center gap-4">
                {recruiter.profilePicture ? (
                  <img
                    src={resolveAssetUrl(recruiter.profilePicture)}
                    alt={recruiter.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-4xl font-bold text-indigo-400">
                    {recruiter.name?.charAt(0) || 'H'}
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold text-white">{recruiter.name}</div>
                  {recruiter.designation && (
                    <div className="text-sm text-indigo-300 mt-0.5">{recruiter.designation}</div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-center mt-2">
                    <Mail className="w-3.5 h-3.5" /> {recruiter.email}
                  </div>
                </div>
                {recruiter.company && (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-300 text-sm">
                    <Building className="w-4 h-4 text-indigo-400" />
                    {recruiter.company.companyName}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
