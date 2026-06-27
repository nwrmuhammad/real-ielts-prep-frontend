"use client";
import { Headphones, PenLine, Mic, Clock } from "lucide-react";

const ICONS = {
  headphones: Headphones,
  pen: PenLine,
  mic: Mic,
};

const COLORS: Record<string, { bg: string; icon: string; badge: string; glow: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   badge: "bg-blue-100 text-blue-700",   glow: "from-blue-50" },
  amber:  { bg: "bg-amber-50",  icon: "text-amber-500",  badge: "bg-amber-100 text-amber-700",  glow: "from-amber-50" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500", badge: "bg-purple-100 text-purple-700", glow: "from-purple-50" },
};

export default function ComingSoon({
  skill,
  icon,
  color,
}: {
  skill: string;
  icon: keyof typeof ICONS;
  color: string;
}) {
  const Icon = ICONS[icon];
  const c = COLORS[color] ?? COLORS.blue;

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl ${c.bg}`}>
          <Icon className={`h-12 w-12 ${c.icon}`} />
        </div>

        {/* Badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${c.badge} mb-4`}>
          <Clock className="h-3 w-3" />
          Coming Soon
        </span>

        <h1 className="text-3xl font-black text-black">IELTS {skill}</h1>
        <p className="mt-3 text-gray-400 leading-relaxed">
          The <span className="font-semibold text-black">{skill}</span> module is currently under development.
          We're working hard to bring you the same exam-quality experience as Reading.
        </p>

        <div className={`mt-8 rounded-2xl bg-gradient-to-br ${c.glow} to-white border border-gray-100 p-5`}>
          <p className="text-sm font-semibold text-black mb-1">What to expect</p>
          <p className="text-sm text-gray-400">
            {skill === "Listening" && "4 sections · 40 questions · 30-minute audio with interactive transcripts"}
            {skill === "Writing" && "Task 1 & Task 2 · AI-powered band scoring · Model answers"}
            {skill === "Speaking" && "3 parts · AI examiner · Instant pronunciation & fluency feedback"}
          </p>
        </div>
      </div>
    </div>
  );
}
