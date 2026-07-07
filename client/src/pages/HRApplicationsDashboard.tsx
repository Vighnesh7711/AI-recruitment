import { useState, useEffect } from 'react';
import { api, resolveAssetUrl, openResumePdf } from '../lib/api';
import { Sparkles, CheckCircle, XCircle, RefreshCw, Sliders, ShieldAlert, User, Briefcase, Eye, AlertTriangle, Lightbulb, FileText, Mail, Phone, GraduationCap, Code2 as Github, Link as Linkedin } from 'lucide-react';

interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  profilePicture?: string;
  resumeId?: string | null;
}

interface ApplicationItem {
  _id: string;
  status: string;
  atsScore?: number;
  atsAnalysis?: {
    overallScore: number;
    matchedSkills: string[];
    missing_skills: string[];
    experienceMatch: number;
    educationMatch: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  resumeId?: string;
  resumePath?: string;
  createdAt: string;
  candidateId: {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
  };
  jobId: {
    _id: string;
    title: string;
    autoScreenEnabled: boolean;
    atsCutoffScore: number;
  };
}

export function HRApplicationsDashboard() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // Candidate profile drawer
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const viewCandidateProfile = async (candidateId: string) => {
    if (!candidateId) return;
    setLoadingCandidate(true);
    setCandidateProfile(null);
    try {
      const res = await api.get(`/profile/candidate/${candidateId}`);
      setCandidateProfile(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to load candidate profile.');
    } finally {
      setLoadingCandidate(false);
    }
  };

  const handleOpenResume = async (resumeId?: string | null) => {
    if (!resumeId) return;
    setPdfError('');
    const err = await openResumePdf(resumeId);
    if (err) setPdfError(err);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/application');
      setApplications(res.data);
    } catch (err) {
      console.error('Failed fetching candidate applications summary metrics.', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualStatusChange = async (appId: string, nextStatus: string) => {
    setProcessingId(appId);
    try {
      await api.patch(`/application/${appId}/status`, { status: nextStatus });
      setApplications((prev) =>
        prev.map((item) => (item._id === appId ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      alert('Failed updating application operational state milestones.');
    } finally {
      setProcessingId(null);
    }
  };

  const triggerAIAnalysis = async (resumeId: string, appId: string) => {
    if (!resumeId) return alert('No explicit valid resume resource linked.');
    setProcessingId(appId);
    try {
      await api.post(`/resume/${resumeId}/analyze`);
      await loadApplications(); // Refresh fresh state data
    } catch (err) {
      alert('AI Processing request error encountered.');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleJobAutoScreen = async (jobId: string, currentSetting: boolean) => {
    try {
      // Modifies target operational flag state configuration parameters at runtime
      await api.patch(`/jobs/${jobId}/status`, { autoScreenEnabled: !currentSetting });
      loadApplications();
    } catch (err) {
      alert('Failed updating job threshold tracking parameter.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading talent pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2 mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              HR Talent Pipeline Command Hub <Sliders className="text-indigo-400 w-6 h-6" />
            </h1>
            <p className="text-slate-400 text-sm">
              Enforce manual vetting control or opt-in for automated ATS gating screening per role.
            </p>
          </div>
          <button
            onClick={loadApplications}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>

        <div className="overflow-x-auto bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-2xl">
          <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead className="bg-slate-950/80">
              <tr>
                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-400">Candidate Info</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-400">Target Role</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-400">AI Scoring Metrics</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-400">Current Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider uppercase text-slate-400">Manual Controls Actions Matrix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  return (
                    <tr key={app._id} className="hover:bg-slate-800/20 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {app.candidateId?.profilePicture ? (
                            <img
                              src={resolveAssetUrl(app.candidateId.profilePicture)}
                              alt={app.candidateId?.fullName}
                              className="w-9 h-9 rounded-lg object-cover border border-indigo-500/20"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                              {app.candidateId?.fullName?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div>
                            <button
                              onClick={() => viewCandidateProfile(app.candidateId?._id)}
                              className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors text-left"
                              title="View candidate profile"
                            >
                              {app.candidateId?.fullName}
                            </button>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              {app.candidateId?.email}
                            </div>
                            {app.resumeId ? (
                              <button
                                onClick={() => handleOpenResume(app.resumeId)}
                                className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                              >
                                <FileText className="w-3 h-3" /> View Resume PDF
                              </button>
                            ) : (
                              <span className="mt-1 text-[11px] text-slate-500 italic">No resume uploaded</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            {app.jobId?.title}
                          </div>
                          <button
                            onClick={() => toggleJobAutoScreen(app.jobId?._id, app.jobId?.autoScreenEnabled)}
                            className={`mt-2 text-[10px] flex items-center gap-1 font-mono uppercase px-2 py-1 rounded-md border transition-all ${
                              app.jobId?.autoScreenEnabled
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-700/80'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Auto-Screen: {app.jobId?.autoScreenEnabled ? 'ON (Auto-Gate)' : 'OFF (Manual)'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {app.atsScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border transition-all ${
                              app.atsScore >= 75
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : app.atsScore >= 60
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {app.atsScore} / 100
                            </span>
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="p-1 hover:bg-slate-800 rounded-md text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 text-[11px]"
                              title="View AI Details"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={processingId === app._id}
                            onClick={() => triggerAIAnalysis(app.resumeId || '', app._id)}
                            className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-all disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                            {processingId === app._id ? 'Analyzing...' : 'Queue AI Screening Parse'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] rounded-full uppercase font-bold tracking-widest border ${
                          app.status === 'shortlisted'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : app.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : app.status === 'under_review'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : app.status === 'interview_scheduled'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleManualStatusChange(app._id, 'shortlisted')}
                          disabled={processingId === app._id || app.status === 'shortlisted' || app.status === 'interview_scheduled'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40 transition-all duration-200"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Shortlist
                        </button>
                        <button
                          onClick={() => handleManualStatusChange(app._id, 'rejected')}
                          disabled={processingId === app._id || app.status === 'rejected'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40 transition-all duration-200"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-all duration-300" onClick={() => setSelectedApp(null)}>
          <div 
            className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-8 overflow-y-auto h-screen shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedApp(null)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-all text-sm font-semibold border border-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-800"
            >
              ✕ Close
            </button>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
              AI Evaluation Analysis <Sparkles className="text-indigo-400 w-5 h-5" />
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Candidate: <span className="text-white font-semibold">{selectedApp.candidateId?.fullName}</span> | Target Role: <span className="text-white font-semibold">{selectedApp.jobId?.title}</span>
              {selectedApp.resumeId && (
                <span className="block mt-2">
                  <button
                    onClick={() => handleOpenResume(selectedApp.resumeId)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-xs border border-indigo-500/25 bg-indigo-500/5 px-2.5 py-1 rounded-md"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Submitted Resume PDF
                  </button>
                </span>
              )}
            </p>

            {/* ATS Score Meter */}
            <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800/80 mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">ATS Match Score</div>
                <div className="text-4xl font-extrabold text-white flex items-baseline gap-1">
                  {selectedApp.atsScore} <span className="text-sm font-medium text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (selectedApp.atsScore || 0) >= 75
                      ? 'bg-emerald-500'
                      : (selectedApp.atsScore || 0) >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`} 
                  style={{ width: `${selectedApp.atsScore}%` }}
                />
              </div>
            </div>

            {/* Detailed sections */}
            {selectedApp.atsAnalysis && (
              <div className="space-y-6">
                {/* Matched & Missing Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/30 rounded-xl p-5 border border-slate-800/50">
                    <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Matched Skills
                    </h3>
                    {selectedApp.atsAnalysis.matchedSkills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.atsAnalysis.matchedSkills.map((sk) => (
                          <span key={sk} className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/15">
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No skills matched directly.</span>
                    )}
                  </div>

                  <div className="bg-slate-950/30 rounded-xl p-5 border border-slate-800/50">
                    <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Missing Skills
                    </h3>
                    {selectedApp.atsAnalysis.missing_skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.atsAnalysis.missing_skills.map((sk) => (
                          <span key={sk} className="text-xs px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/15">
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No critical skills missing.</span>
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-slate-950/30 rounded-xl p-5 border border-slate-800/50">
                  <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {selectedApp.atsAnalysis.strengths?.map((st, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{st}</span>
                      </li>
                    )) || <li className="text-xs text-slate-500 italic">No specific strengths listed.</li>}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-slate-950/30 rounded-xl p-5 border border-slate-800/50">
                  <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Improvement Areas & Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {selectedApp.atsAnalysis.weaknesses?.map((wk, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{wk}</span>
                      </li>
                    )) || <li className="text-xs text-slate-500 italic">No specific weaknesses listed.</li>}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-slate-950/30 rounded-xl p-5 border border-slate-800/50">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-emerald-400" /> AI Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {selectedApp.atsAnalysis.recommendations?.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    )) || <li className="text-xs text-slate-500 italic">No recommendations listed.</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF error toast */}
      {pdfError && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl bg-red-950/90 border border-red-500/30 px-4 py-3 shadow-2xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-200">{pdfError}</span>
          <button onClick={() => setPdfError('')} className="text-red-400 hover:text-red-200 text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {/* Candidate Profile Drawer */}
      {(candidateProfile || loadingCandidate) && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
          onClick={() => { setCandidateProfile(null); setLoadingCandidate(false); }}
        >
          <div
            className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-8 overflow-y-auto h-screen shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setCandidateProfile(null); setLoadingCandidate(false); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-all text-sm font-semibold border border-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-800"
            >
              ✕ Close
            </button>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              Candidate Profile <User className="text-indigo-400 w-5 h-5" />
            </h2>

            {loadingCandidate ? (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : candidateProfile ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {candidateProfile.profilePicture ? (
                    <img
                      src={resolveAssetUrl(candidateProfile.profilePicture)}
                      alt={candidateProfile.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-800"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400">
                      {candidateProfile.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-bold text-white">{candidateProfile.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5" /> {candidateProfile.email}
                    </div>
                    {candidateProfile.phone && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5" /> {candidateProfile.phone}
                      </div>
                    )}
                  </div>
                </div>

                {candidateProfile.education && (
                  <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/60">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Education
                    </div>
                    <div className="text-sm text-slate-200">{candidateProfile.education}</div>
                  </div>
                )}

                {candidateProfile.experience && (
                  <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/60">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Experience
                    </div>
                    <div className="text-sm text-slate-200">{candidateProfile.experience}</div>
                  </div>
                )}

                {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                  <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/60">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {candidateProfile.skills.map((sk) => (
                        <span key={sk} className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-md border border-indigo-500/15">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(candidateProfile.github || candidateProfile.linkedin) && (
                  <div className="flex flex-wrap gap-3">
                    {candidateProfile.github && (
                      <a
                        href={/^https?:\/\//.test(candidateProfile.github) ? candidateProfile.github : `https://${candidateProfile.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-slate-800 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {candidateProfile.linkedin && (
                      <a
                        href={/^https?:\/\//.test(candidateProfile.linkedin) ? candidateProfile.linkedin : `https://${candidateProfile.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-slate-800 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                  </div>
                )}

                {candidateProfile.resumeId && (
                  <button
                    onClick={() => handleOpenResume(candidateProfile.resumeId)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                  >
                    <FileText className="w-4 h-4" /> View Resume PDF
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
