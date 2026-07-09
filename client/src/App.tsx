import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Careers } from './pages/Careers';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CompanySetup } from './pages/CompanySetup';
import { HRJobs } from './pages/HRJobs';
import { JobForm } from './pages/JobForm';
import { CandidateJobs } from './pages/CandidateJobs';
import { CandidateJobDetail } from './pages/CandidateJobDetail';
import { CandidateResume } from './pages/CandidateResume';
import { CandidateApplications } from './pages/CandidateApplications';
import { CandidateInterview } from './pages/CandidateInterview';
import { HRInterviews } from './pages/HRInterviews';
import { HRApplicationsDashboard } from './pages/HRApplicationsDashboard';
import { Profile } from './pages/Profile';
import { VerifyEmail } from './pages/VerifyEmail';
import { getSessionUser } from './lib/api';
import './App.css';

// Guard component for HR only routes
interface GuardProps {
  children: React.ReactNode;
}

function HRRouteGuard({ children }: GuardProps) {
  const user = getSessionUser();
  if (!user || user.role !== 'hr') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Guard component for Candidate only routes
function CandidateRouteGuard({ children }: GuardProps) {
  const user = getSessionUser();
  if (!user || user.role !== 'candidate') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Guard component for any authenticated user (HR or candidate)
function AuthRouteGuard({ children }: GuardProps) {
  const user = getSessionUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [sessionKey, setSessionKey] = useState(0);

  const handleAuthChange = () => {
    // Incrementing key forces re-render of Navbar and route checks
    setSessionKey((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <div
        key={sessionKey}
        className="min-h-screen flex flex-col font-sans"
        style={{ backgroundColor: '#ffffff', color: '#12261c' }}
      >
        <Navbar onAuthChange={handleAuthChange} />

        <main className="flex-1">
          <Routes>
            {/* Public Careers board */}
            <Route path="/" element={<Careers />} />

            {/* Authentication routes */}
            <Route path="/login" element={<Login onAuthChange={handleAuthChange} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Shared profile route (any authenticated user) */}
            <Route
              path="/profile"
              element={
                <AuthRouteGuard>
                  <Profile />
                </AuthRouteGuard>
              }
            />

            {/* Protected HR routes */}
            <Route
              path="/hr/company-setup"
              element={
                <HRRouteGuard>
                  <CompanySetup />
                </HRRouteGuard>
              }
            />
            <Route
              path="/hr/jobs"
              element={
                <HRRouteGuard>
                  <HRJobs />
                </HRRouteGuard>
              }
            />
            <Route
              path="/hr/jobs/new"
              element={
                <HRRouteGuard>
                  <JobForm />
                </HRRouteGuard>
              }
            />
            <Route
              path="/hr/jobs/:id/edit"
              element={
                <HRRouteGuard>
                  <JobForm />
                </HRRouteGuard>
              }
            />
            <Route
              path="/hr/interviews"
              element={
                <HRRouteGuard>
                  <HRInterviews />
                </HRRouteGuard>
              }
            />
            <Route
              path="/hr/applications"
              element={
                <HRRouteGuard>
                  <HRApplicationsDashboard />
                </HRRouteGuard>
              }
            />

            {/* Protected Candidate routes */}
            <Route
              path="/candidate/jobs"
              element={
                <CandidateRouteGuard>
                  <CandidateJobs />
                </CandidateRouteGuard>
              }
            />
            <Route
              path="/candidate/jobs/:id"
              element={
                <CandidateRouteGuard>
                  <CandidateJobDetail />
                </CandidateRouteGuard>
              }
            />
            <Route
              path="/candidate/resume"
              element={
                <CandidateRouteGuard>
                  <CandidateResume />
                </CandidateRouteGuard>
              }
            />
            <Route
              path="/candidate/applications"
              element={
                <CandidateRouteGuard>
                  <CandidateApplications />
                </CandidateRouteGuard>
              }
            />
            <Route
              path="/candidate/interview/:id"
              element={
                <CandidateRouteGuard>
                  <CandidateInterview />
                </CandidateRouteGuard>
              }
            />

            {/* Fallback to careers */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
