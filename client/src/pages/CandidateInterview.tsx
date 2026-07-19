import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Mic,
  Volume2,
  MessageSquare,
  AlertCircle,
  Loader2,
  ArrowRight,
  Trophy,
  Brain,
  Sparkles,
  Send,
  Keyboard,
  MicOff,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

// Accept both the documented VITE_AVATAR_URL and the legacy VITE_AVATAR_SERVICE_URL.
const AVATAR_BASE =
  import.meta.env.VITE_AVATAR_URL ||
  import.meta.env.VITE_AVATAR_SERVICE_URL ||
  'http://localhost:5002';

interface Question {
  questionId: string;
  text: string;
  category: string;
  weight: number;
  candidateAnswer?: string;
  aiScore?: number;
  aiFeedback?: string;
}

type Phase = 'loading' | 'ready' | 'speaking' | 'listening' | 'processing' | 'done' | 'error';
type Mode = 'avatar' | 'text';

export function CandidateInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [mode, setMode] = useState<Mode>('avatar'); // default to voice/avatar mode
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [finalResult, setFinalResult] = useState<any>(null);

  // Text input state
  const [textAnswer, setTextAnswer] = useState('');

  // Audio recording & mic control state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Poll timer ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Safety timers so the UI never gets stuck on a dark screen
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear every outstanding timer/interval
  const clearTimers = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
  };

  // Start the interview session
  const startSession = useCallback(async () => {
    try {
      setPhase('loading');
      setError('');
      const res = await api.post(`/interview/${id}/start-avatar`);
      setSessionId(res.data.sessionId);
      setQuestions(res.data.questions || []);
      setCurrentIndex(0);

      const serverMode: Mode = res.data.mode === 'avatar' ? 'avatar' : 'text';
      setMode(serverMode);

      if (serverMode === 'avatar') {
        // Poll for the first action from the avatar service
        pollForAction(res.data.sessionId);
      } else {
        setPhase('listening');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || err.message || 'Failed to start interview session.';
      setError(msg);
      setPhase('error');
    }
  }, [id]);

  useEffect(() => {
    startSession();
    return () => {
      clearTimers();
      stopRecording();
    };
  }, [startSession]);

  // Move into the speaking phase, guaranteeing we always advance to listening
  // even if the audio never fires `onended` (autoplay blocked, decode error, etc.)
  const enterSpeaking = (action: any) => {
    setPhase('speaking');
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

    // Hard ceiling: never stay in "speaking" longer than this, no matter what.
    const maxSpeak = Math.max(4000, (action.questionText?.length || 50) * 80);
    speakTimeoutRef.current = setTimeout(() => setPhase('listening'), maxSpeak);

    if (action.audio) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${action.audio}`);
        const goListen = () => {
          if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
          setPhase('listening');
        };
        audio.onended = goListen;
        audio.onerror = goListen;
        audio.play().catch(goListen);
      } catch {
        // Fall through to the maxSpeak timer above.
      }
    }
    // When there is no audio, the maxSpeak timer handles the transition.
  };

  // Poll the avatar-service for the next action (avatar/voice mode only).
  // Falls back to text mode if the service never responds so the candidate
  // is never left stranded on the loading screen.
  const pollForAction = (sid: string) => {
    clearTimers();
    const startedAt = Date.now();
    const MAX_WAIT_MS = 15000; // give the avatar service 15s to respond

    pollRef.current = setInterval(async () => {
      // Timed out waiting for the avatar service — degrade gracefully to text.
      if (Date.now() - startedAt > MAX_WAIT_MS) {
        clearTimers();
        setMode('text');
        setPhase('listening');
        return;
      }
      try {
        const res = await fetch(`${AVATAR_BASE}/avatar/session/${sid}/next-action`);
        if (!res.ok) return; // keep polling
        const action = await res.json();
        if (action.type === 'speak') {
          clearTimers();
          enterSpeaking(action);
        } else if (action.type === 'listen') {
          clearTimers();
          setPhase('listening');
        }
      } catch {
        // network error — keep polling until MAX_WAIT_MS elapses
      }
    }, 1000);
  };

  // Start microphone recording (manually triggered by the button)
  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      let msg = 'Microphone access failed: ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg +=
          'Permission denied. Please allow microphone access in your browser settings and check Brave Shields.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg += 'No microphone detected. Please plug in a microphone.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg += 'Microphone is already in use by another application.';
      } else {
        msg += `${err.message || err.toString()}`;
      }
      setError(msg);
      setPhase('error');
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Submit text answer (text mode)
  const handleSubmitTextAnswer = async () => {
    if (!textAnswer.trim()) return;
    setError('');
    setPhase('processing');
    const answerText = textAnswer.trim();
    setTextAnswer('');

    try {
      const currentQ = questions[currentIndex];
      const res = await api.post(`/interview/${id}/answer`, {
        sessionId,
        questionId: currentQ.questionId,
        textAnswer: answerText,
      });

      setTranscript(answerText);

      if (res.data.done) {
        setFinalResult(res.data);
        setPhase('done');
      } else {
        if (res.data.nextQuestion) {
          setQuestions((prev) => {
            const nextIdx = res.data.currentQuestionIndex;
            const updated = [...prev];
            updated[nextIdx] = {
              questionId: res.data.nextQuestionId || `q_${nextIdx}`,
              text: res.data.nextQuestion,
              category: updated[nextIdx]?.category || 'technical',
              weight: 1,
            };
            return updated;
          });
        }
        setCurrentIndex(res.data.currentQuestionIndex);
        if (mode === 'avatar') {
          pollForAction(sessionId);
        } else {
          setPhase('listening');
        }
      }

    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to process answer.';
      setError(msg);
      setPhase('listening');
    }
  };

  // Stop recording & submit audio answer (voice mode)
  const handleSubmitAudioAnswer = async () => {
    setError('');
    setPhase('processing');
    stopRecording();

    // Give MediaRecorder a moment to finalize
    await new Promise((r) => setTimeout(r, 300));

    if (chunksRef.current.length === 0) {
      setError('No audio recorded. Please click start, speak clearly, and then click submit.');
      setPhase('listening');
      return;
    }

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1] || '';

      // Send audio to avatar-service bridge
      try {
        await fetch(`${AVATAR_BASE}/avatar/session/${sessionId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64 }),
        });
      } catch {
        // Fall back gracefully if service endpoint is unreachable
      }

      // Call the server answer endpoint
      try {
        const currentQ = questions[currentIndex];
        const res = await api.post(`/interview/${id}/answer`, {
          sessionId,
          questionId: currentQ.questionId,
        });

        setTranscript(res.data.transcript || '');

        if (res.data.done) {
          setFinalResult(res.data);
          setPhase('done');
        } else {
          if (res.data.nextQuestion) {
            setQuestions((prev) => {
              const nextIdx = res.data.currentQuestionIndex;
              const updated = [...prev];
              updated[nextIdx] = {
                questionId: res.data.nextQuestionId || `q_${nextIdx}`,
                text: res.data.nextQuestion,
                category: updated[nextIdx]?.category || 'technical',
                weight: 1,
              };
              return updated;
            });
          }
          setCurrentIndex(res.data.currentQuestionIndex);
          pollForAction(sessionId);
        }
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Failed to process answer.';
        setError(msg);
        setPhase('listening');
      }
    };
    reader.readAsDataURL(blob);
  };

  // Toggle Mode manually
  const toggleMode = () => {
    if (mode === 'avatar') {
      clearTimers();
      stopRecording();
      setMode('text');
      setPhase('listening');
    } else {
      setMode('avatar');
      setPhase('loading');
      startSession();
    }
  };

  // Category badge color
  const catColor = (cat: string) => {
    switch (cat) {
      case 'technical':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'behavioral':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'situational':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'culture_fit':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const currentQuestion = questions[currentIndex] || (
    questions.length > 0 ? questions[questions.length - 1] : undefined
  );
  const displayQuestionText =
    currentQuestion?.text?.trim() ||
    (questions.length > 0
      ? `Question ${currentIndex + 1}: Please provide your response.`
      : 'Please describe your relevant skills and experience.');


  // ── DONE SCREEN ──
  if (phase === 'done' && finalResult) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Interview Complete!</h1>
          <p className="text-slate-400 mb-8">
            Your responses have been recorded and evaluated by our AI system.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Interview Score
              </p>
              <p className="text-3xl font-black text-white">
                {Math.round(finalResult.overallInterviewScore || 0)}
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Final Score
              </p>
              <p className="text-3xl font-black text-white">
                {finalResult.finalWeightedScore || 0}
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/10 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
              AI Recommendation
            </p>
            <p className="text-xl font-black uppercase tracking-wider text-amber-400">
              {(finalResult.recommendation || 'pending').replace(/_/g, ' ')}
            </p>
          </div>


          <button
            onClick={() => navigate('/candidate/applications')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Back to Applications <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── ERROR SCREEN ──
  if (phase === 'error') {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            onClick={() => startSession()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──
  if (phase === 'loading') {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-400 font-medium">Initializing your AI interview session...</p>
        </motion.div>
      </div>
    );
  }

  // ── MAIN INTERVIEW UI ──
  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-950 text-white py-8 px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Styled inline animations to avoid missing stylesheets */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes avatarBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes avatarTalk {
          0%, 100% { height: 6px; rx: 3px; }
          50% { height: 28px; rx: 14px; }
        }
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-avatar-blink {
          animation: avatarBlink 4s infinite ease-in-out;
        }
        .animate-avatar-talk {
          animation: avatarTalk 0.25s infinite ease-in-out;
        }
        .animate-avatar-float {
          animation: avatarFloat 3s infinite ease-in-out;
        }
        .animate-spin-ring {
          animation: spinRing 4s infinite linear;
        }
      `,
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Live Animated Conversation Avatar */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-72 h-72 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center shadow-2xl overflow-hidden backdrop-blur-xl group">
            {/* Ambient glowing background behind avatar */}
            <div
              className={`absolute inset-0 transition-all duration-700 blur-2xl opacity-40 ${
                phase === 'speaking'
                  ? 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                  : phase === 'listening'
                    ? isRecording
                      ? 'bg-gradient-to-tr from-red-500 to-rose-500'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                    : phase === 'processing'
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 animate-pulse'
                      : 'bg-indigo-500/10'
              }`}
            />

            {/* Glowing sound wave rings around the avatar */}
            {phase === 'speaking' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-48 h-48 rounded-full border border-indigo-500/20 animate-ping" />
                <div className="absolute w-56 h-56 rounded-full border border-purple-500/10 animate-ping [animation-delay:0.3s]" />
              </div>
            )}
            {phase === 'listening' && isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-48 h-48 rounded-full border border-red-500/20 animate-ping" />
              </div>
            )}

            {/* Vector Animated Avatar Head */}
            <div className="relative z-10 flex flex-col items-center justify-center animate-avatar-float">
              <svg
                width="180"
                height="180"
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                {/* Outer Head Shield/Helmet */}
                <path
                  d="M40 50C40 25 50 15 80 15C110 15 120 25 120 50V90C120 115 105 125 80 125C55 125 40 115 40 90V50Z"
                  fill="url(#avatarHeadGrad)"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                />

                {/* Glassmorphic Face Visor */}
                <path
                  d="M46 54C46 34 52 24 80 24C108 24 114 34 114 54V84C114 104 102 114 80 114C58 114 46 104 46 84V54Z"
                  fill="rgba(15, 23, 42, 0.65)"
                  stroke="rgba(99, 102, 241, 0.4)"
                  strokeWidth="1.5"
                />

                {/* Left & Right Glowing Eyes */}
                <g className="animate-avatar-blink origin-center">
                  <circle
                    cx="65"
                    cy="55"
                    r="5"
                    fill="#38BDF8"
                    className="drop-shadow-[0_0_6px_#38BDF8]"
                  />
                  <circle
                    cx="95"
                    cy="55"
                    r="5"
                    fill="#38BDF8"
                    className="drop-shadow-[0_0_6px_#38BDF8]"
                  />
                </g>

                {/* Cyber Face Details */}
                <path
                  d="M50 72H58"
                  stroke="rgba(56, 189, 248, 0.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M102 72H110"
                  stroke="rgba(56, 189, 248, 0.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Animated Mouth */}
                {phase === 'speaking' ? (
                  /* Talking mouth (tall, thin capsule oscillating height) */
                  <rect
                    x="74"
                    y="70"
                    width="12"
                    height="24"
                    rx="6"
                    fill="#F43F5E"
                    className="animate-avatar-talk origin-center"
                  />
                ) : phase === 'processing' ? (
                  /* Processing mouth (spinning indicator) */
                  <circle
                    cx="80"
                    cy="80"
                    r="8"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    className="animate-spin-ring origin-center"
                  />
                ) : (
                  /* Static/Listening mouth (neutral slightly curved line) */
                  <rect x="70" y="80" width="20" height="3" rx="1.5" fill="#10B981" />
                )}

                {/* Neopixel Neck connector */}
                <rect
                  x="72"
                  y="125"
                  width="16"
                  height="15"
                  rx="2"
                  fill="#1E293B"
                  stroke="#475569"
                  strokeWidth="1"
                />
                <line x1="75" y1="130" x2="85" y2="130" stroke="#6366F1" strokeWidth="2" />

                {/* Collar/Base */}
                <path
                  d="M35 145C35 140 50 135 80 135C110 135 125 140 125 145V155H35V145Z"
                  fill="#0F172A"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient
                    id="avatarHeadGrad"
                    x1="80"
                    y1="15"
                    x2="80"
                    y2="125"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#1E1B4B" />
                    <stop offset="1" stopColor="#0F172A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Avatar Status Label overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-400 z-10">
              {phase === 'speaking'
                ? 'AI Recruiter: Speaking'
                : phase === 'listening'
                  ? isRecording
                    ? 'Listening...'
                    : 'Microphone Ready'
                  : phase === 'processing'
                    ? 'AI Evaluation...'
                    : 'Offline'}
            </div>
          </div>

          {/* Mode Switch Panel */}
          <button
            onClick={toggleMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all shadow-md cursor-pointer"
          >
            {mode === 'avatar' ? (
              <>
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" /> Switch to Text Mode
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-purple-400" /> Switch to Voice Mode
              </>
            )}
          </button>
        </div>

        {/* Right Column: Question Card & Control Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> AuraRecruit Interview
              Session
            </h1>
            {mode === 'avatar' && (
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                Interactive Voice
              </span>
            )}
          </div>

          {/* Question Display Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.questionId || currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-3.5">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${catColor(currentQuestion?.category || 'general')}`}
                >
                  {(currentQuestion?.category || 'general').replace('_', ' ')}
                </span>
              </div>
              <p className="text-base font-semibold leading-relaxed text-slate-100">
                {displayQuestionText}
              </p>
            </motion.div>
          </AnimatePresence>


          {/* Input & Microphone Interactive Panel */}
          <div className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {/* TEXT MODE */}
            {mode === 'text' && phase === 'listening' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5"
              >
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your response here... Give a thorough, professional answer."
                  className="w-full min-h-[120px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 resize-y transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSubmitTextAnswer();
                    }
                  }}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-3.5">
                  <p className="text-[10px] text-slate-500">Press Ctrl+Enter to submit response</p>
                  <button
                    onClick={handleSubmitTextAnswer}
                    disabled={!textAnswer.trim()}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Response
                  </button>
                </div>
              </motion.div>
            )}

            {/* VOICE MODE */}
            {mode === 'avatar' && phase === 'listening' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-5"
              >
                {!isRecording ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    >
                      <Mic className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-200">Microphone Ready</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click the button above to start speaking your answer.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSubmitAudioAnswer}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 flex items-center justify-center shadow-xl shadow-red-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    >
                      <MicOff className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-red-400 animate-pulse flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Listening & Recording...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click the red button when you are finished speaking to submit your answer.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Evaluation/Processing Screen */}
            {phase === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3"
              >
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-300 font-medium">
                  Evaluating response content with AI recruiter...
                </p>
              </motion.div>
            )}

            {/* Speaking phase notification */}
            {phase === 'speaking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-5 flex items-center gap-3"
              >
                <Volume2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-300 leading-relaxed">
                  The AI recruiter is currently reading out the question. Please listen carefully.
                  Once completed, your microphone controls will automatically unlock.
                </p>
              </motion.div>
            )}
          </div>

          {/* Last Response Transcript Box */}
          {transcript && phase !== 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4.5 rounded-xl bg-slate-900/20 border border-slate-800/80"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Your Last Response
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
            </motion.div>
          )}

          {/* Question dot indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx < currentIndex
                    ? 'bg-emerald-500'
                    : idx === currentIndex
                      ? 'bg-indigo-500 scale-125 shadow-sm shadow-indigo-500/50'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
