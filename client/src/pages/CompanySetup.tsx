import { useState, useEffect } from 'react';
import { api, getSessionUser } from '../lib/api';
import { Building, Globe, Layers, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export function CompanySetup() {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch current company if linked
  useEffect(() => {
    async function loadCompany() {
      const user = getSessionUser();
      if (user && user.id) {
        try {
          // Find if user is linked to a company.
          // Since the user session might have it, let's look up the user profile first
          // Let's call a query or get from local storage:
          const localUser = localStorage.getItem('user');
          if (localUser) {
            const parsed = JSON.parse(localUser);
            // If they have a companyId, fetch its details
            if (parsed.companyId) {
              setCompanyId(parsed.companyId);
              const companyRes = await api.get(`/company/${parsed.companyId}`);
              setName(companyRes.data.name || '');
              setWebsite(companyRes.data.website || '');
              setIndustry(companyRes.data.industry || '');
              if (companyRes.data.logoUrl) {
                setLogoPreview(companyRes.data.logoUrl);
              }
            } else {
              // Try to find if user has registered a company already (by createdBy)
              // Since we don't have list endpoint for company, we'll let the user fill the form to create or edit.
            }
          }
        } catch (err) {
          console.error('Failed to load company:', err);
        } finally {
          setFetching(false);
        }
      } else {
        setFetching(false);
      }
    }
    loadCompany();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      // Notice body parameters required: { companyName, website, industry } for POST
      // and { name, website, industry } for PUT
      if (companyId) {
        formData.append('name', name);
      } else {
        formData.append('companyName', name);
      }
      formData.append('website', website);
      formData.append('industry', industry);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (companyId) {
        // Update company
        const res = await api.put(`/company/${companyId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: 'Company profile updated successfully!' });
        if (res.data.logoUrl) setLogoPreview(res.data.logoUrl);
      } else {
        // Create company
        const res = await api.post('/company', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: 'Company registered successfully!' });
        setCompanyId(res.data._id);
        if (res.data.logoUrl) setLogoPreview(res.data.logoUrl);

        // Update local storage user profile with companyId
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          parsed.companyId = res.data._id;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save company setup.';
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

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {companyId ? 'Edit Company Profile' : 'Set Up Your Company'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Provide details about your company to start posting job opportunities.
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

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-300">
                Company Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-300">
                Website
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="https://acme.com"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-300">
                Industry
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Layers className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. Technology, Healthcare, Finance"
                />
              </div>
            </div>

            {/* Logo Upload Dropzone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company Logo</label>
              <div className="flex items-center gap-6">
                {logoPreview && (
                  <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-slate-800 border-dashed rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer relative bg-slate-950/50">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-500" />
                      <div className="flex text-sm text-slate-400">
                        <label
                          htmlFor="logo-upload"
                          className="relative cursor-pointer rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="logo-upload"
                            name="logo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : companyId ? (
                  'Update Profile'
                ) : (
                  'Create Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
