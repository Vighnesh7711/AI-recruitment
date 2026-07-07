import { useState, useEffect, useRef } from 'react';
import { api, resolveAssetUrl, getSessionUser } from '../lib/api';
import axios from 'axios';
import {
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  Code2 as Github,
  Link as Linkedin,
  Building,
} from 'lucide-react';

interface ProfileData {
  role: 'hr' | 'candidate';
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  // HR
  designation?: string;
  company?: { _id: string; companyName: string; logo?: string } | null;
  // Candidate
  phone?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
}

export function Profile() {
  const sessionUser = getSessionUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Picture upload
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/profile/me');
      const p: ProfileData = res.data;
      setProfile(p);
      setName(p.name || '');
      setDesignation(p.designation || '');
      setPhone(p.phone || '');
      setEducation(p.education || '');
      setExperience(p.experience || '');
      setSkills((p.skills || []).join(', '));
      setGithub(p.github || '');
      setLinkedin(p.linkedin || '');
      setPicturePreview(resolveAssetUrl(p.profilePicture));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError('');
    setPictureFile(file);
    setPicturePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (profile.role === 'hr') {
        formData.append('designation', designation);
      } else {
        formData.append('phone', phone);
        formData.append('education', education);
        formData.append('experience', experience);
        formData.append('skills', skills);
        formData.append('github', github);
        formData.append('linkedin', linkedin);
      }
      if (pictureFile) {
        formData.append('profilePicture', pictureFile);
      }

      const token = localStorage.getItem('token');
      const res = await axios.put(`${api.defaults.baseURL}/profile/me`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const updated: ProfileData = res.data;
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setPicturePreview(resolveAssetUrl(updated.profilePicture));
      setPictureFile(null);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile?.role || sessionUser?.role;
  const initial = (name || profile?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            My Profile <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage your personal information and profile picture.
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

        <form
          onSubmit={handleSave}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Picture + identity */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-950 flex items-center justify-center shadow-lg">
                {picturePreview ? (
                  <img
                    src={picturePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-indigo-400">{initial}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center border-2 border-slate-950 transition-colors shadow-lg"
                title="Change picture"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePictureChange}
              />
            </div>

            <div className="text-center sm:text-left">
              <div className="text-xl font-bold text-white">{name || 'Your Name'}</div>
              <div className="text-sm text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                <Mail className="w-3.5 h-3.5" /> {profile?.email}
              </div>
              <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {role}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email (read only) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                className="block w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed text-sm"
              />
            </div>
          </div>

          {role === 'hr' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Designation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Senior HR Specialist"
                  />
                </div>
              </div>
              {profile?.company && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-sm">
                    <Building className="h-4 w-4 text-indigo-400" />
                    {profile.company.companyName}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="+1 (555) 0199"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Education</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Experience</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. 3 years as a Frontend Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Skills <span className="text-slate-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="React, TypeScript, Node.js"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">GitHub</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Github className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="github.com/username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Linkedin className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
