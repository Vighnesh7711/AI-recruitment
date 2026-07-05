import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ArrowLeft,
  Save,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function JobForm() {
  const { id } = useParams(); // If present, we are in edit mode
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [experience, setExperience] = useState('mid');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [deadline, setDeadline] = useState('');

  // Extra schema fields
  const [location, setLocation] = useState('Remote');
  const [locationType, setLocationType] = useState('remote');
  const [employmentType, setEmploymentType] = useState('full-time');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load existing job details if editing
  useEffect(() => {
    async function loadJob() {
      if (!isEdit) return;
      try {
        const res = await api.get(`/jobs/${id}`);
        const job = res.data;
        setTitle(job.title || '');
        setDomain(job.department || '');
        setExperience(job.experienceLevel || 'mid');
        setSkillsRequired(Array.isArray(job.skills) ? job.skills.join(', ') : '');
        setDescription(job.description || '');
        setSalary(job.salaryMax ? String(job.salaryMax) : '');
        if (job.applicationDeadline) {
          // Format deadline to YYYY-MM-DD
          const d = new Date(job.applicationDeadline);
          setDeadline(d.toISOString().split('T')[0]);
        }
        setLocation(job.location || 'Remote');
        setLocationType(job.locationType || 'remote');
        setEmploymentType(job.employmentType || 'full-time');
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Failed to load job details.';
        setMessage({ type: 'error', text: msg });
      } finally {
        setFetching(false);
      }
    }
    loadJob();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Process skills into string array
    const skillsArray = skillsRequired
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const body = {
      title,
      domain,
      experience,
      skillsRequired: skillsArray,
      description,
      salary: salary ? Number(salary) : undefined,
      deadline: deadline || undefined,
      location,
      locationType,
      employmentType,
    };

    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, body);
        setMessage({ type: 'success', text: 'Job posting updated successfully!' });
      } else {
        await api.post('/jobs', body);
        setMessage({ type: 'success', text: 'Job posting created as a draft!' });
        setTimeout(() => {
          navigate('/hr/jobs');
        }, 1500);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save job posting.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/hr/jobs')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors border border-slate-800 bg-slate-950/40"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            {isEdit ? 'Edit Job Posting' : 'Create Job Listing'}{' '}
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isEdit
              ? 'Make modifications to your active job listing.'
              : 'Describe the job position. Listings start as draft status.'}
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-black/40">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message.text && (
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-slate-300">
                  Job Title
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Senior Fullstack Engineer"
                  />
                </div>
              </div>

              {/* Domain / Department */}
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-300">
                  Domain / Department
                </label>
                <input
                  id="domain"
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. Engineering, Sales, Product"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-slate-300">
                  Experience Level
                </label>
                <select
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-300">
                  Location
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
              </div>

              {/* Location Type */}
              <div>
                <label htmlFor="locationType" className="block text-sm font-medium text-slate-300">
                  Work Mode
                </label>
                <select
                  id="locationType"
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">On-Site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label
                  htmlFor="employmentType"
                  className="block text-sm font-medium text-slate-300"
                >
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Salary */}
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-slate-300">
                  Salary (Max / Annual USD)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. 120000"
                  />
                </div>
              </div>

              {/* Application Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-slate-300">
                  Application Deadline
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Skills Required */}
              <div className="md:col-span-2">
                <label
                  htmlFor="skillsRequired"
                  className="block text-sm font-medium text-slate-300"
                >
                  Skills Required (comma separated)
                </label>
                <input
                  id="skillsRequired"
                  type="text"
                  required
                  value={skillsRequired}
                  onChange={(e) => setSkillsRequired(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. React, Node.js, TypeScript, MongoDB"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                  Job Description
                </label>
                <textarea
                  id="description"
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="Describe the duties, responsibilities, and required culture fit..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEdit ? 'Save Changes' : 'Create Job Draft'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
