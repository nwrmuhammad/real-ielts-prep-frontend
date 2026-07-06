"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Highlighter, X, Play, Pause, ChevronLeft, Scan } from "lucide-react";
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
const BLANK_RE = /_{3,}|\.{3,}|…+/;

function QuestionBlock({ question, answer, onChange, flagged, onFlag, qHighlights, onRemoveQHighlight }: {
  question: Question; answer: string; onChange: (v: string) => void;
  flagged: boolean; onFlag: () => void;
  qHighlights: Highlight[]; onRemoveQHighlight: (hid: string) => void;
}) {
  const rawOpts = question.options;
  const opts = Array.isArray(rawOpts) ? (rawOpts as string[]) : undefined;
  const isFIB = question.type === "FILL_IN_BLANK" || question.type === "SHORT_ANSWER";
  const hasWordBank = isFIB && !!opts && opts.length > 0;
  const hasBlank = isFIB && BLANK_RE.test(question.questionText);
  const parts = hasBlank ? question.questionText.split(BLANK_RE) : null;
  const tfOptions = question.instruction === "YES_NO_NG" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"];

  return (
    <div className="mb-8">
      {/* Question text */}
      <div className="flex items-start gap-2 mb-3">
        <button onClick={onFlag} title="Flag for review"
          className={`flex-shrink-0 text-sm font-bold leading-relaxed transition-colors ${flagged ? "text-amber-500" : "text-black"}`}>
          {question.order}
        </button>

        {/* Inline blank input inside question text */}
        {hasBlank && parts ? (
          <p data-qid={question.id} className="text-sm text-black leading-8 select-text">
            {parts.map((part, i) => (
              <span key={i}>
                {renderWithHighlights(part, qHighlights, onRemoveQHighlight)}
                {i < parts.length - 1 && (
                  hasWordBank ? (
                    <span className={`mx-1 inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded border px-2 text-center text-sm font-bold align-baseline ${
                      answer ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-300"
                    }`}>
                      {answer || String(question.order)}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={String(question.order)}
                      className="mx-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-center text-sm font-medium outline-none focus:border-black transition placeholder:text-gray-300 align-baseline"
                      style={{ width: `${Math.max(120, answer.length * 9 + 16)}px` }}
                    />
                  )
                )}
              </span>
            ))}
          </p>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <p data-qid={question.id} className="text-sm text-black leading-relaxed select-text flex-1">
              {renderWithHighlights(question.questionText, qHighlights, onRemoveQHighlight)}
            </p>
            {question.type === "MATCHING_INFO" && opts && (
              <select
                value={answer || ""}
                onChange={(e) => onChange(e.target.value)}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-black focus:border-black focus:outline-none"
              >
                <option value="">–</option>
                {opts.map((opt) => {
                  const m = opt.match(/^([A-Z])\s*[-–]?\s*/);
                  const letter = m ? m[1] : opt.charAt(0);
                  return (
                    <option key={opt} value={letter}>{letter}</option>
                  );
                })}
              </select>
            )}
          </div>
        )}
      </div>

      {/* TRUE / FALSE / NOT GIVEN (or YES / NO / NOT GIVEN) */}
      {question.type === "TRUE_FALSE_NG" && (
        <div className="ml-6 mt-2 flex flex-wrap gap-2">
          {tfOptions.map((opt) => (
            <button key={opt} type="button"
              onClick={() => onChange(answer === opt ? "" : opt)}
              className={`rounded border px-4 py-1.5 text-xs font-bold tracking-wide transition-all ${
                answer === opt
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* MULTIPLE CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && opts && (
        <div className="ml-6 mt-2 space-y-2">
          {opts.map((opt) => {
            const letter = opt[0];
            const text = opt.slice(1).replace(/^[\s.:)]+/, "");
            return (
              <button key={opt} type="button"
                onClick={() => onChange(answer === letter ? "" : letter)}
                className={`flex w-full items-start gap-3 rounded border px-3.5 py-2.5 text-left text-sm transition-all ${
                  answer === letter
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-black hover:border-gray-400 hover:bg-gray-50"
                }`}>
                <span className="font-bold shrink-0">{letter}</span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FILL IN BLANK / SHORT ANSWER — fallback if no inline blank detected */}
      {isFIB && !hasBlank && !hasWordBank && (
        <div className="ml-6 mt-2">
          <input type="text" value={answer} onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer"
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-800 transition w-full max-w-sm" />
        </div>
      )}

      {/* FILL IN BLANK with a shared word bank — pick the matching letter */}
      {hasWordBank && opts && (
        <div className="ml-6 mt-2 flex flex-wrap gap-1.5">
          {opts.map((opt) => {
            const letter = opt[0];
            return (
              <button key={opt} type="button"
                onClick={() => onChange(answer === letter ? "" : letter)}
                className={`min-w-[2.5rem] rounded border px-2.5 py-1 text-sm font-bold transition-all ${
                  answer === letter
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-black hover:border-gray-500 hover:bg-gray-50"
                }`}>
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* MATCHING HEADINGS — only key buttons (i, ii, iii…), list shown at group level */}
      {question.type === "MATCHING_HEADINGS" && opts && (
        <div className="ml-6 mt-2 flex flex-wrap gap-1.5">
          {opts.map((opt) => {
            const key = opt.split(/\s*[–-]\s*/)[0].trim();
            return (
              <button key={key} type="button"
                onClick={() => onChange(answer === key ? "" : key)}
                className={`min-w-[2.5rem] rounded border px-2.5 py-1 text-sm font-bold italic transition-all ${
                  answer === key
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-black hover:border-gray-500 hover:bg-gray-50"
                }`}>
                {key}
              </button>
            );
          })}
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
  const searchParams = useSearchParams();
  const reviewResultId = searchParams.get("resultId");
  const isReview = !!reviewResultId;
  const [reviewCorrectness, setReviewCorrectness] = useState<Record<string, boolean>>({});
  const [test, setTest]           = useState<Test | null>(null);
  const [resultId, setResultId]   = useState<string | null>(null);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [activePassage, setActivePassage] = useState(0);
  const [started, setStarted]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlights, setHighlights]           = useState<Record<string, Highlight[]>>({});
  const [questionHighlights, setQuestionHighlights] = useState<Record<string, Highlight[]>>({});
  const [tooltip, setTooltip]               = useState<TooltipState | null>(null);
  const tooltipSourceRef = useRef<"passage" | string>("passage");
  const [flagged, setFlagged]     = useState<Set<string>>(new Set());
  const [fontIdx, setFontIdx]     = useState(DEFAULT_FONT_IDX);
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(0);
  const [timeUpModal, setTimeUpModal] = useState(false);
  const passageRef   = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const passageIdRef = useRef<string>("");
  const isDragging   = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct]   = useState(52);
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage");
  const fontSize = FONT_SIZES[fontIdx];

  const draftKey = `ielts_draft_${id}`;

  useEffect(() => { api.get(`/tests/${id}`).then((r) => setTest(r.data)); }, [id]);

  // Analyze flow — load the submitted answers + correctness and jump
  // straight into the test UI instead of the normal "Start Test" screen.
  useEffect(() => {
    if (!isReview || !reviewResultId) return;
    api.get(`/results/${reviewResultId}`).then((r) => {
      const data = r.data;
      const ansMap: Record<string, string> = {};
      const correctMap: Record<string, boolean> = {};
      for (const a of data.answers ?? []) {
        ansMap[a.questionId] = a.userAnswer ?? "";
        correctMap[a.questionId] = a.isCorrect;
      }
      setAnswers(ansMap);
      setReviewCorrectness(correctMap);
      setResultId(reviewResultId);
      startTimeRef.current = Date.now();
      setStarted(true);
    });
  }, [isReview, reviewResultId]);

  // Restore draft from localStorage after test loads
  useEffect(() => {
    if (!test || !id || isReview) return;
    try {
      const raw = localStorage.getItem(`ielts_draft_${id}`);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft.resultId) return;
      const elapsed = Math.round((Date.now() - draft.startedAt) / 1000);
      const remaining = Math.max(10, test.timeLimit * 60 - elapsed);
      setResultId(draft.resultId);
      startTimeRef.current = draft.startedAt;
      setAnswers(draft.answers ?? {});
      setHighlights(draft.highlights ?? {});
      setQuestionHighlights(draft.questionHighlights ?? {});
      setFlagged(new Set(draft.flagged ?? []));
      setActivePassage(draft.activePassage ?? 0);
      setTimerInitialSeconds(remaining);
      setStarted(true);
    } catch {}
  }, [test, id]);

  // Persist draft to localStorage whenever key state changes
  useEffect(() => {
    if (!started || !resultId || !id || isReview) return;
    try {
      localStorage.setItem(`ielts_draft_${id}`, JSON.stringify({
        resultId,
        startedAt: startTimeRef.current,
        answers,
        highlights,
        questionHighlights,
        flagged: [...flagged],
        activePassage,
      }));
    } catch {}
  }, [answers, highlights, questionHighlights, flagged, activePassage, started, resultId, id]);

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

      // Snap to word boundaries
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const t = range.startContainer.textContent ?? "";
        let s = range.startOffset;
        while (s > 0 && /\S/.test(t[s - 1])) s--;
        range.setStart(range.startContainer, s);
      }
      if (range.endContainer.nodeType === Node.TEXT_NODE) {
        const t = range.endContainer.textContent ?? "";
        let e = range.endOffset;
        while (e < t.length && /\S/.test(t[e])) e++;
        range.setEnd(range.endContainer, e);
      }

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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  async function handleStart() {
    const { data } = await api.post("/results/start", { testId: id });
    const now = Date.now();
    const secs = (test?.timeLimit ?? 20) * 60;
    setResultId(data.id);
    startTimeRef.current = now;
    setTimerInitialSeconds(secs);
    setStarted(true);
    try { await document.documentElement.requestFullscreen(); } catch {}
  }

  function exitTest() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    router.back();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!resultId || submitting) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await api.post(`/results/${resultId}/submit`, { answers: Object.entries(answers).map(([questionId, userAnswer]) => ({ questionId, userAnswer })), timeSpent });
      localStorage.removeItem(draftKey);
      toast.success("Test submitted!"); router.push(`/results/${resultId}`);
    } catch { toast.error("Something went wrong"); setSubmitting(false); }
  }, [resultId, submitting, answers, router]);

  if (!test) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" /></div>;

  const allQuestions  = (test.passages ?? []).flatMap((p) => p.questions ?? []);
  const answeredCount = Object.values(answers).filter(Boolean).length;

  // Pre-test
  if (!started) {
    if (isReview) {
      return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" /></div>;
    }
    const passages = test.passages ?? [];
    return (
      <div className="flex h-full items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <button onClick={() => router.back()}
            className="mb-4 flex items-center gap-1 text-xs text-gray-400 hover:text-black transition">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
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
  const passage  = passages[activePassage] ?? passages[0];
  if (!passage) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" /></div>;
  passageIdRef.current = passage.id;
  const passageHighlights = highlights[passage.id] ?? [];
  const pQuestions = passage.questions ?? [];
  const firstQ = pQuestions[0];
  const lastQ  = pQuestions[pQuestions.length - 1];
  type QGroup = { type: string; instruction: string | undefined; questions: Question[]; firstOrder: number; lastOrder: number };
  const matchingInfoGroupKey = (q: Question) => {
    if (q.type !== "MATCHING_INFO") return null;
    const hasNames = Array.isArray(q.options) &&
      (q.options as string[]).some((o) => o.replace(/^[A-Z]\s*[-–]?\s*/, "").trim().length > 0);
    return hasNames ? "people" : "paragraph";
  };
  const questionGroups = pQuestions.reduce<QGroup[]>((acc, q) => {
    const last = acc[acc.length - 1];
    const sameGroup = last && last.type === q.type && (
      q.type === "MATCHING_INFO"
        ? matchingInfoGroupKey(last.questions[0]) === matchingInfoGroupKey(q)
        : last.instruction === q.instruction
    );
    if (sameGroup) {
      last.questions.push(q); last.lastOrder = q.order;
    } else {
      acc.push({ type: q.type, instruction: q.instruction, questions: [q], firstOrder: q.order, lastOrder: q.order });
    }
    return acc;
  }, []);

  return (
    <div className="flex h-full flex-col bg-white" style={{ ["--mobile-tab" as string]: mobileTab }}>
      {/* Time's up reminder — does not submit the test */}
      {timeUpModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="mb-2 text-lg font-bold text-black">Time&apos;s up!</h2>
            <p className="mb-5 text-sm text-gray-500">Your time has ended. This is just a reminder — you can keep working and submit whenever you&apos;re ready.</p>
            <button onClick={() => setTimeUpModal(false)}
              className="w-full rounded-full bg-black py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition">
              Okay
            </button>
          </div>
        </div>
      )}

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
        <div data-highlight-toolbar style={{ position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)", zIndex: 999 }}>
          <button onClick={() => addHighlight("#FEF08A")}
            style={{ borderRadius: "4px" }}
            className="flex items-center gap-1.5 bg-white shadow-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors">
            <Highlighter className="h-5 w-5 text-black" />
            <span className="text-xs font-semibold text-gray-700">Highlight</span>
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-3 sm:px-8 py-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={exitTest}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition shrink-0">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          <span className="text-xs sm:text-sm font-semibold text-black truncate max-w-[100px] sm:max-w-xs">{test.title}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {isReview ? (
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-500">Review Mode</span>
          ) : (
            <Timer seconds={timerInitialSeconds || test.timeLimit * 60} onExpire={() => setTimeUpModal(true)} />
          )}
          {/* Font size — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0.5 rounded border border-gray-200 px-1 py-0.5">
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-black transition">
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3v6H3"/><path d="M15 3v6h6"/><path d="M9 21v-6H3"/><path d="M15 21v-6h6"/>
              </svg>
            ) : (
              <Scan className="h-5 w-5" />
            )}
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`rounded-lg px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold transition disabled:opacity-50 ${
              isReview ? "bg-black text-white hover:bg-gray-800" : "border border-gray-200 text-black hover:bg-gray-50"
            }`}>
            {submitting ? "…" : isReview ? "Finish Test" : "Submit"}
          </button>
        </div>
      </div>

      {/* Mobile tab toggle */}
      <div className="flex sm:hidden shrink-0 border-b border-gray-100 bg-gray-50">
        <button onClick={() => setMobileTab("passage")}
          className={`flex-1 py-2.5 text-xs font-semibold transition ${mobileTab === "passage" ? "text-black border-b-2 border-black bg-white" : "text-gray-400"}`}>
          Passage
        </button>
        <button onClick={() => setMobileTab("questions")}
          className={`flex-1 py-2.5 text-xs font-semibold transition ${mobileTab === "questions" ? "text-black border-b-2 border-black bg-white" : "text-gray-400"}`}>
          Questions ({pQuestions.filter((q) => answers[q.id]).length}/{pQuestions.length})
        </button>
      </div>

      {/* Two-column content — desktop | single pane mobile */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left — passage */}
        <div className={`overflow-y-auto ${mobileTab === "passage" ? "flex" : "hidden"} sm:flex flex-col`}
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 640 ? `${leftPct}%` : "100%", fontSize: `${fontSize}px` }}>
          <div className="mx-auto w-[95%] py-6 sm:py-10 leading-7 sm:leading-8 font-medium text-black">
            <p className="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wide text-black">PASSAGE {passage.order}</p>
            <p className="mb-4 sm:mb-6 text-xs text-gray-500 leading-relaxed">
              Questions {firstQ?.order}–{lastQ?.order} are based on Reading Passage {passage.order} below.
            </p>
            <h2 className="mb-5 sm:mb-7 text-center font-bold leading-snug text-black" style={{ fontSize: `${fontSize + 2}px` }}>
              {passage.title}
            </h2>
            <div ref={passageRef} style={{ userSelect: "text" }} className="selection:bg-yellow-200 cursor-pointer" onClick={handleWordClick}>
              {renderPassage(passage.content, passageHighlights, removeHighlight)}
            </div>
            {/* Mobile: go to questions button */}
            <button onClick={() => setMobileTab("questions")}
              className="mt-8 flex sm:hidden w-full items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-bold text-white">
              Go to Questions →
            </button>
          </div>
        </div>

        {/* Drag handle — desktop only */}
        <div onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
          className="hidden sm:block w-px flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-gray-300 transition-colors" />

        {/* Right — questions */}
        <div ref={questionsRef} className={`overflow-y-auto ${mobileTab === "questions" ? "flex" : "hidden"} sm:flex flex-col flex-1`}>
          <div className="px-4 sm:px-8 py-6 sm:py-8">

            {questionGroups.map((group, gi) => {
              const rawGroupOpts = group.questions[0]?.options;
              const opts = Array.isArray(rawGroupOpts) ? (rawGroupOpts as string[]) : undefined;
              const lastLetter = opts?.length ? String.fromCharCode(64 + opts.length) : "G";
              const range = group.firstOrder === group.lastOrder
                ? `${group.firstOrder}`
                : `${group.firstOrder}–${group.lastOrder}`;
              // MATCHING_INFO has two IELTS sub-types: bare letters ("A") = match-to-paragraph,
              // "letter - name" pairs ("A - John") = match-to-person/category
              const matchingInfoHasNames = opts?.some((o) => o.replace(/^[A-Z]\s*[-–]?\s*/, "").trim().length > 0) ?? false;
              const groupHasWordBank = (group.type === "FILL_IN_BLANK" || group.type === "SHORT_ANSWER") && !!opts && opts.length > 0;
              const isYesNo = group.type === "TRUE_FALSE_NG" && group.instruction === "YES_NO_NG";

              return (
                <div key={gi} className={gi > 0 ? "mt-12" : ""}>

                  {/* Group header */}
                  <div className="mb-4 border-b-2 border-gray-800 pb-2">
                    <p className="text-base font-bold text-black">Questions {range}</p>
                  </div>

                  {/* Type-specific instruction */}
                  {group.type === "TRUE_FALSE_NG" && (
                    <div className="mb-6 text-sm text-black leading-relaxed space-y-1.5">
                      {isYesNo ? (
                        <p><em>Do the following statements agree with the claims of the writer in Reading Passage {passage.order}?</em></p>
                      ) : (
                        <p><em>Do the following statements agree with the information given in Reading Passage {passage.order}?</em></p>
                      )}
                      <p><em>In boxes <strong>{range}</strong> on your answer sheet, write</em></p>
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-300">
                        {isYesNo ? (
                          <>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">YES</span><span className="text-gray-600">if the statement agrees with the claims of the writer</span></div>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">NO</span><span className="text-gray-600">if the statement contradicts the claims of the writer</span></div>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">NOT GIVEN</span><span className="text-gray-600">if there is no information on this</span></div>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">TRUE</span><span className="text-gray-600">if the statement agrees with the information</span></div>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">FALSE</span><span className="text-gray-600">if the statement contradicts the information</span></div>
                            <div className="flex gap-3"><span className="font-bold w-24 shrink-0 text-black">NOT GIVEN</span><span className="text-gray-600">if there is no information on this</span></div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {(group.type === "FILL_IN_BLANK" || group.type === "SHORT_ANSWER") && (
                    groupHasWordBank ? (
                      <div className="mb-6 text-sm text-black leading-relaxed space-y-1">
                        <p><em>Complete the summary below.</em></p>
                        <p><em>Choose the correct answer, <strong>{opts![0][0]}–{opts![opts!.length - 1][0]}</strong>, from the box below.</em></p>
                        <p><em>Write the correct letter in boxes <strong>{range}</strong> on your answer sheet.</em></p>
                        <div className="mt-4 overflow-hidden rounded border border-gray-300">
                          <div className="border-b border-gray-300 bg-gray-100 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
                            Word / Option Bank
                          </div>
                          <div className="divide-y divide-gray-100 bg-white">
                            {opts!.map((opt) => {
                              const letter = opt[0];
                              const text = opt.slice(1).replace(/^[\s.:)]+/, "");
                              return (
                                <div key={opt} className="flex gap-4 px-4 py-2.5 text-sm leading-snug">
                                  <span className="w-6 shrink-0 font-bold text-black">{letter}</span>
                                  <span className="text-black">{text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 text-sm text-black leading-relaxed space-y-1">
                        <p><em>Complete the notes below.</em></p>
                        {group.instruction
                          ? <p><em>Choose <strong>NO MORE THAN {group.instruction}</strong> from the passage for each answer.</em></p>
                          : <p><em>Choose <strong>NO MORE THAN THREE WORDS AND/OR A NUMBER</strong> from the passage for each answer.</em></p>
                        }
                        <p><em>Write your answers in boxes <strong>{range}</strong> on your answer sheet.</em></p>
                      </div>
                    )
                  )}

                  {group.type === "MULTIPLE_CHOICE" && (
                    <div className="mb-6 text-sm text-black leading-relaxed space-y-1">
                      <p><em>Choose the correct letter, <strong>A</strong>, <strong>B</strong>, <strong>C</strong> or <strong>D</strong>.</em></p>
                      <p><em>Write the correct letter in box{group.questions.length > 1 ? `es <strong>${range}</strong>` : ` <strong>${range}</strong>`} on your answer sheet.</em></p>
                    </div>
                  )}

                  {group.type === "MATCHING_HEADINGS" && (
                    <div className="mb-6 text-sm text-black leading-relaxed space-y-1">
                      <p><em>The reading passage has several paragraphs, <strong>A–{String.fromCharCode(64 + group.questions.length)}</strong>.</em></p>
                      <p><em>Choose the correct heading for each paragraph from the list of headings below.</em></p>
                      <p><em>Write the correct number, <strong>i–{opts?.[opts.length - 1]?.split(/\s*[–-]\s*/)[0].trim() ?? "ix"}</strong>, in boxes <strong>{range}</strong> on your answer sheet.</em></p>
                      {opts && (
                        <div className="mt-4 overflow-hidden rounded border border-gray-300">
                          <div className="border-b border-gray-300 bg-gray-100 py-2 text-center text-xs font-bold uppercase tracking-widest text-black">
                            List of Headings
                          </div>
                          <div className="divide-y divide-gray-100 bg-white">
                            {opts.map((opt) => {
                              const dashIdx = opt.search(/\s*[–-]\s*/);
                              const key = dashIdx !== -1 ? opt.slice(0, dashIdx).trim() : opt;
                              const label = dashIdx !== -1 ? opt.slice(opt.match(/\s*[–-]\s*/)![0].length + dashIdx).trim() : "";
                              return (
                                <div key={opt} className="flex gap-4 px-4 py-2.5 text-sm leading-snug">
                                  <span className="w-6 shrink-0 font-bold italic text-black">{key}</span>
                                  <span className="text-black">{label || opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {group.type === "MATCHING_INFO" && (
                    <div className="mb-6 text-sm text-black leading-relaxed space-y-1">
                      {matchingInfoHasNames ? (
                        <>
                          <p><em>Look at the following statements (Questions <strong>{range}</strong>) and the list of people below.</em></p>
                          <p><em>Match each statement with the correct person, <strong>A–{lastLetter}</strong>.</em></p>
                          <p><em>Write the correct letter, <strong>A–{lastLetter}</strong>, in boxes <strong>{range}</strong> on your answer sheet.</em></p>
                          <p className="text-xs text-gray-500 italic">NB  You may use any letter more than once.</p>
                        </>
                      ) : (
                        <>
                          <p><em>Reading Passage {passage.order} has several paragraphs, <strong>A–{lastLetter}</strong>.</em></p>
                          <p><em>Which paragraph contains the following information?</em></p>
                          <p><em>Write the correct letter, <strong>A–{lastLetter}</strong>, in boxes <strong>{range}</strong> on your answer sheet.</em></p>
                          <p className="text-xs text-gray-500 italic">NB  You may use any letter more than once.</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Questions in this group */}
                  {group.questions.map((q) => (
                    <div key={q.id} id={`q-${q.id}`} className={
                      isReview
                        ? reviewCorrectness[q.id] === true
                          ? "border-l-4 border-green-500 bg-green-50/60 pl-3 -ml-3.5 rounded-r-md"
                          : reviewCorrectness[q.id] === false
                            ? "border-l-4 border-red-500 bg-red-50/60 pl-3 -ml-3.5 rounded-r-md"
                            : ""
                        : ""
                    }>
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
                  ))}

                  {/* List of People — shown after the questions, matching the real exam layout */}
                  {group.type === "MATCHING_INFO" && matchingInfoHasNames && opts && (
                    <div className="mt-2 ml-6 max-w-xs overflow-hidden rounded border border-gray-300">
                      <div className="border-b border-gray-300 bg-gray-100 py-2 text-center text-sm font-bold text-black">
                        List of People
                      </div>
                      <div className="divide-y divide-gray-100 bg-white px-4 py-2">
                        {opts.map((opt) => {
                          const m = opt.match(/^([A-Z])\s*[-–]?\s*/);
                          const letter = m ? m[1] : opt.charAt(0);
                          const name = m ? opt.slice(m[0].length).trim() : opt.slice(1).trim();
                          return (
                            <div key={opt} className="flex gap-5 py-1.5 text-sm">
                              <span className="w-4 shrink-0 font-bold text-black">{letter}</span>
                              <span className="text-black">{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* Bottom — passage tabs */}
      <div className="flex flex-shrink-0 flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-100 bg-white px-3 sm:px-8 py-2 sm:py-3">
        <span className="hidden sm:block text-xs text-gray-400">{answeredCount}/{allQuestions.length} answered</span>

        <div className="hidden sm:flex flex-wrap gap-1">
          {pQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setMobileTab("questions");
                setTimeout(() => {
                  document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 50);
              }}
              title={`Q${q.order}`}
              className={`flex h-7 w-7 items-center justify-center rounded text-[12px] font-bold transition-colors ${
                flagged.has(q.id) ? "bg-amber-400 text-white" :
                answers[q.id]    ? "bg-black text-white" :
                "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {q.order}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-gray-200 p-0.5">
          {passages.map((p, i) => {
            const done = (p.questions ?? []).filter((q) => answers[q.id]).length;
            const active = activePassage === i;
            return (
              <button key={p.id} onClick={() => { setActivePassage(i); setMobileTab("passage"); }}
                className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${active ? "bg-black text-white shadow-sm" : "text-gray-500 hover:text-black"}`}>
                {i + 1}
                <span className={`text-xs font-normal ${active ? "text-gray-300" : "text-gray-400"}`}>{done}/{p.questions.length}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
