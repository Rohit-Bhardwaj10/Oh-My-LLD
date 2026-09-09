'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle, Loader2, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

const SERVER = 'http://localhost:4000';
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/8 glass shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/problems/${problemId}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 text-sm font-medium">{problem.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg glass hover:bg-white/10 text-sm font-medium text-slate-200 transition-all disabled:opacity-50"
          >
            {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             saveStatus === 'saved'  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
             <Save className="w-3.5 h-3.5" />}
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || attemptStatus !== 'DRAFT'}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {attemptStatus === 'DRAFT' ? 'Submit for Evaluation' : 'Submitted'}
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR — Problem context */}
        <aside style={{ width: sidebarWidth }} className="shrink-0 flex flex-col overflow-hidden relative border-r border-white/8">
          
          {/* Top minimal navigation */}
          <div className="flex items-center justify-center gap-4 py-4 border-b border-white/8 shrink-0">
            <button
              onClick={() => canGoBack && setActiveStage(STAGES[activeIndex - 1])}
              disabled={!canGoBack}
              className="text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2 items-center">
              {STAGES.map((stage, i) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  title={STAGE_META[stage].label}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeStage === stage ? 'bg-violet-400 ring-2 ring-violet-500/30 w-2.5 h-2.5' : 'bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => canGoNext && setActiveStage(STAGES[activeIndex + 1])}
              disabled={!canGoNext}
              className="text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stage instructions */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="text-left">
              <span className="inline-flex px-3 py-1 bg-white/5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-4">
                {STAGE_META[activeStage].label}
              </span>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-medium">
                {STAGE_META[activeStage].prompt}
              </p>
            </div>

            <div className="border-t border-white/8 pt-6 text-left">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Problem Context
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">{problem.description}</p>
            </div>

            {problem.requirements?.length > 0 && (
              <div className="text-left">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {problem.requirements.map((r, i) => (
                    <li key={i} className="flex gap-3 text-xs text-slate-400">
                      <span className="text-violet-500 font-bold shrink-0">{i + 1}.</span>
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
          className="w-1 cursor-col-resize bg-transparent hover:bg-violet-500/50 active:bg-violet-500 shrink-0 transition-colors z-10"
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* RIGHT — Editor or Evaluation */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f17]">
          {evaluation ? (
            // Evaluation Results View
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-white/8">
                  <h2 className="text-xl font-bold text-slate-200">Evaluation Results</h2>
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium uppercase tracking-wider">
                    Completed
                  </div>
                </div>
                
                {evaluation.map((res: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest">{res.stageType}</h3>
                    <div className="grid gap-4">
                      {res.feedback.map((item: any, j: number) => (
                        <div key={j} className="p-4 rounded-xl glass border border-white/8 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300">{item.criterion}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.score >= 4 ? 'bg-emerald-500/20 text-emerald-300' : item.score === 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                              {item.score}/5
                            </span>
                          </div>
                          {item.evidence && (
                            <div className="pl-3 border-l-2 border-white/10 text-sm text-slate-400 font-mono">
                              "{item.evidence}"
                            </div>
                          )}
                          <p className="text-sm text-slate-300">{item.concern}</p>
                          {item.suggestion && (
                            <p className="text-sm text-emerald-400/90 flex gap-2">
                              <span className="shrink-0">💡</span> {item.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Editor View
            <>
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/8 shrink-0">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  {STAGE_META[activeStage].label}
                </span>
                <span className="text-xs text-slate-600 tabular-nums">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </div>
    
              <textarea
                key={activeStage}
                value={contents[activeStage]}
                onChange={(e) => setContents((prev) => ({ ...prev, [activeStage]: e.target.value }))}
                placeholder={STAGE_META[activeStage].placeholder}
                className="flex-1 w-full bg-transparent text-slate-200 placeholder-slate-700 text-sm font-mono leading-7 resize-none outline-none px-8 py-6 caret-violet-400"
                spellCheck={false}
                disabled={attemptStatus !== 'DRAFT'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
