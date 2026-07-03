"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, BookOpen, X, Sparkles, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

type QuestionDraft = {
  questionText: string;
  correctAnswer: string;
  type: "SHORT_ANSWER" | "FILL_IN_BLANK" | "MULTIPLE_CHOICE" | "TRUE_FALSE_NG" | "MATCHING_INFO";
  options: string[];
  instruction: string;
};

type PredTest = {
  id: string;
  title: string;
  timeLimit: number;
  isPublished: boolean;
  status: string;
  passageCategory?: number | null;
  _count?: { passages: number; testResults: number };
};

type PassageDetail = {
  id: string;
  title: string;
  content: string;
  questions: { id: string; order: number; questionText: string; correctAnswer: string; type: string }[];
};

const EMPTY_QUESTION: QuestionDraft = { questionText: "", correctAnswer: "", type: "SHORT_ANSWER", options: [], instruction: "" };

export default function AdminPredictedPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PredTest[]>([]);
  const [loading, setLoading] = useState(true);

  // New test form
  const [showForm, setShowForm] = useState(false);
  const [testName, setTestName] = useState("");
  const [passageTitle, setPassageTitle] = useState("");
  const [passageContent, setPassageContent] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [passageCatForm, setPassageCatForm] = useState<number>(1);
  const [questions, setQuestions] = useState<QuestionDraft[]>([{ ...EMPTY_QUESTION }]);
  const [creating, setCreating] = useState(false);

  // Expanded detail cache
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, PassageDetail | null>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => { loadTests(); }, []);

  async function loadTests() {
    setLoading(true);
    try {
      const { data } = await api.get("/tests/admin/all");
      setTests((data as any[]).filter((t) => t.status === "PREDICTED"));
    } finally { setLoading(false); }
  }

  function resetForm() {
    setTestName(""); setPassageTitle(""); setPassageContent(""); setTimeLimit(60);
    setPassageCatForm(1);
    setQuestions([{ ...EMPTY_QUESTION }]);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...EMPTY_QUESTION }]);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validQs = questions.filter((q) => q.questionText.trim() && q.correctAnswer.trim());
    if (!passageContent.trim()) { toast.error("Passage matnini kiriting"); return; }
    if (validQs.length === 0) { toast.error("Kamida 1 ta savol kiriting"); return; }
    const missingInstruction = validQs.findIndex((q) => q.type === "FILL_IN_BLANK" && !q.instruction);
    if (missingInstruction !== -1) { toast.error(`${missingInstruction + 1}-savol uchun instruction tanlang!`); return; }

    setCreating(true);
    const tid = toast.loading("Test yaratilmoqda…");
    try {
      // 1. Test
      const { data: test } = await api.post("/tests", {
        title: testName.trim(),
        timeLimit,
        status: "PREDICTED",
        isPublished: true,
        passageCategory: passageCatForm,
      });

      // 2. Passage
      const { data: passage } = await api.post(`/tests/${test.id}/passages`, {
        order: 1,
        title: passageTitle.trim() || testName.trim(),
        content: passageContent.trim(),
      });

      // 3. Questions (parallel)
      await Promise.all(
        validQs.map((q, idx) =>
          api.post(`/tests/passages/${passage.id}/questions`, {
            order: idx + 1,
            type: q.type,
            questionText: q.questionText.trim(),
            correctAnswer: q.correctAnswer.trim(),
            instruction: q.type === "FILL_IN_BLANK" ? q.instruction : undefined,
            options: (q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING_INFO") ? q.options.filter(Boolean) : null,
            points: 1,
          })
        )
      );

      toast.success("Test yaratildi!", { id: tid });
      setTests((prev) => [{ ...test, _count: { passages: 1, testResults: 0 } }, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi", { id: tid });
    } finally { setCreating(false); }
  }

  function handleDelete(id: string, title: string) {
    setConfirmData({
      message: `"${title}" ni o'chirasizmi?`,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await api.delete(`/tests/${id}`);
          setTests((prev) => prev.filter((t) => t.id !== id));
          if (expandedId === id) setExpandedId(null);
          toast.success("O'chirildi");
        } catch { toast.error("O'chirishda xatolik"); }
      },
    });
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!(id in cache)) {
      setLoadingId(id);
      try {
        const { data } = await api.get(`/tests/admin/${id}`);
        setCache((prev) => ({ ...prev, [id]: data.passages?.[0] ?? null }));
      } finally { setLoadingId(null); }
    }
  }

  return (
    <div className="p-4 sm:p-8">
      {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)} />}
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Sparkles className="h-5 w-5 text-purple-500" /> Predicted Tests
          </h1>
          <p className="text-sm text-gray-400">{tests.length} ta predicted test</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition"
        >
          {showForm ? <><X className="h-4 w-4" /> Bekor</> : <><Plus className="h-4 w-4" /> Yangi test</>}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-semibold text-gray-900">Yangi Predicted Test</h2>
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Meta */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Test nomi *</label>
                <input
                  required value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Predicted IELTS Reading – 2025 June"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Vaqt (daqiqa)</label>
                <input
                  type="number" min={10} max={180} value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Kategoriya</label>
                <select
                  value={passageCatForm}
                  onChange={(e) => setPassageCatForm(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                >
                  <option value={1}>Passage 1</option>
                  <option value={2}>Passage 2</option>
                  <option value={3}>Passage 3</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Passage sarlavhasi <span className="font-normal text-gray-400">(ixtiyoriy)</span>
                </label>
                <input
                  value={passageTitle}
                  onChange={(e) => setPassageTitle(e.target.value)}
                  placeholder="Bo'sh qoldirilsa test nomi ishlatiladi"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>
            </div>

            {/* Passage text */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Passage matni *</label>
              <textarea
                required rows={10}
                value={passageContent}
                onChange={(e) => setPassageContent(e.target.value)}
                placeholder="IELTS reading passage matnini shu yerga kiriting..."
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
              />
            </div>

            {/* Questions */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Savollar * <span className="font-normal text-gray-400">({questions.length} ta)</span>
                </label>
                <button
                  type="button" onClick={addQuestion}
                  className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
                >
                  <Plus className="h-3 w-3" /> Savol qo&apos;shish
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{idx + 1}-savol</span>
                      {questions.length > 1 && (
                        <button
                          type="button" onClick={() => removeQuestion(idx)}
                          className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Question text */}
                      <input
                        value={q.questionText}
                        onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                        placeholder="Savol matni..."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* Type */}
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const t = e.target.value as QuestionDraft["type"];
                            const opts = t === "MULTIPLE_CHOICE" ? ["A) ", "B) ", "C) ", "D) "] : t === "MATCHING_INFO" ? ["A - "] : [];
                            updateQuestion(idx, { type: t, instruction: "", options: opts });
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                        >
                          <option value="SHORT_ANSWER">Short Answer</option>
                          <option value="FILL_IN_BLANK">Fill in Blank</option>
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="TRUE_FALSE_NG">True / False / NG</option>
                          <option value="MATCHING_INFO">Matching Info</option>
                        </select>

                        {/* Answer */}
                        <input
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                          placeholder={
                            q.type === "TRUE_FALSE_NG" ? "TRUE / FALSE / NOT GIVEN"
                            : q.type === "MULTIPLE_CHOICE" ? "A / B / C / D"
                            : "To'g'ri javob"
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                        />
                      </div>

                      {/* MC options */}
                      {q.type === "MULTIPLE_CHOICE" && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {["A", "B", "C", "D"].map((letter, i) => (
                            <input
                              key={letter}
                              value={q.options[i] ?? ""}
                              onChange={(e) => {
                                const opts = [...q.options];
                                opts[i] = e.target.value;
                                updateQuestion(idx, { options: opts });
                              }}
                              placeholder={`${letter}) variant...`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                            />
                          ))}
                        </div>
                      )}

                      {/* MATCHING_INFO options */}
                      {q.type === "MATCHING_INFO" && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-gray-500">Options <span className="text-gray-400">(e.g. "A - John Smith" yoki "A")</span></p>
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex gap-1.5">
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const opts = [...q.options];
                                  opts[i] = e.target.value;
                                  updateQuestion(idx, { options: opts });
                                }}
                                placeholder="A - Name yoki A"
                                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                              />
                              <button type="button"
                                onClick={() => updateQuestion(idx, { options: q.options.filter((_, j) => j !== i) })}
                                className="rounded-lg px-2 text-gray-300 hover:text-red-500 transition">✕</button>
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => {
                              const letters = "ABCDEFGHIJ";
                              const next = letters[q.options.length] ?? "?";
                              updateQuestion(idx, { options: [...q.options, `${next} - `] });
                            }}
                            className="text-xs font-medium text-gray-400 hover:text-black transition">+ Option qo'shish</button>
                        </div>
                      )}

                      {/* Instruction dropdown for FILL_IN_BLANK */}
                      {q.type === "FILL_IN_BLANK" && (
                        <select
                          value={q.instruction}
                          onChange={(e) => updateQuestion(idx, { instruction: e.target.value })}
                          className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                        >
                          <option value="" disabled>— Instruction turini tanlang —</option>
                          <option value="ONE WORD ONLY">ONE WORD ONLY</option>
                          <option value="ONE WORD AND/OR A NUMBER">ONE WORD AND/OR A NUMBER</option>
                          <option value="NO MORE THAN TWO WORDS">NO MORE THAN TWO WORDS</option>
                          <option value="NO MORE THAN TWO WORDS AND/OR A NUMBER">NO MORE THAN TWO WORDS AND/OR A NUMBER</option>
                          <option value="NO MORE THAN THREE WORDS">NO MORE THAN THREE WORDS</option>
                          <option value="NO MORE THAN THREE WORDS AND/OR A NUMBER">NO MORE THAN THREE WORDS AND/OR A NUMBER</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button
                type="submit" disabled={creating}
                className="rounded-full bg-purple-600 px-8 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition"
              >
                {creating ? "Yaratilmoqda…" : "Test yaratish"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Bekor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-white py-20 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-purple-200" />
          <p className="font-medium text-gray-400">Predicted testlar yo&apos;q</p>
          <p className="mt-1 text-sm text-gray-300">&quot;Yangi test&quot; tugmasi orqali qo&apos;shing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const isExpanded = expandedId === test.id;
            const detail = cache[test.id];
            const isLoadingThis = loadingId === test.id;

            return (
              <div key={test.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-gray-50 transition"
                  onClick={() => toggleExpand(test.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{test.title}</p>
                      {test.passageCategory && (
                        <span className="shrink-0 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                          P{test.passageCategory}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {test.timeLimit}m</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {test._count?.passages ?? 0} passage · {test._count?.testResults ?? 0} submission
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/admin/tests/${test.id}`)}
                      title="Tahrirlash"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id, test.title)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                </div>

                {/* Detail panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-3">
                    {isLoadingThis ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-gray-200" />)}
                      </div>
                    ) : !detail ? (
                      <p className="text-sm text-gray-400">Passage topilmadi</p>
                    ) : (
                      <>
                        {/* Passage preview */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-500">Passage</p>
                          <p className="text-sm font-semibold text-gray-900">{detail.title}</p>
                          <p className="mt-1.5 text-xs text-gray-400 line-clamp-3">{detail.content}</p>
                        </div>

                        {/* Questions preview */}
                        {detail.questions.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-gray-500">
                              {detail.questions.length} ta savol
                            </p>
                            <div className="space-y-1.5">
                              {detail.questions.map((q, idx) => (
                                <div key={q.id} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
                                  <span className="mt-0.5 shrink-0 text-xs font-bold text-purple-400">{idx + 1}.</span>
                                  <p className="flex-1 min-w-0 truncate text-xs text-gray-700">{q.questionText}</p>
                                  <span className="shrink-0 rounded-md bg-purple-50 px-1.5 py-0.5 text-xs font-bold text-purple-700">
                                    {q.correctAnswer}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
