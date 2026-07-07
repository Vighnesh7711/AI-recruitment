import { useState, useEffect } from 'react';
import { api, openResumePdf } from '../lib/api';
import {
  FileText,
  Upload,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import axios from 'axios';

interface Resume {
  _id: string;
  resumeUrl: string;
  uploadDate: string;
}

export function CandidateResume() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/resume/mine');
      setResumes(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to retrieve resumes.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // In order to show a real progress bar, we make a custom axios call with onUploadProgress
      // but injecting the token manually.
      const token = localStorage.getItem('token');
      const response = await axios.post(`${api.defaults.baseURL}/resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      setSuccess('Resume uploaded successfully!');
      setResumes((prev) => [response.data, ...prev]);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to upload resume.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (resumeId: string) => {
    setError('');
    const err = await openResumePdf(resumeId);
    if (err) setError(err);
  };

  const handleDelete = async (resumeId: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      setError('');
      setSuccess('');
      await api.delete(`/resume/${resumeId}`);
      setResumes((prev) => prev.filter((r) => r._id !== resumeId));
      setSuccess('Resume deleted successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to delete resume.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            My Resumes <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload PDF resumes. Standard documents uploaded here are used during candidate
            applications.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 mb-6 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3 mb-6 text-sm text-green-300">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Dropzone & Progress */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="max-w-xl mx-auto">
            <div className="border-2 border-slate-800 border-dashed rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer relative bg-slate-950/40 py-8 px-4 flex flex-col items-center justify-center">
              <Upload className="h-10 w-10 text-slate-500 mb-3" />
              <div className="flex text-sm text-slate-400 text-center flex-col sm:flex-row sm:gap-1">
                <label
                  htmlFor="resume-file"
                  className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300 focus-within:outline-none"
                >
                  <span>Upload a PDF resume</span>
                  <input
                    id="resume-file"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleUpload}
                  />
                </label>
                <p>or drag and drop here</p>
              </div>
              <p className="text-xs text-slate-550 mt-1.5">PDF format only, up to 5MB</p>
            </div>

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Upload History</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8 border border-slate-900 bg-slate-900/10 rounded-xl">
              <p className="text-slate-400 text-sm">No resumes uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/20 border border-slate-900 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Resume Document</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Uploaded {new Date(resume.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(resume._id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-850 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View PDF
                    </button>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-950 bg-red-950/20 hover:bg-red-900/30 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
