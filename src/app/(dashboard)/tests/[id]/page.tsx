"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Highlighter, X, Play, Pause } from "lucide-react";
import { Test, Question } from "@/types";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Highlight { id: string; start: number; end: number; color: string; }
interface TooltipState { x: number; y: number; start: number; end: number; }
interface WordPopup {
  word: string;
  x: number;
  y: number;
  loading: boolean;
  translation?: string;
  definition?: string;
  partOfSpeech?: string;
  synonyms?: string[];
}

const HIGHLIGHT_COLORS = [
  { bg: "#FEF08A", label: "Yellow", border: "#EAB308" },
  { bg: "#86EFAC", label: "Green",  border: "#22C55E" },
  { bg: "#FCA5A5", label: "Red",    border: "#EF4444" },
];

// ─── Timer ───────────────────────────────────────────────
function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const expiredRef = useRef(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setRemaining((s) => {
        if (s <= 1) { clearInterval(id); if (!expiredRef.current) { expiredRef.current = true; onExpire(); } return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const urgent = remaining < 300;
  const warning = remaining < 600;
  return (
    <button onClick={() => setPaused((p) => !p)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold transition-colors cursor-pointer select-none ${urgent ? "text-red-600 animate-pulse" : warning ? "text-amber-600" : "text-gray-700"}`}>
      {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </button>
  );
}

// ─── Highlight helpers ────────────────────────────────────
function getCharOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let count = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node === targetNode) return count + targetOffset;
    count += node.length;
  }
  return count;
}

const WORD_RE = /[a-zA-Z'-]+/g;

function wrapWords(str: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  WORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(str)) !== null) {
    if (m.index > last) nodes.push(str.slice(last, m.index));
    nodes.push(
      <span key={`${keyBase}-${m.index}`}
        className="rounded-sm transition-colors duration-75 hover:bg-green-900 hover:text-white cursor-pointer">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < str.length) nodes.push(str.slice(last));
  return nodes;
}

function renderWithHighlights(text: string, highlights: Highlight[], onRemove: (id: string) => void): React.ReactNode[] {
  if (!highlights.length) return [text];
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const h of sorted) {
    if (h.start < pos) continue;
    if (h.start > pos) parts.push(text.slice(pos, h.start));
    parts.push(
      <mark key={h.id} style={{ backgroundColor: h.color }}
        className="cursor-pointer rounded-sm px-0.5 hover:opacity-75 transition-opacity"
        title="Click to remove"
        onClick={(e) => { e.stopPropagation(); onRemove(h.id); }}>
        {text.slice(h.start, h.end)}
      </mark>
    );
    pos = h.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts;
}

function renderPassage(text: string, highlights: Highlight[], onRemove: (id: string) => void): React.ReactNode {
  let domOffset = 0;
  return text.split(/\n\n+/).map((para, pi) => {
    const match  = para.match(/^([A-Z])\s+([\s\S]*)$/);
    const letter = match ? match[1] : null;
    const body   = match ? match[2] : para;
    const letterLen = letter ? 1 : 0; // strong text node = 1 char in DOM
    const bodyStart = domOffset + letterLen;
    const bodyEnd   = bodyStart + body.length;

    // remap highlight offsets to be relative to this paragraph's body
    const paraHighlights = highlights
      .filter((h) => h.start < bodyEnd && h.end > bodyStart)
      .map((h) => ({ ...h, start: Math.max(0, h.start - bodyStart), end: Math.min(body.length, h.end - bodyStart) }));

    domOffset += letterLen + body.length;
    return (
      <p key={pi} className="mb-5">
        {letter && <strong className="mr-1.5 font-extrabold">{letter}</strong>}
        {renderWithHighlights(body, paraHighlights, onRemove)}
      </p>
    );
  });
}

// ─── QuestionBlock ────────────────────────────────────────
function QuestionBlock({ question, answer, onChange, flagged, onFlag, qHighlights, onRemoveQHighlight }: {
  question: Question; answer: string; onChange: (v: string) => void;
  flagged: boolean; onFlag: () => void;
  qHighlights: Highlight[]; onRemoveQHighlight: (hid: string) => void;
}) {
  const opts = question.options as string[] | undefined;
  return (
    <div className="mb-8">
      {/* Number + question text */}
      <div className="flex items-start gap-3 mb-3">
        <button onClick={onFlag} title="Flag for review"
          className={`flex-shrink-0 text-sm font-bold leading-relaxed transition-colors ${flagged ? "text-amber-500" : "text-black"}`}>
          {question.order}
        </button>
        <p data-qid={question.id} className="text-sm text-black leading-relaxed select-text">
          {renderWithHighlights(question.questionText, qHighlights, onRemoveQHighlight)}
        </p>
      </div>

      {/* TRUE / FALSE / NOT GIVEN */}
      {question.type === "TRUE_FALSE_NG" && (
        <div className="ml-6 space-y-2">
          {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-3">
              <input type="radio" name={question.id} value={opt} checked={answer === opt}
                onChange={() => onChange(opt)} className="h-4 w-4 cursor-pointer accent-gray-800 flex-shrink-0" />
              <span className="text-sm text-black">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* MULTIPLE CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && opts && (
        <div className="ml-6 space-y-2">
          {opts.map((opt) => (
            <label key={opt} className="flex cursor-pointer items-start gap-3">
              <input type="radio" name={question.id} value={opt[0]} checked={answer === opt[0]}
                onChange={() => onChange(opt[0])} className="mt-0.5 h-4 w-4 cursor-pointer accent-gray-800 flex-shrink-0" />
              <span className="text-sm text-black">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* FILL IN BLANK / SHORT ANSWER */}
      {(question.type === "FILL_IN_BLANK" || question.type === "SHORT_ANSWER") && (
        <div className="ml-6">
          <input type="text" value={answer} onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer…"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-500 transition w-full max-w-xs" />
        </div>
      )}

      {/* MATCHING HEADINGS */}
      {question.type === "MATCHING_HEADINGS" && opts && (
        <div className="ml-6 space-y-2">
          {opts.map((opt) => {
            const key = opt.split("–")[0].trim();
            return (
              <label key={opt} className="flex cursor-pointer items-start gap-3">
                <input type="radio" name={question.id} value={key} checked={answer === key}
                  onChange={() => onChange(key)} className="mt-0.5 h-4 w-4 cursor-pointer accent-gray-800 flex-shrink-0" />
                <span className="text-sm text-black">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* MATCHING INFO */}
      {question.type === "MATCHING_INFO" && opts && (
        <div className="ml-6 flex flex-wrap gap-2">
          {opts.map((opt) => (
            <label key={opt} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded border text-sm font-bold transition-all ${answer === opt ? "border-black bg-black text-white" : "border-gray-300 text-black hover:border-gray-500"}`}>
              <input type="radio" name={question.id} value={opt} checked={answer === opt}
                onChange={() => onChange(opt)} className="sr-only" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
const FONT_SIZES = [11, 13, 14, 15, 16, 18, 20, 22];
const DEFAULT_FONT_IDX = 3;

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest]           = useState<Test | null>(null);
  const [resultId, setResultId]   = useState<string | null>(null);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [activePassage, setActivePassage] = useState(0);
  const [started, setStarted]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlights, setHighlights]           = useState<Record<string, Highlight[]>>({});
  const [questionHighlights, setQuestionHighlights] = useState<Record<string, Highlight[]>>({});
  const [tooltip, setTooltip]               = useState<TooltipState | null>(null);
  const tooltipSourceRef = useRef<"passage" | string>("passage");
  const [flagged, setFlagged]     = useState<Set<string>>(new Set());
  const [fontIdx, setFontIdx]     = useState(DEFAULT_FONT_IDX);
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null);
  const passageRef   = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const passageIdRef = useRef<string>("");
  const isDragging   = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(52);
  const fontSize = FONT_SIZES[fontIdx];

  useEffect(() => { api.get(`/tests/${id}`).then((r) => setTest(r.data)); }, [id]);

  // drag-to-resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLeftPct(Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  // unified highlight selection handler
  useEffect(() => {
    const showTooltip = (start: number, end: number, rect: DOMRect, src: string) => {
      tooltipSourceRef.current = src;
      setTooltip({
        x: Math.max(60, Math.min(rect.left + rect.width / 2, window.innerWidth - 60)),
        y: Math.max(10, rect.top - 54),
        start,
        end,
      });
    };

    const onUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-highlight-toolbar]")) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setTooltip(null); return; }
      const range = sel.getRangeAt(0);
      const ancestor = range.commonAncestorContainer;

      // passage
      if (passageRef.current?.contains(ancestor)) {
        const start = getCharOffset(passageRef.current, range.startContainer, range.startOffset);
        const end   = getCharOffset(passageRef.current, range.endContainer, range.endOffset);
        if (start >= end) { setTooltip(null); return; }
        showTooltip(start, end, range.getBoundingClientRect(), "passage");
        return;
      }

      // question text
      const el = (ancestor.nodeType === Node.TEXT_NODE
        ? (ancestor as Text).parentElement
        : ancestor as HTMLElement);
      const qEl = el?.closest("[data-qid]") as HTMLElement | null;
      if (qEl) {
        const start = getCharOffset(qEl, range.startContainer, range.startOffset);
        const end   = getCharOffset(qEl, range.endContainer, range.endOffset);
        if (start >= end) { setTooltip(null); return; }
        showTooltip(start, end, range.getBoundingClientRect(), qEl.dataset.qid!);
        return;
      }

      setTooltip(null);
    };

    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-highlight-toolbar]")) setTooltip(null);
      if (!t.closest("[data-word-popup]")) setWordPopup(null);
    };

    document.addEventListener("mouseup", onUp);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  async function handleWordClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't trigger if user was selecting text
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

    // Get word at click position
    const range = document.caretRangeFromPoint
      ? document.caretRangeFromPoint(e.clientX, e.clientY)
      : null;
    if (!range) return;

    // expand to word boundaries manually
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent ?? "";
    let start = range.startOffset;
    let end = range.startOffset;
    while (start > 0 && /[a-zA-Z'-]/.test(text[start - 1])) start--;
    while (end < text.length && /[a-zA-Z'-]/.test(text[end])) end++;
    range.setStart(node, start);
    range.setEnd(node, end);
    const word = text.slice(start, end).trim();
    if (!word || word.length < 2) return;

    const rect = range.getBoundingClientRect();
    const x = Math.max(160, Math.min(rect.left + rect.width / 2, window.innerWidth - 160));
    const y = rect.bottom + window.scrollY + 8;

    setWordPopup({ word, x, y, loading: true });

    try {
      const [transRes, dictRes] = await Promise.all([
        fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uz&dt=t&q=${encodeURIComponent(word)}`),
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`),
      ]);

      const transData = await transRes.json();
      const translation = transData?.[0]?.[0]?.[0] || "";

      let definition = "";
      let partOfSpeech = "";
      let synonyms: string[] = [];

      if (dictRes.ok) {
        const dictData = await dictRes.json();
        const meanings = dictData[0]?.meanings ?? [];
        const firstMeaning = meanings[0];
        partOfSpeech = firstMeaning?.partOfSpeech || "";
        definition   = firstMeaning?.definitions?.[0]?.definition || "";

        // collect synonyms from all meanings + all definitions
        const synSet = new Set<string>();
        for (const m of meanings) {
          for (const s of m.synonyms ?? []) synSet.add(s);
          for (const d of m.definitions ?? []) {
            for (const s of d.synonyms ?? []) synSet.add(s);
          }
        }
        synonyms = [...synSet].slice(0, 8);
      }

      setWordPopup({ word, x, y, loading: false, translation, definition, partOfSpeech, synonyms });
    } catch {
      setWordPopup(null);
    }
  }

  function addHighlight(color: string) {
    if (!tooltip) return;
    const src = tooltipSourceRef.current;
    const newH = { id: Date.now().toString(), start: tooltip.start, end: tooltip.end, color };
    if (src === "passage") {
      const pid = passageIdRef.current;
      setHighlights((prev) => ({ ...prev, [pid]: [...(prev[pid] ?? []).filter((h) => h.end <= tooltip.start || h.start >= tooltip.end), newH] }));
    } else {
      setQuestionHighlights((prev) => ({ ...prev, [src]: [...(prev[src] ?? []).filter((h) => h.end <= tooltip.start || h.start >= tooltip.end), newH] }));
    }
    setTooltip(null); window.getSelection()?.removeAllRanges();
  }
  function removeHighlight(hid: string) {
    const pid = passageIdRef.current;
    setHighlights((prev) => ({ ...prev, [pid]: (prev[pid] ?? []).filter((h) => h.id !== hid) }));
  }
  function removeQuestionHighlight(qid: string, hid: string) {
    setQuestionHighlights((prev) => ({ ...prev, [qid]: (prev[qid] ?? []).filter((h) => h.id !== hid) }));
  }

  async function handleStart() {
    const { data } = await api.post("/results/start", { testId: id });
    setResultId(data.id); startTimeRef.current = Date.now(); setStarted(true);
  }

  const handleSubmit = useCallback(async () => {
    if (!resultId || submitting) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await api.post(`/results/${resultId}/submit`, { answers: Object.entries(answers).map(([questionId, userAnswer]) => ({ questionId, userAnswer })), timeSpent });
      toast.success("Test submitted!"); router.push(`/results/${resultId}`);
    } catch { toast.error("Something went wrong"); setSubmitting(false); }
  }, [resultId, submitting, answers, router]);

  if (!test) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" /></div>;

  const allQuestions  = (test.passages ?? []).flatMap((p) => p.questions);
  const answeredCount = Object.values(answers).filter(Boolean).length;

  // Pre-test
  if (!started) {
    const passages = test.passages ?? [];
    return (
      <div className="flex h-full items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-base font-bold text-black">{test.title}</h1>
          <p className="mb-5 text-xs text-gray-400">{test.timeLimit} min · {passages.length} passage{passages.length !== 1 ? "s" : ""} · {allQuestions.length} questions</p>
          {passages.length > 0 && (
            <div className="mb-5 space-y-1.5">
              {passages.map((p, pi) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-400">{pi + 1}.</span>
                  <span className="truncate">{p.title}</span>
                  <span className="ml-auto text-gray-400">{p.questions.length}Q</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleStart} className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white hover:bg-gray-800 transition">Start Test →</button>
          <p className="mt-3 text-center text-[11px] text-gray-400">Timer starts immediately</p>
        </div>
      </div>
    );
  }

  const passages = test.passages ?? [];
  const passage  = passages[activePassage];
  passageIdRef.current = passage.id;
  const passageHighlights = highlights[passage.id] ?? [];
  const firstQ = passage.questions[0];
  const lastQ  = passage.questions[passage.questions.length - 1];
  const isTFNG = passage.questions.every((q) => q.type === "TRUE_FALSE_NG");
  const isFIB  = passage.questions.every((q) => q.type === "FILL_IN_BLANK" || q.type === "SHORT_ANSWER");
  const isMC   = passage.questions.every((q) => q.type === "MULTIPLE_CHOICE");
  const isMH   = passage.questions.every((q) => q.type === "MATCHING_HEADINGS");
  const isMI   = passage.questions.every((q) => q.type === "MATCHING_INFO");

  return (
    <div className="flex h-full flex-col bg-white">

      {/* Word popup */}
      {wordPopup && (
        <div
          data-word-popup
          style={{ position: "fixed", left: wordPopup.x, top: wordPopup.y, transform: "translateX(-50%)", zIndex: 998 }}
          className="w-72 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div>
              <span className="font-bold text-black text-base">{wordPopup.word}</span>
              {wordPopup.partOfSpeech && (
                <span className="ml-2 text-xs italic text-gray-400">{wordPopup.partOfSpeech}</span>
              )}
            </div>
            <button onClick={() => setWordPopup(null)} className="text-gray-400 hover:text-black transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {wordPopup.loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {/* Uzbek translation */}
              {wordPopup.translation && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">O'zbekcha</p>
                  <p className="text-sm font-semibold text-black">{wordPopup.translation}</p>
                </div>
              )}
              {/* Definition */}
              {wordPopup.definition && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Definition</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{wordPopup.definition}</p>
                </div>
              )}
              {/* Synonyms */}
              {wordPopup.synonyms && wordPopup.synonyms.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Synonyms</p>
                  <div className="flex flex-wrap gap-1">
                    {wordPopup.synonyms.map((s) => (
                      <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Highlight tooltip */}
      {tooltip && (
        <div data-highlight-toolbar style={{ position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)", zIndex: 999 }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 shadow-2xl">
          <Highlighter className="h-3.5 w-3.5 text-slate-400" />
          {HIGHLIGHT_COLORS.map(({ bg, label, border }) => (
            <button key={bg} onClick={() => addHighlight(bg)} title={`Highlight ${label}`}
              style={{ backgroundColor: bg, borderColor: border }}
              className="h-5 w-5 rounded-full border-2 hover:scale-125 transition-transform" />
          ))}
          <div className="mx-1 h-4 w-px bg-slate-600" />
          <button onClick={() => setTooltip(null)} className="text-slate-400 hover:text-white transition"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Top bar — minimal */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-8 py-2.5">
        <span className="text-sm font-semibold text-black">{test.title}</span>
        <div className="flex items-center gap-3">
          <Timer seconds={test.timeLimit * 60} onExpire={handleSubmit} />
          {/* Font size */}
          <div className="flex items-center gap-0.5 rounded border border-gray-200 px-1 py-0.5">
            <button onClick={() => setFontIdx((i) => Math.max(0, i - 1))} disabled={fontIdx === 0}
              className="flex h-5 w-5 items-center justify-center text-xs font-bold text-gray-400 disabled:opacity-30 hover:text-black transition">
              A<span className="text-[8px]">−</span>
            </button>
            <button onClick={() => setFontIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))} disabled={fontIdx === FONT_SIZES.length - 1}
              className="flex h-5 w-5 items-center justify-center text-xs font-bold text-gray-400 disabled:opacity-30 hover:text-black transition">
              A<span className="text-[10px]">+</span>
            </button>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="rounded-lg border border-gray-200 px-5 py-1.5 text-sm font-semibold text-black hover:bg-gray-50 disabled:opacity-50 transition">
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      {/* Two-column content */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left — passage */}
        <div className="overflow-y-auto"
          style={{ width: `${leftPct}%`, fontSize: `${fontSize}px` }}>
          <div className="mx-auto w-[95%] px-4 py-10 leading-8 font-medium text-black">
            <p className="mb-1 text-sm font-bold uppercase tracking-wide text-black">PASSAGE {passage.order}</p>
            <p className="mb-6 text-xs text-gray-500 leading-relaxed">
              You should spend about {test.timeLimit} minutes on Questions {firstQ?.order}–{lastQ?.order}, which are based on Reading Passage {passage.order} below.
            </p>
            <h2 className="mb-7 text-center font-bold leading-snug text-black" style={{ fontSize: `${fontSize + 2}px` }}>
              {passage.title}
            </h2>
            <div
              ref={passageRef}
              style={{ userSelect: "text" }}
              className="selection:bg-yellow-200 cursor-pointer"
              onClick={handleWordClick}
            >
              {renderPassage(passage.content, passageHighlights, removeHighlight)}
            </div>
          </div>
        </div>

        {/* Drag handle */}
        <div onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
          className="w-px flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-gray-300 transition-colors" />

        {/* Right — questions */}
        <div className="flex-1 overflow-y-auto px-10 py-8">

          {/* Questions header */}
          <p className="mb-3 text-base font-bold text-black">Questions {firstQ?.order}–{lastQ?.order}</p>

          {/* Instructions */}
          {isTFNG && (
            <div className="mb-6 text-sm text-black space-y-1">
              <p>Do the following statements agree with the information given in the text?</p>
              <p className="mt-1">In boxes {firstQ?.order}–{lastQ?.order} on your answer sheet, choose</p>
              <div className="mt-3 space-y-1.5">
                <p><strong>TRUE</strong><span className="ml-6 italic text-gray-600">if the statement agrees with the information</span></p>
                <p><strong>FALSE</strong><span className="ml-4 italic text-gray-600">if the statement contradicts the information</span></p>
                <p><strong>NOT GIVEN</strong><span className="ml-2 italic text-gray-600">if there is no information on this</span></p>
              </div>
            </div>
          )}
          {isFIB && (
            <div className="mb-6 text-sm text-black space-y-1">
              <p>Complete the sentences below.</p>
              {firstQ?.instruction && <p>Choose <strong>{firstQ.instruction}</strong> for each answer.</p>}
            </div>
          )}
          {isMC && <p className="mb-6 text-sm text-black">Choose the correct letter, <strong>A</strong>, <strong>B</strong>, <strong>C</strong> or <strong>D</strong>.</p>}
          {isMH && (
            <div className="mb-6 text-sm text-black space-y-1">
              <p>The reading passage has several paragraphs.</p>
              <p>Choose the correct heading for each paragraph from the list.</p>
            </div>
          )}
          {isMI && <p className="mb-6 text-sm text-black">Match each statement with the correct paragraph letter.</p>}
          {!isTFNG && !isFIB && !isMC && !isMH && !isMI && firstQ?.instruction && (
            <p className="mb-6 text-sm text-black">{firstQ.instruction}</p>
          )}

          <div className="h-px bg-gray-100 mb-6" />

          {/* Question list */}
          {passage.questions.map((q, idx) => {
            const prevInstr = idx > 0 ? passage.questions[idx - 1].instruction : null;
            const showInstr = !isTFNG && q.instruction && q.instruction !== prevInstr && idx > 0;
            return (
              <div key={q.id}>
                {showInstr && <p className="mb-3 mt-1 text-sm text-black">{q.instruction}</p>}
                <QuestionBlock
                  question={q}
                  answer={answers[q.id] ?? ""}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  flagged={flagged.has(q.id)}
                  onFlag={() => setFlagged((prev) => {
                    const next = new Set(prev);
                    next.has(q.id) ? next.delete(q.id) : next.add(q.id);
                    return next;
                  })}
                  qHighlights={questionHighlights[q.id] ?? []}
                  onRemoveQHighlight={(hid) => removeQuestionHighlight(q.id, hid)}
                />
              </div>
            );
          })}
          <div className="h-16" />
        </div>
      </div>

      {/* Bottom — passage tabs */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-8 py-3">
        <span className="text-xs text-gray-400">{answeredCount}/{allQuestions.length} answered</span>

        <div className="flex items-center gap-1 rounded-full border border-gray-200 p-0.5">
          {passages.map((p, i) => {
            const done = p.questions.filter((q) => answers[q.id]).length;
            const active = activePassage === i;
            return (
              <button key={p.id} onClick={() => setActivePassage(i)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${active ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"}`}>
                {i + 1}
                <span className={`text-xs font-normal ${active ? "text-gray-300" : "text-gray-400"}`}>{done}/{p.questions.length}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-1">
          {allQuestions.map((q) => (
            <div key={q.id} title={`Q${q.order}`}
              className={`h-2 w-2 rounded-full border transition-colors ${flagged.has(q.id) ? "border-amber-400 bg-amber-300" : answers[q.id] ? "border-black bg-black" : "border-gray-200 bg-white"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
