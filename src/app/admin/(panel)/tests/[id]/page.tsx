"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronUp, X, Upload, FileText } from "lucide-react";
import { Test, QuestionType } from "@/types";
import { adminApi as api } from "@/lib/api";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE_NG", label: "True / False / Not Given" },
  { value: "FILL_IN_BLANK", label: "Fill in the Blank" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "MATCHING_HEADINGS", label: "Matching Headings" },
  { value: "MATCHING_INFO", label: "Matching Info" },
];

const emptyPassage = { order: 1, title: "", content: "" };
const emptyQuestion = {
  order: 1,
  type: "MULTIPLE_CHOICE" as QuestionType,
  questionText: "",
  instruction: "",
  options: ["A) ", "B) ", "C) ", "D) "],
  correctAnswer: "",
  explanation: "",
  points: 1,
};

export default function AdminTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [passageForm, setPassageForm] = useState(emptyPassage);
  const [showPassageForm, setShowPassageForm] = useState(false);
  const [addingPassage, setAddingPassage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedPassage, setExpandedPassage] = useState<string | null>(null);
  const [questionForms, setQuestionForms] = useState<Record<string, typeof emptyQuestion>>({});
  const [showQForms, setShowQForms] = useState<Record<string, boolean>>({});
  const [confirmData, setConfirmData] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    api.get(`/tests/admin/${id}`).then((r) => {
      setTest(r.data);
      if (r.data.passages?.[0]) setExpandedPassage(r.data.passages[0].id);
    }).finally(() => setLoading(false));
  }, [id]);

  async function readFile(file: File) {
    const isTxt = file.name.endsWith(".txt");
    const isPdf = file.name.endsWith(".pdf");

    if (!isTxt && !isPdf) {
      toast.error("Faqat .txt yoki .pdf fayl qo'llab-quvvatlanadi");
      return;
    }

    if (isTxt) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPassageForm((prev) => ({ ...prev, content: (ev.target?.result as string).trim() }));
        setDroppedFileName(file.name);
      };
      reader.readAsText(file);
      return;
    }

    // PDF
    const loadingToast = toast.loading("PDF o'qilmoqda…");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/ {2,}/g, " ")
          .trim();
        if (pageText) pages.push(pageText);
      }

      setPassageForm((prev) => ({ ...prev, content: pages.join("\n\n") }));
      setDroppedFileName(file.name);
      toast.success(`${pdf.numPages} sahifa o'qildi`, { id: loadingToast });
    } catch {
      toast.error("PDF o'qishda xatolik yuz berdi", { id: loadingToast });
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  async function addPassage(e: React.FormEvent) {
    e.preventDefault();
    setAddingPassage(true);
    try {
      const { data } = await api.post(`/tests/${id}/passages`, passageForm);
      setTest((t) => t ? { ...t, passages: [...(t.passages ?? []), { ...data, questions: [] }] } : t);
      setPassageForm(emptyPassage);
      setDroppedFileName(null);
      setShowPassageForm(false);
      setExpandedPassage(data.id);
      toast.success("Passage added!");
    } catch { toast.error("Something went wrong"); }
    finally { setAddingPassage(false); }
  }

  async function addQuestion(passageId: string, e: React.FormEvent) {
    e.preventDefault();
    const qf = questionForms[passageId] ?? emptyQuestion;
    if (qf.type === "FILL_IN_BLANK" && !qf.instruction) {
      toast.error("Instruction turini tanlang!");
      return;
    }
    try {
      const payload = { ...qf, options: (qf.type === "MULTIPLE_CHOICE" || qf.type === "MATCHING_INFO") ? qf.options.filter(Boolean) : undefined };
      const { data } = await api.post(`/tests/passages/${passageId}/questions`, payload);
      setTest((t) => t ? {
        ...t,
        passages: (t.passages ?? []).map((p) =>
          p.id === passageId ? { ...p, questions: [...p.questions, data] } : p
        ),
      } : t);
      setQuestionForms((prev) => ({ ...prev, [passageId]: { ...emptyQuestion, order: (data.order ?? 1) + 1 } }));
      toast.success("Question added!");
    } catch { toast.error("Something went wrong"); }
  }

  function deleteQuestion(passageId: string, questionId: string) {
    setConfirmData({
      message: "Delete this question?",
      onConfirm: async () => {
        setConfirmData(null);
        await api.delete(`/tests/questions/${questionId}`);
        setTest((t) => t ? {
          ...t,
          passages: (t.passages ?? []).map((p) =>
            p.id === passageId ? { ...p, questions: p.questions.filter((q) => q.id !== questionId) } : p
          ),
        } : t);
        toast.success("Question deleted");
      },
    });
  }

  if (loading) return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
    </div>
  );
  if (!test) return <div className="py-20 text-center text-gray-400">Test not found.</div>;

  return (
    <div className="h-full overflow-y-auto">
      {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)} />}
    <div className="mx-auto max-w-6xl px-6 py-8">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-black transition">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </button>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">{test.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {(test.passages ?? []).length} passage · {(test.passages ?? []).reduce((s, p) => s + p.questions.length, 0)} questions
          </p>
        </div>
        <button
          onClick={() => setShowPassageForm(!showPassageForm)}
          className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          {showPassageForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Passage</>}
        </button>
      </div>

      {/* Passage form */}
      {showPassageForm && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-black">New Passage</h2>
          <form onSubmit={addPassage} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">Order</label>
                <input type="number" min={1} value={passageForm.order}
                  onChange={(e) => setPassageForm({ ...passageForm, order: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 transition" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-black">Title *</label>
                <input required value={passageForm.title}
                  onChange={(e) => setPassageForm({ ...passageForm, title: e.target.value })}
                  placeholder="The Industrial Revolution"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 transition" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-black">Passage Content *</label>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false); }}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition-colors ${
                  isDraggingOver
                    ? "border-red-400 bg-gray-50 text-black"
                    : droppedFileName
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-red-200 text-gray-400 hover:border-red-200 hover:bg-gray-50/40"
                }`}
              >
                {droppedFileName ? (
                  <>
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{droppedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDroppedFileName(null); setPassageForm((p) => ({ ...p, content: "" })); }}
                      className="mt-0.5 text-xs text-gray-400 underline hover:text-black"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className={`h-5 w-5 transition-transform ${isDraggingOver ? "scale-110" : ""}`} />
                    <span>
                      <span className="font-semibold text-gray-600">.txt</span> yoki{" "}
                      <span className="font-semibold text-gray-600">.pdf</span> faylni bu yerga tashlang yoki{" "}
                      <span className="text-black underline">tanlang</span>
                    </span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }}
                />
              </div>

              <textarea required rows={8} value={passageForm.content}
                onChange={(e) => setPassageForm({ ...passageForm, content: e.target.value })}
                placeholder="Yoki matnni bu yerga paste qiling…"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 transition" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={addingPassage}
                className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
                {addingPassage ? "Saving…" : "Save Passage"}
              </button>
              <button type="button" onClick={() => { setShowPassageForm(false); setDroppedFileName(null); setPassageForm(emptyPassage); }}
                className="rounded-xl border border-red-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Passages */}
      <div className="space-y-4">
        {(test.passages ?? []).map((passage) => {
          const isExpanded = expandedPassage === passage.id;
          const qf = questionForms[passage.id] ?? emptyQuestion;
          const showQForm = showQForms[passage.id] ?? false;

          return (
            <div key={passage.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <button
                onClick={() => setExpandedPassage(isExpanded ? null : passage.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
              >
                <div>
                  <span className="font-semibold text-black">Passage {passage.order}: {passage.title}</span>
                  <span className="ml-3 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{passage.questions.length} questions</span>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="border-t border-red-100 px-6 pb-6">
                  {/* Questions list */}
                  {passage.questions.length > 0 && (
                    <div className="mb-4 space-y-2 pt-4">
                      {passage.questions.map((q) => (
                        <div key={q.id} className="flex items-start justify-between rounded-xl bg-gray-50 p-3 text-sm">
                          <div>
                            <span className="mr-2 font-semibold text-black">Q{q.order}</span>
                            <span className="mr-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">{q.type}</span>
                            <span className="text-black">{q.questionText}</span>
                          </div>
                          <button onClick={() => deleteQuestion(passage.id, q.id)} className="ml-3 flex-shrink-0 rounded p-1 text-red-200 hover:bg-gray-50 hover:text-black transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add question toggle */}
                  <button
                    onClick={() => setShowQForms((prev) => ({ ...prev, [passage.id]: !prev[passage.id] }))}
                    className="flex items-center gap-2 text-sm font-medium text-black hover:text-red-700 transition"
                  >
                    <Plus className="h-4 w-4" /> {showQForm ? "Close form" : "Add Question"}
                  </button>

                  {showQForm && (
                    <form onSubmit={(e) => addQuestion(passage.id, e)} className="mt-4 space-y-4 rounded-xl border border-red-100 bg-gray-50/30 p-5">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Order #</label>
                          <input type="number" min={1} value={qf.order}
                            onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, order: Number(e.target.value) } }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-gray-600">Question Type</label>
                          <select value={qf.type}
                            onChange={(e) => {
                            const t = e.target.value as QuestionType;
                            const opts = t === "MULTIPLE_CHOICE" ? ["A) ", "B) ", "C) ", "D) "] : t === "MATCHING_INFO" ? ["A - "] : [];
                            setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, type: t, instruction: "", options: opts } }));
                          }}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition">
                            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Question Text *</label>
                        <textarea required rows={2} value={qf.questionText}
                          onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, questionText: e.target.value } }))}
                          placeholder="Enter the question..."
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                      </div>
                      {qf.type === "FILL_IN_BLANK" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Instruction <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={qf.instruction ?? ""}
                            onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, instruction: e.target.value } }))}
                            className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm outline-none focus:border-amber-400 transition"
                          >
                            <option value="" disabled>— tanlang —</option>
                            <option value="ONE WORD ONLY">ONE WORD ONLY</option>
                            <option value="ONE WORD AND/OR A NUMBER">ONE WORD AND/OR A NUMBER</option>
                            <option value="NO MORE THAN TWO WORDS">NO MORE THAN TWO WORDS</option>
                            <option value="NO MORE THAN TWO WORDS AND/OR A NUMBER">NO MORE THAN TWO WORDS AND/OR A NUMBER</option>
                            <option value="NO MORE THAN THREE WORDS">NO MORE THAN THREE WORDS</option>
                            <option value="NO MORE THAN THREE WORDS AND/OR A NUMBER">NO MORE THAN THREE WORDS AND/OR A NUMBER</option>
                          </select>
                        </div>
                      )}
                      {(qf.type === "SHORT_ANSWER" || qf.type === "MATCHING_HEADINGS" || qf.type === "MATCHING_INFO") && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Instruction <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
                          </label>
                          <input value={qf.instruction ?? ""}
                            onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, instruction: e.target.value } }))}
                            placeholder="NO MORE THAN THREE WORDS / ONE WORD ONLY ..."
                            className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm outline-none focus:border-amber-400 transition placeholder:text-gray-400" />
                        </div>
                      )}
                      {qf.type === "MULTIPLE_CHOICE" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Options (A, B, C, D)</label>
                          <div className="space-y-2">
                            {(qf.options ?? []).map((opt, i) => (
                              <input key={i} value={opt}
                                onChange={(e) => {
                                  const opts = [...(qf.options ?? [])];
                                  opts[i] = e.target.value;
                                  setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, options: opts } }));
                                }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                            ))}
                          </div>
                        </div>
                      )}
                      {qf.type === "MATCHING_INFO" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            Options <span className="text-gray-400 font-normal">(e.g. "A - John Smith" yoki "A")</span>
                          </label>
                          <div className="space-y-1.5">
                            {(qf.options ?? []).map((opt, i) => (
                              <div key={i} className="flex gap-1.5">
                                <input value={opt}
                                  onChange={(e) => {
                                    const opts = [...(qf.options ?? [])];
                                    opts[i] = e.target.value;
                                    setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, options: opts } }));
                                  }}
                                  placeholder={`A - Name yoki A`}
                                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                                <button type="button"
                                  onClick={() => {
                                    const opts = (qf.options ?? []).filter((_, j) => j !== i);
                                    setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, options: opts } }));
                                  }}
                                  className="rounded-lg px-2 text-gray-300 hover:text-red-500 transition">✕</button>
                              </div>
                            ))}
                            <button type="button"
                              onClick={() => {
                                const letters = "ABCDEFGHIJ";
                                const next = letters[(qf.options ?? []).length] ?? "?";
                                setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, options: [...(qf.options ?? []), `${next} - `] } }));
                              }}
                              className="mt-1 text-xs font-medium text-gray-400 hover:text-black transition">+ Option qo'shish</button>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Correct Answer *</label>
                          <input required value={qf.correctAnswer}
                            onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, correctAnswer: e.target.value } }))}
                            placeholder={qf.type === "MULTIPLE_CHOICE" ? "A, B, C or D" : qf.type === "TRUE_FALSE_NG" ? "TRUE / FALSE / NOT GIVEN" : "Answer..."}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Explanation (optional)</label>
                          <input value={qf.explanation ?? ""}
                            onChange={(e) => setQuestionForms((p) => ({ ...p, [passage.id]: { ...qf, explanation: e.target.value } }))}
                            placeholder="Why is this the correct answer?"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 transition" />
                        </div>
                      </div>
                      <button type="submit" className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition">
                        Add Question
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {(test.passages ?? []).length === 0 && (
          <div className="rounded-2xl bg-white py-16 text-center text-gray-400 ring-1 ring-gray-100">
            No passages yet. Click "Add Passage" to get started.
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
