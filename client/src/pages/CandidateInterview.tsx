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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_BASE = import.meta.env.VITE_AVATAR_SERVICE_URL || 'http://localhost:5002';

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

export function CandidateInterview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [finalResult, setFinalResult] = useState<any>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Poll timer ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the avatar session
  const startSession = useCallback(async () => {
    try {
      setPhase('loading');
      setError('');
      const res = await api.post(`/interview/${id}/start-avatar`);
      setSessionId(res.data.sessionId);
      setQuestions(res.data.questions || []);
      setCurrentIndex(0);
      // The first question is already queued by the server; poll for it
      pollForAction(res.data.sessionId);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to start interview session.';
      setError(msg);
      setPhase('error');
    }
  }, [id]);

  useEffect(() => {
    startSession();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopRecording();
    };
  }, [startSession]);

  // Poll the avatar-service for the next action
  const pollForAction = (sid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${AVATAR_BASE}/avatar/session/${sid}/next-action`);
        const action = await res.json();
        if (action.type === 'speak') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('speaking');
          // Play the audio if available
          if (action.audio) {
            const audio = new Audio(`data:audio/mp3;base64,${action.audio}`);
            audio.onended = () => setPhase('listening');
            audio.play().catch(() => setPhase('listening'));
          } else {
            // No real audio — simulate speaking delay
            const delay = Math.max(3000, (action.questionText?.length || 50) * 60);
            setTimeout(() => setPhase('listening'), delay);
          }
        } else if (action.type === 'listen') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('listening');
        }
      } catch {
        // keep polling
      }
    }, 1000);
  };

  // Start microphone recording
  const startRecording = async () => {
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
    } catch (err: any) {
      setError('Microphone access denied. Please allow microphone permissions.');
      setPhase('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Auto-start recording when phase becomes 'listening'
  useEffect(() => {
    if (phase === 'listening') {
      startRecording();
    }
  }, [phase]);

  // Submit the recorded audio
  const handleSubmitAnswer = async () => {
    setPhase('processing');
    stopRecording();

    // Give MediaRecorder a moment to finalize
    await new Promise((r) => setTimeout(r, 300));

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
        // The server /answer endpoint will handle timeout
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
          // Move to next question
          setCurrentIndex(res.data.currentQuestionIndex);
          // Poll for the next speak action
          pollForAction(sessionId);
        }
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || 'Failed to process answer.';
        setError(msg);
        setPhase('error');
      }
    };
    reader.readAsDataURL(blob);
  };

  // Category badge color
  const catColor = (cat: string) => {
    switch (cat) {
      case 'technical': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'behavioral': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'situational': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'culture_fit': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const currentQuestion = questions[currentIndex];

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
          <p className="text-slate-400 mb-8">Your responses have been recorded and evaluated by our AI system.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Interview Score</p>
              <p className="text-2xl font-bold text-indigo-400">
                {Math.round(finalResult.overallInterviewScore || 0)}<span className="text-sm text-slate-500">/100</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Final Score</p>
              <p className="text-2xl font-bold text-emerald-400">
                {finalResult.finalWeightedScore || 0}<span className="text-sm text-slate-500">/100</span>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-lg font-bold capitalize text-amber-300">
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

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs text-indigo-400 font-semibold">
              {Math.round(((currentIndex + (phase === 'processing' ? 1 : 0)) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentIndex + (phase === 'processing' ? 1 : 0)) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-8 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-2xl mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${catColor(currentQuestion.category)}`}>
                    {currentQuestion.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-lg font-semibold leading-relaxed text-slate-100">
                {currentQuestion.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase indicator */}
        <div className="flex flex-col items-center gap-6">
          {/* SPEAKING phase */}
          {phase === 'speaking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-indigo-400" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <p className="text-sm text-slate-400 font-medium">AI Interviewer is speaking...</p>
            </motion.div>
          )}

          {/* LISTENING phase */}
          {phase === 'listening' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="relative">
                <button
                  onClick={handleSubmitAnswer}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-shadow cursor-pointer group"
                >
                  <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                </button>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-400/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-red-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording your answer...
                </p>
                <p className="text-xs text-slate-500 mt-1">Click the microphone button when you&apos;re done</p>
              </div>
            </motion.div>
          )}

          {/* PROCESSING phase */}
          {phase === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Analyzing your response...</p>
            </motion.div>
          )}

          {/* READY phase */}
          {phase === 'ready' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              <p className="text-sm text-slate-400 font-medium">Preparing next question...</p>
            </motion.div>
          )}
        </div>

        {/* Transcript display (last answer) */}
        {transcript && phase !== 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 rounded-xl bg-slate-900/30 border border-slate-800"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Your Last Response
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
          </motion.div>
        )}

        {/* Question dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {questions.map((q, idx) => (
            <div
              key={q.questionId}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                idx < currentIndex
                  ? 'bg-emerald-500'
                  : idx === currentIndex
                    ? 'bg-indigo-500 scale-125'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
