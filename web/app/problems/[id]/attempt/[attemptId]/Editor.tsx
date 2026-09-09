'use client';

import { useEffect, useRef, useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle, Loader2, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import SimpleEditor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme for prism
import { startAttempt } from '../../actions';

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
const AUTO_SAVE_INTERVAL = 30_000;

interface Stage {
  stageType: 'REQUIREMENTS' | 'DESIGN' | 'EXTENSION';
  content: string;
  status: string;
}

interface Attempt {
  id: string;
  problemId: string;
  status: string;
  stages: Stage[];
  evaluation?: any;
}

interface Problem {
  title: string;
  description: string;
  requirements: string[];
  constraints: string[];
}

const STAGES = ['REQUIREMENTS', 'DESIGN', 'EXTENSION'] as const;
type StageType = typeof STAGES[number];

const STAGE_META: Record<StageType, { label: string; prompt: string; placeholder: string }> = {
  REQUIREMENTS: {
    label: 'Requirements',
    prompt: `Start by clarifying what you need to build.

Ask yourself:
• What are the core functional requirements?
• What assumptions can you make?
• What is explicitly out of scope?

List your final requirements clearly, one per line.`,
    placeholder: `// ---------------------------------------------------------
// REQUIREMENTS & ASSUMPTIONS
// ---------------------------------------------------------
//
// Example (Elevator System):
//   1. The system supports multiple elevators in a building.
//   2. Each elevator can hold up to N passengers.
//   3. Users can request an elevator from any floor.
//   4. The system dispatches the nearest available elevator.
//
//   Assumptions:
//   - All elevators start at floor 1.
//   - No emergency/fire mode needed.
//
//   Out of Scope:
//   - Real-time monitoring dashboard.
//   - Physical door sensor simulation.
//
// ---------------------------------------------------------
// Write your requirements below:
// ---------------------------------------------------------

`,
  },
  DESIGN: {
    label: 'Class Design',
    prompt: `Design the classes, interfaces, and relationships.

Think about:
• What are the core entities in this system?
• What responsibilities does each class own?
• What design patterns apply here?
• How do the classes interact with each other?`,
    placeholder: `// ---------------------------------------------------------
// ENTITIES & RELATIONSHIPS
// ---------------------------------------------------------
//
// Example (Elevator System):
//   Elevator, Floor, Request, ElevatorController, Direction
//
// ---------------------------------------------------------
// CLASS DESIGN
// ---------------------------------------------------------
//
// Example (Elevator System):
//
//   enum Direction { UP, DOWN, IDLE }
//
//   class Request {
//     floor: int
//     direction: Direction
//   }
//
//   class Elevator {
//     id: int
//     currentFloor: int
//     state: Direction
//     queue: List<Request>
//     + move(): void
//     + addRequest(r: Request): void
//   }
//
//   class ElevatorController {
//     elevators: List<Elevator>
//     + dispatch(request: Request): Elevator
//     + selectNearest(floor: int): Elevator
//   }
//
// ---------------------------------------------------------
// Write your class design below:
// ---------------------------------------------------------

`,
  },
  EXTENSION: {
    label: 'Extension & Trade-offs',
    prompt: `Extend your design to handle real-world concerns.

Think about:
• What happens at scale (1M users, 100k req/s)?
• What are the concurrency or consistency challenges?
• What trade-offs did you make and why?
• What would you change with more time?`,
    placeholder: `// ---------------------------------------------------------
// EXTENSION & TRADE-OFFS
// ---------------------------------------------------------
//
// Example (Elevator System):
//
//   Scale:
//   - With 100+ floors, the dispatch algorithm becomes a hotspot.
//   - Solution: Zone elevators to floor ranges (1-10, 11-20, etc.)
//
//   Concurrency:
//   - Multiple requests can arrive simultaneously.
//   - Use a priority queue per elevator (thread-safe).
//
//   Trade-offs:
//   - SCAN algorithm is simple but inefficient for sparse traffic.
//   - Zoning reduces flexibility but improves throughput.
//
//   What I'd improve:
//   - Add a machine-learning dispatcher trained on traffic patterns.
//   - Predictive pre-positioning during peak hours.
//
// ---------------------------------------------------------
// Write your extension analysis below:
// ---------------------------------------------------------

`,
  },
};

interface EditorProps {
  attemptId: string;
  problemId: string;
  problem: Problem;
}

export function Editor({ attemptId, problemId, problem }: EditorProps) {
  const [contents, setContents] = useState<Record<StageType, string>>({
    REQUIREMENTS: '',
    DESIGN: '',
    EXTENSION: '',
  });
  const [activeStage, setActiveStage] = useState<StageType>('REQUIREMENTS');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [attemptStatus, setAttemptStatus] = useState<string>('DRAFT');
  const [sidebarWidth, setSidebarWidth] = useState(340); // Resizable sidebar width
  const [isPending, startTransition] = useTransition();
  const [resultTab, setResultTab] = useState<'evaluation' | 'submission'>('evaluation');

  const contentsRef = useRef(contents);
  contentsRef.current = contents;
  const isDragging = useRef(false);

  useEffect(() => {
    fetch(`${SERVER}/api/attempts/${attemptId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { attempt: Attempt }) => {
        const map: Record<string, string> = {};
        data.attempt.stages.forEach((s) => { map[s.stageType] = s.content; });
        setContents({
          REQUIREMENTS: map['REQUIREMENTS'] || STAGE_META['REQUIREMENTS'].placeholder,
          DESIGN: map['DESIGN'] || STAGE_META['DESIGN'].placeholder,
          EXTENSION: map['EXTENSION'] || STAGE_META['EXTENSION'].placeholder,
        });
        setAttemptStatus(data.attempt.status);
        if (data.attempt.evaluation) {
          setEvaluation(data.attempt.evaluation.results);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [attemptId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.max(250, Math.min(e.clientX, 800)); // Constrain width
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const saveStage = useCallback(async (type: StageType, content: string) => {
    await fetch(`${SERVER}/api/attempts/${attemptId}/stages`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageType: type, content }),
    });
  }, [attemptId]);

  const saveAll = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await Promise.all(
        STAGES.map((type) => saveStage(type, contentsRef.current[type]))
      );
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [saveStage]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && attemptStatus === 'DRAFT') saveAll();
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [loading, saveAll, attemptStatus]);

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You cannot edit this attempt after submitting.')) return;
    
    // Auto-save first
    await saveAll();
    
    setSubmitting(true);
    try {
      const res = await fetch(`${SERVER}/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to submit evaluation');
      } else {
        setEvaluation(data.evaluation.results);
        setAttemptStatus('COMPLETED');
      }
    } catch (err) {
      alert('An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeIndex = STAGES.indexOf(activeStage);
  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < STAGES.length - 1;
  const wordCount = contents[activeStage].trim().split(/\s+/).filter(Boolean).length;

  const handlePrimaryAction = () => {
    if (canGoNext) {
      setActiveStage(STAGES[activeIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to Save Draft
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (attemptStatus === 'DRAFT') {
          saveAll();
        }
      }
      
      // Cmd/Ctrl + Enter to Submit or Next
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (attemptStatus === 'DRAFT' && !submitting) {
          if (activeIndex < STAGES.length - 1) {
            setActiveStage(STAGES[activeIndex + 1]);
          } else {
            handleSubmit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attemptStatus, submitting, saveAll, activeIndex]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans selection:bg-white/20">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/problems/${problemId}`}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-white text-sm font-semibold">{problem.title}</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-white/10 text-white/80 border border-white/10">
            {attemptStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="flex items-center gap-1 text-xs text-white/50 font-mono">
              <Clock className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {attemptStatus === 'DRAFT' && (
            <button
              onClick={saveAll}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-white/5 text-sm font-medium text-white/90 transition-all disabled:opacity-50"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               saveStatus === 'saved'  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> :
               <Save className="w-3.5 h-3.5" />}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save Draft'}
            </button>
          )}
          {attemptStatus === 'COMPLETED' ? (
            <button
              onClick={() => startTransition(() => startAttempt(problemId))}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded bg-[#ff6b35] hover:bg-[#e05a2a] text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Re-attempt
            </button>
          ) : (
            <button
              onClick={handlePrimaryAction}
              disabled={submitting || attemptStatus !== 'DRAFT'}
              className="px-3.5 py-1.5 rounded bg-[#ff6b35] hover:bg-[#e05a2a] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && !canGoNext ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {attemptStatus === 'DRAFT' 
                ? (canGoNext ? 'Next (Cmd+Enter)' : 'Submit (Cmd+Enter)')
                : 'Submitted'}
            </button>
          )}
        </div>
      </header>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR — Problem context */}
        <aside style={{ width: sidebarWidth }} className="shrink-0 flex flex-col overflow-hidden relative border-r border-white/10 bg-[#0a0a0a]">
          
          {/* Top minimal navigation */}
          <div className="flex items-center justify-center gap-4 py-4 border-b border-white/10 shrink-0 bg-white/5">
            <button
              onClick={() => canGoBack && setActiveStage(STAGES[activeIndex - 1])}
              disabled={!canGoBack}
              className="text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2 items-center">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  title={STAGE_META[stage].label}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeStage === stage ? 'bg-[#ff6b35] ring-2 ring-[#ff6b35]/30 w-2.5 h-2.5' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => canGoNext && setActiveStage(STAGES[activeIndex + 1])}
              disabled={!canGoNext}
              className="text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stage instructions */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="text-left">
              <span className="inline-flex px-2 py-0.5 bg-white/5 rounded-sm border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4 font-mono">
                {STAGE_META[activeStage].label}
              </span>
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line font-medium">
                {STAGE_META[activeStage].prompt}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6 text-left">
              <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">
                Problem Context
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">{problem.description}</p>
            </div>

            {problem.requirements?.length > 0 && (
              <div className="text-left">
                <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {problem.requirements.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/70">
                      <span className="text-[#ff6b35] font-bold shrink-0">{i + 1}.</span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* DRAG HANDLE */}
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-white/10 active:bg-white/20 shrink-0 transition-colors z-10"
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* RIGHT — Editor or Evaluation */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          {evaluation && (
            <div className="flex items-center gap-8 border-b border-white/10 px-8 pt-6 shrink-0 bg-[#0a0a0a]">
              <button 
                onClick={() => setResultTab('evaluation')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${resultTab === 'evaluation' ? 'border-[#ff6b35] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
              >
                Evaluation Results
              </button>
              <button 
                onClick={() => setResultTab('submission')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${resultTab === 'submission' ? 'border-[#ff6b35] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
              >
                My Submission
              </button>
            </div>
          )}

          {evaluation && resultTab === 'evaluation' ? (
            // Evaluation Results View
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Evaluation Results</h2>
                  <div className="px-3 py-1 bg-white/5 text-[#ff6b35] border border-white/10 rounded text-xs font-bold uppercase tracking-wider font-mono">
                    Completed
                  </div>
                </div>
                
                {evaluation.map((res: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest border-b border-white/10 pb-2">{res.stageType}</h3>
                    <div className="grid gap-4">
                      {res.feedback.map((item: any, j: number) => {
                        const isPass = item.score >= 4;
                        const isWarn = item.score === 3;
                        return (
                          <div key={j} className="text-sm p-4 rounded-md border border-white/10 bg-white/5 space-y-3">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className={`font-mono text-xs font-bold ${isPass ? 'text-emerald-500' : isWarn ? 'text-amber-500' : 'text-red-500'}`}>
                                [{item.score}/5]
                              </span>
                              <strong className="text-white/90">{item.criterion}</strong>
                            </div>
                            {item.evidence && (
                              <div className="pl-3 border-l-2 border-white/20 text-xs text-white/60 font-mono bg-white/[0.02] py-1.5">
                                {item.evidence}
                              </div>
                            )}
                            <p className="text-white/80 leading-relaxed">{item.concern}</p>
                            {item.suggestion && (
                              <p className="text-white/50 italic flex gap-1 mt-2">
                                <span className="font-bold">↳</span> {item.suggestion}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Editor View
            <>
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/10 bg-white/5 shrink-0">
                <span className="text-xs font-bold font-mono text-white/50 uppercase tracking-wider">
                  {STAGE_META[activeStage].label}
                </span>
                <span className="text-xs font-mono text-white/50 tabular-nums">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </div>
    
              <div className="flex-1 overflow-y-auto">
                <SimpleEditor
                  key={activeStage}
                  value={contents[activeStage]}
                  onValueChange={(code) => setContents((prev) => ({ ...prev, [activeStage]: code }))}
                  highlight={(code) => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                  padding={24}
                  placeholder={STAGE_META[activeStage].placeholder}
                  className="font-mono text-sm leading-relaxed min-h-full text-white"
                  disabled={attemptStatus !== 'DRAFT'}
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                  textareaClassName="focus:outline-none focus:bg-white/5 transition-colors"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
