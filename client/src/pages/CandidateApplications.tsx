import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Briefcase,
  MapPin,
  Building,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Video,
} from 'lucide-react';

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

  useEffect(() => {
    fetchApplications();
  }, []);

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
              You haven&apos;t applied to any job postings yet. Find open positions on the job board.
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
                  <div className="flex flex-col sm:items-end text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Applied on{' '}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
