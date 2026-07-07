import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Info,
  CalendarDays,
} from 'lucide-react';

interface Application {
  _id: string;
  status: string;
  createdAt: string;
  atsScore?: number;
  candidateId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  jobId: {
    _id: string;
    title: string;
    department: string;
    location: string;
  };
}

interface Interview {
  _id: string;
  applicationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated' | 'cancelled' | 'expired';
  scheduledAt: string;
  duration: number;
  candidateId: {
    fullName: string;
    email: string;
  };
  jobId: {
    title: string;
    department: string;
  };
}

export function HRInterviews() {
  const [shortlisted, setShortlisted] = useState<Application[]>([]);
  const [underReview, setUnderReview] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'shortlisted'>('review');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Scheduling Form State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [duration, setDuration] = useState('45');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Rescheduling State
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newDuration, setNewDuration] = useState('45');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // 1. Fetch HR's applications
      const appsRes = await api.get('/application');
      const allApps: Application[] = appsRes.data;
      // Filter for 'shortlisted' status (yet to be scheduled)
      setShortlisted(allApps.filter((app) => app.status === 'shortlisted'));
      // Filter for 'under_review' status (including newly 'applied' applications)
      setUnderReview(allApps.filter((app) => app.status === 'under_review' || app.status === 'applied'));

      // 2. Fetch already scheduled interviews
      const interviewsRes = await api.get('/interview');
      setInterviews(interviewsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load interview data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: string, newStatus: 'shortlisted' | 'rejected') => {
    try {
      setError('');
      setSuccess('');
      await api.patch(`/application/${appId}/status`, { status: newStatus });
      setSuccess(`Candidate successfully ${newStatus === 'shortlisted' ? 'shortlisted' : 'rejected'}.`);
      if (selectedApp?._id === appId) {
        setSelectedApp(null);
      }
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update application status.');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSubmittingSchedule(true);
      setError('');
      setSuccess('');

      await api.post('/interview', {
        applicationId: selectedApp._id,
        schedule: new Date(scheduleTime).toISOString(),
        durationMinutes: Number(duration),
      });

      setSuccess('Interview scheduled successfully! Webhook triggered and calendar event synced.');
      setSelectedApp(null);
      setScheduleTime('');
      // Refresh list
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to schedule interview.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleInterview) return;

    try {
      setSubmittingReschedule(true);
      setError('');
      setSuccess('');

      await api.patch(`/interview/${rescheduleInterview._id}/reschedule`, {
        schedule: new Date(newScheduleTime).toISOString(),
        durationMinutes: Number(newDuration),
      });

      setSuccess('Interview rescheduled successfully! Notification webhook fired.');
      setRescheduleInterview(null);
      setNewScheduleTime('');
      // Refresh list
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reschedule interview.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 py-12 px-6 lg:px-8 relative overflow-hidden text-slate-100">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Interview Management <CalendarDays className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Schedule new interviews for shortlisted candidates and manage existing events.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3 mb-6 animate-pulse">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-200">{success}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Shortlisted But Unscheduled (4 cols or 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl">
                <div className="flex border-b border-slate-800 mb-6">
                  <button
                    onClick={() => {
                      setActiveTab('review');
                      setSelectedApp(null);
                    }}
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                      activeTab === 'review'
                        ? 'border-indigo-500 text-white font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pending Review ({underReview.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('shortlisted')}
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                      activeTab === 'shortlisted'
                        ? 'border-indigo-500 text-white font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Shortlisted ({shortlisted.length})
                  </button>
                </div>

                {activeTab === 'review' ? (
                  underReview.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                      <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No candidates pending review.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        New applications with passing ATS scores will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {underReview.map((app) => (
                        <div
                          key={app._id}
                          className="p-4 rounded-xl border bg-slate-950/40 border-slate-800/80 hover:border-slate-700 transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm text-white">
                              {app.candidateId.fullName}
                            </h3>
                            {app.atsScore !== undefined && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                                ATS: {app.atsScore}/100
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 space-y-1 mb-3.5">
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                              {app.jobId.title} ({app.jobId.department})
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              {app.candidateId.email}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                              className="flex-1 py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg text-xs font-semibold transition-all"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app._id, 'rejected')}
                              className="flex-1 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-lg text-xs font-semibold transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : shortlisted.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                    <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No candidates currently shortlisted.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Shortlist candidates from the &quot;Pending Review&quot; tab first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {shortlisted.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => setSelectedApp(app)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedApp?._id === app._id
                            ? 'bg-indigo-500/10 border-indigo-500 shadow shadow-indigo-500/20'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-semibold text-sm text-white">
                            {app.candidateId.fullName}
                          </h3>
                          {app.atsScore !== undefined && (
                            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                              ATS: {app.atsScore}/100
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            {app.jobId.title} ({app.jobId.department})
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {app.candidateId.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Form (Visible when application selected) */}
              {selectedApp && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl animate-fadeIn">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Schedule Interview
                  </h2>

                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Candidate
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${selectedApp.candidateId.fullName} (${selectedApp.jobId.title})`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Date & Time (ISO)
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Duration (Minutes)
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submittingSchedule}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow shadow-indigo-500/20 disabled:opacity-50 text-sm"
                      >
                        {submittingSchedule ? 'Scheduling...' : 'Confirm Schedule'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(null)}
                        className="px-4 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-300 font-medium transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Side: Scheduled Interviews (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Scheduled Interviews
                  <span className="ml-auto bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {interviews.length} total
                  </span>
                </h2>

                {interviews.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                    <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No interviews scheduled yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Schedule an interview on the left panel to begin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <div
                        key={interview._id}
                        className="p-5 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-slate-850 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">
                              {interview.candidateId?.fullName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {interview.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                              {interview.jobId?.title} ({interview.jobId?.department})
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {formatDate(interview.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {interview.duration} Minutes
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => {
                              setRescheduleInterview(interview);
                              setNewScheduleTime(
                                new Date(interview.scheduledAt).toISOString().slice(0, 16)
                              );
                              setNewDuration(interview.duration.toString());
                            }}
                            className="w-full md:w-auto px-4 py-2 border border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-400 hover:text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Reschedule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reschedule Modal/Form (Render inline below or above) */}
              {rescheduleInterview && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-xl animate-fadeIn">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    Reschedule Interview
                  </h2>

                  <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        New Date & Time (ISO)
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Duration (Minutes)
                      </label>
                      <select
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="90">90 Minutes</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submittingReschedule}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow disabled:opacity-50 text-sm"
                      >
                        {submittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRescheduleInterview(null)}
                        className="px-4 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-300 font-medium transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
