"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Icon3D } from "@/components/ui/Icon3D";

const UNIVERSITIES = [
  { name: "Harvard University", short: "H",    location: "Cambridge, USA",     band: "7.0", color: "#A51C30", accent: "#FFD700", light: "#FEF2F2", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Harvard_University_shield.svg" },
  { name: "MIT",                short: "MIT",  location: "Cambridge, USA",     band: "7.0", color: "#8A1224", accent: "#C0C0C0", light: "#FFF1F2", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5d/MIT_logo_2003-2023.svg" },
  { name: "WIUT Tashkent",      short: "W",    location: "Tashkent, UZ",       band: "6.5", color: "#1B3A6B", accent: "#C0C0C0", light: "#EFF6FF", logo: "https://www.wiut.uz/images/logo/logo-wiut-25_white_short.svg", logoBg: "#1B3A6B" },
  { name: "Webster University", short: "W",    location: "Webster Groves, USA", band: "6.0", color: "#003865", accent: "#B5985A", light: "#EFF6FF", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Webster_University_Logo.svg" },
  { name: "UWED",               short: "UWED", location: "Tashkent, UZ",       band: "6.5", color: "#004B8D", accent: "#FFD700", light: "#EFF6FF", logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/The_University_of_World_Economy_and_Diplomacy_logo.jpg" },
  { name: "MDIS",               short: "MDIS", location: "Singapore",          band: "6.0", color: "#1A3A6B", accent: "#C0C0C0", light: "#EFF6FF", logo: "https://upload.wikimedia.org/wikipedia/en/a/a9/Management_Development_Institute_of_Singapore_logo.png" },
];

const SKILLS = [
  {
    icon: "book" as const,
    label: "Reading",
    tag: "Live",
    tagColor: "bg-green-100 text-green-700",
    color: "bg-red-50",
    fg: "text-red-500",
    border: "border-red-200",
    desc: "Authentic Academic passages with all question types, 3-colour highlighting, and instant band scoring.",
    href: "/register",
  },
  {
    icon: "headset" as const,
    label: "Listening",
    tag: "Coming Soon",
    tagColor: "bg-blue-100 text-blue-700",
    color: "bg-blue-50",
    fg: "text-blue-500",
    border: "border-blue-100",
    desc: "4 audio sections, 40 questions, 30-minute timed exam with real IELTS recordings.",
    href: null,
  },
  {
    icon: "pencil" as const,
    label: "Writing",
    tag: "Coming Soon",
    tagColor: "bg-amber-100 text-amber-700",
    color: "bg-amber-50",
    fg: "text-amber-500",
    border: "border-amber-100",
    desc: "Task 1 & Task 2 with AI-powered band scoring and model answers for every question.",
    href: null,
  },
  {
    icon: "microphone" as const,
    label: "Speaking",
    tag: "Coming Soon",
    tagColor: "bg-purple-100 text-purple-700",
    color: "bg-purple-50",
    fg: "text-purple-500",
    border: "border-purple-100",
    desc: "3-part speaking exam with AI examiner and real-time pronunciation feedback.",
    href: null,
  },
];

function UniLogo({ logo, short, color, accent, logoBg }: { logo: string; short: string; color: string; accent: string; logoBg?: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <svg viewBox="0 0 80 92" className="h-full w-full flex-shrink-0 drop-shadow-sm" fill="none">
      <path d="M4 4 H76 V56 Q40 88 4 56 Z" fill={color} />
      <text x="40" y="50" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily="Georgia, serif" fontWeight="bold" fontSize={short.length > 2 ? "14" : "20"}>{short}</text>
    </svg>
  );
  return (
    <div className="h-full w-full flex items-center justify-center rounded-2xl overflow-hidden"
      style={logoBg ? { background: logoBg, padding: "14px" } : undefined}>
      <img src={logo} alt={short} onError={() => setErr(true)} className="h-full w-full object-contain drop-shadow-sm" />
    </div>
  );
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

function SliderArrow({ dir, onClick }: { dir: "prev" | "next"; onClick?: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-black shadow-md transition hover:bg-gray-50 sm:flex ${dir === "prev" ? "-left-4" : "-right-4"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function slidesForWidth(w: number) {
  if (w < 480) return 2;
  if (w < 768) return 3;
  if (w < 1024) return 4;
  if (w < 1280) return 5;
  return 6;
}

// react-slick's `responsive` prop only re-evaluates on a resize event (it
// relies on matchMedia's change listener), so it picks the base
// `slidesToShow` on first paint even when a phone-width media query already
// matches. Tracking the width ourselves keeps the initial render correct.
function useResponsiveSlidesToShow() {
  // Must match between server and client's first render, so this can't read
  // `window` directly — the real value is set in the effect below, right
  // after mount.
  const [slides, setSlides] = useState(3);
  useEffect(() => {
    const update = () => setSlides(slidesForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return slides;
}

function UniversitiesSlider() {
  const slidesToShow = useResponsiveSlidesToShow();
  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2200,
    pauseOnHover: true,
    arrows: true,
    prevArrow: <SliderArrow dir="prev" />,
    nextArrow: <SliderArrow dir="next" />,
  };
  return (
    <Slider {...settings} className="uni-slider">
      {UNIVERSITIES.map((uni, i) => (
        <div key={uni.name} className="px-2 sm:px-3">
          <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
            <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 animate-float" style={{ animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i * 0.3}s` }}>
              <UniLogo logo={uni.logo} short={uni.short} color={uni.color} accent={uni.accent} logoBg={(uni as any).logoBg} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-black leading-tight">{uni.name}</p>
              <p className="mt-0.5 text-[10px] sm:text-xs text-gray-400">{uni.location}</p>
              <span className="mt-2 inline-block rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-white" style={{ background: uni.color }}>
                Band {uni.band}
              </span>
            </div>
          </div>
        </div>
      ))}
    </Slider>
  );
}

function Reveal({ children, className = "", delay = 0, dir = "up" }: {
  children: React.ReactNode; className?: string; delay?: number; dir?: "up" | "left" | "right" | "scale";
}) {
  const [ref, visible] = useInView();
  const anim = dir === "left" ? "animate-slide-left" : dir === "right" ? "animate-slide-right" : dir === "scale" ? "animate-scale-up" : "animate-fade-up";
  return (
    <div ref={ref} className={`${className} ${visible ? anim : "opacity-0"}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-screen-xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center">
              <Icon3D name="graduation-cap" size={36} />
            </div>
            <span className="font-extrabold tracking-tight text-black text-[14px] sm:text-[15px] leading-tight">
              Real IELTS<br />
              <span className="text-red-500 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">Prep</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-3 sm:px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-red-500 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-bold text-white shadow-sm shadow-red-200 hover:bg-red-600 transition">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white pb-12 pt-12 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(254,226,226,0.7),transparent)]" />

        <div className="relative mx-auto max-w-screen-xl px-4 sm:px-8">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <div className="animate-fade-up delay-0 mb-5 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-black">
                <Icon3D name="lightning-bolt" size={18} />
                All 4 IELTS skills · Free to start
              </div>

              <h1 className="animate-fade-up delay-75 text-4xl sm:text-5xl font-black leading-[1.06] tracking-tight text-black lg:text-6xl xl:text-7xl">
                Master every<br />
                IELTS skill.<br />
                <span className="text-red-500">Ace the exam.</span>
              </h1>

              <p className="animate-fade-up delay-150 mx-auto mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-gray-500 lg:mx-0">
                Full-length timed practice for Reading, Listening, Writing, and Speaking —
                with real exam conditions and instant band scoring.
              </p>

              <div className="animate-fade-up delay-225 mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/register" className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-red-500 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-red-200/60 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-xl transition-all">
                  Start practising free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 text-sm sm:text-base font-medium text-black hover:bg-gray-50 transition-all">
                  Sign in
                </Link>
              </div>
            </div>

            {/* Right — app preview card */}
            <div className="animate-fade-up delay-150 relative flex-1 w-full max-w-[580px]">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-red-100 via-rose-50 to-white blur-2xl opacity-70" />

              <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl shadow-gray-300/40">
                {/* Chrome bar */}
                <div className="flex items-center justify-between border-b border-red-100 bg-gray-50 px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    IELTS Academic · Passage 2
                  </span>
                  <span className="rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white tabular-nums">
                    45:21
                  </span>
                </div>

                {/* Passage tabs */}
                <div className="flex border-b border-red-100 bg-gray-50/60">
                  {["Passage 1", "Passage 2", "Passage 3"].map((p, i) => (
                    <div key={p} className={`border-r border-red-100 px-5 py-2.5 text-xs font-semibold ${i === 1 ? "border-b-2 border-b-red-500 text-black bg-white" : "text-gray-400"}`}>
                      {p}
                    </div>
                  ))}
                </div>

                {/* Split */}
                <div className="flex" style={{ minHeight: 320 }}>
                  {/* Passage skeleton */}
                  <div className="w-1/2 border-r border-red-100 p-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-black">Passage</p>
                    <div className="space-y-2.5">
                      {[100, 88, 100, null, 82, 100, 70].map((w, i) =>
                        w ? (
                          <div key={i} className="h-2.5 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
                        ) : (
                          <div key={i} className="flex gap-2">
                            <div className="h-2.5 w-20 rounded-full" style={{ background: "#FEF08A" }} />
                            <div className="h-2.5 flex-1 rounded-full bg-gray-100" />
                          </div>
                        )
                      )}
                      <div className="mt-3 space-y-2.5">
                        <div className="h-2.5 w-full rounded-full bg-gray-100" />
                        <div className="flex gap-2">
                          <div className="h-2.5 w-6 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-28 rounded-full" style={{ background: "#FCA5A5" }} />
                          <div className="h-2.5 flex-1 rounded-full bg-gray-100" />
                        </div>
                        <div className="h-2.5 w-4/5 rounded-full bg-gray-100" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      {["#FEF08A", "#86EFAC", "#FCA5A5"].map((c) => (
                        <div key={c} className="h-4 w-4 rounded-sm border border-black/5" style={{ background: c }} />
                      ))}
                      <span className="text-[10px] text-gray-400">Highlight</span>
                    </div>
                  </div>

                  {/* Question skeleton */}
                  <div className="flex-1 p-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-black">Question 7</p>
                    <div className="mb-5 space-y-2">
                      <div className="h-2.5 w-full rounded-full bg-gray-100" />
                      <div className="h-2.5 w-4/5 rounded-full bg-gray-100" />
                    </div>
                    <div className="space-y-2.5">
                      {[false, true, false, false].map((sel, i) => (
                        <div key={i} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${sel ? "border-red-200 bg-gray-50" : "border-red-100 bg-gray-50"}`}>
                          <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${sel ? "border-red-500 bg-red-500" : "border-gray-300"}`}>
                            {sel && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <div className={`h-2 rounded-full ${sel ? "bg-red-200 w-4/5" : "bg-gray-200 w-3/4"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between border-t border-red-100 bg-gray-50 px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-gray-600">7 of 40</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className={`h-1 w-3 rounded-full ${i < 7 ? "bg-gray-600" : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">Auto-saved</span>
                </div>
              </div>

              {/* Floating badge — band score */}
              <div className="animate-float absolute -bottom-5 -left-6 z-10 rounded-2xl border border-red-100 bg-white px-4 py-3.5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Icon3D name="trophy" size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">Band 7.5</p>
                    <p className="text-[11px] text-gray-400">New personal best!</p>
                  </div>
                </div>
              </div>

              {/* Floating badge — your band */}
              <div className="animate-float absolute -right-5 top-10 z-10 rounded-2xl border border-red-100 bg-white p-4 shadow-xl" style={{ animationDelay: "1s" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Your Band</p>
                <p className="mt-0.5 text-3xl font-black text-black">6.5</p>
                <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[63%] rounded-full bg-red-500" />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">IELTS scale 1–9</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-screen-xl px-8">
          <div className="grid grid-cols-2 divide-x divide-gray-100 md:grid-cols-4">
            {[
              { value: "4", label: "IELTS skills covered" },
              { value: "40", label: "Questions per test" },
              { value: "60 min", label: "Timed conditions" },
              { value: "1.0–9.0", label: "IELTS band scale" },
            ].map(({ value, label }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="py-8 text-center">
                  <p className="text-2xl font-black text-black lg:text-3xl">{value}</p>
                  <p className="mt-1 text-sm text-gray-400">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 SKILLS SECTION ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-screen-xl px-8">
          <Reveal className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-gray-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black">
              All Modules
            </span>
            <h2 className="text-4xl font-black tracking-tight text-black">
              One platform. All 4 skills.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
              Start with Reading today — Listening, Writing, and Speaking are coming soon.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map(({ icon, label, tag, tagColor, color, border, desc, href }, i) => (
              <Reveal key={label} delay={i * 80} dir="up">
                <div className={`group flex h-full flex-col rounded-2xl border ${border} bg-white p-6 shadow-sm transition-all duration-300 ${href ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-70"}`}>
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                    <Icon3D name={icon} size={30} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold text-black">{label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tagColor}`}>{tag}</span>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-gray-400">{desc}</p>
                  {href ? (
                    <Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-black hover:gap-2.5 transition-all">
                      Start practising <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-300">
                      <Icon3D name="time" size={16} /> In development
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIVERSITIES ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-8">
          <Reveal className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full bg-gray-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black">
              Top Universities
            </span>
            <h2 className="text-4xl font-black tracking-tight text-black">Your IELTS score opens doors</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
              Minimum IELTS band required for admission to the world's most prestigious universities.
            </p>
          </Reveal>

          <Reveal dir="up">
            <UniversitiesSlider />
          </Reveal>
          <Reveal className="mt-10 text-center">
            <p className="text-sm text-gray-400">* Requirements may vary by faculty. Always check the official university website.</p>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES (Reading) ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-screen-xl px-8">
          <Reveal className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-500">
              Reading Module
            </span>
            <h2 className="text-4xl font-black tracking-tight text-black">Built for exam success</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
              Every Reading feature mirrors real IELTS Academic conditions.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "document" as const,   bg: "bg-gray-50",   ring: "hover:ring-red-200",    title: "Authentic passages",    desc: "Three-passage Academic format with all real question types: MCQ, True/False/NG, matching headings, fill-in-the-blank and more." },
              { icon: "marker" as const,     bg: "bg-amber-50",  ring: "hover:ring-amber-200",  title: "3-colour highlighting", desc: "Select any text to mark it yellow, green, or red. Highlights save automatically and stay across page reloads." },
              { icon: "alarm-clock" as const, bg: "bg-green-50", ring: "hover:ring-green-200",  title: "Real-time countdown",   desc: "60-minute timer that auto-submits when time runs out — just like in the exam room." },
              { icon: "bar-chart" as const,  bg: "bg-blue-50",   ring: "hover:ring-blue-200",   title: "Instant band score",    desc: "Get your official IELTS band score (1.0–9.0) from the conversion table the moment you submit." },
              { icon: "line-chart" as const, bg: "bg-purple-50", ring: "hover:ring-purple-200", title: "Progress tracking",     desc: "See your full results history, average band score trend, and best score at a glance." },
              { icon: "brain" as const,      bg: "bg-gray-50",   ring: "hover:ring-rose-200",   title: "Answer explanations",   desc: "Every question shows the correct answer with a clear explanation so you know exactly where you went wrong." },
            ].map(({ icon, bg, ring, title, desc }, i) => (
              <Reveal key={title} delay={i * 60} dir="up">
                <div className={`group h-full cursor-default rounded-2xl border border-gray-100 bg-white p-7 shadow-sm ring-2 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${ring}`}>
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                    <Icon3D name={icon} size={30} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-black">{title}</h3>
                  <p className="text-[15px] leading-relaxed text-gray-400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative overflow-hidden bg-gray-50 py-24">
        <div className="relative mx-auto max-w-screen-xl px-8">
          <Reveal className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-gray-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black">
              How it works
            </span>
            <h2 className="text-4xl font-black tracking-tight text-black">Three steps to a higher band</h2>
          </Reveal>

          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute left-[calc(16.7%+40px)] right-[calc(16.7%+40px)] top-10 hidden h-px bg-gradient-to-r from-red-200 via-red-300 to-red-200 md:block" />
            {[
              { step: "01", icon: "cursor" as const,   title: "Choose a test",      desc: "Browse available IELTS Academic Reading tests — each has three passages and 40 questions." },
              { step: "02", icon: "document" as const, title: "Read & answer",      desc: "Work through passages and questions within 60 minutes. Highlight key evidence as you go." },
              { step: "03", icon: "trophy" as const,   title: "See your band score", desc: "Get your band score instantly. Review every answer with correct answers and clear explanations." },
            ].map(({ step, icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 120} dir="up">
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-100 bg-white shadow-lg shadow-red-100/50">
                    <Icon3D name={icon} size={44} />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">{step}</span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-black">{title}</h3>
                  <p className="max-w-xs text-[15px] leading-relaxed text-gray-400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-white py-28">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(254,226,226,0.6),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(254,226,226,0.4),transparent)]" />

        <Reveal className="relative mx-auto max-w-2xl px-8 text-center" dir="scale">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center">
            <Icon3D name="graduation-cap" size={72} />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-black lg:text-5xl">
            Your target band<br />is achievable.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-gray-400">
            Start with a free Reading practice test today — no payment, no setup.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="flex items-center gap-2 rounded-full bg-red-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-red-200/70 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-2xl transition-all">
              Create free account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="rounded-full border border-gray-200 px-8 py-4 text-base font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Sign in
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {["No credit card", "Free forever", "Instant access"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Icon3D name="checkmark" size={16} /> {t}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-screen-xl px-6 sm:px-10">
          <Reveal>
            <div className="mb-14 text-center">
              <span className="inline-block rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-500 mb-4">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-black">Simple, honest pricing</h2>
              <p className="mt-3 text-gray-400 text-base max-w-md mx-auto">Start free, upgrade when you're ready</p>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto items-end">

            {/* Free */}
            <Reveal>
              <div className="flex flex-col rounded-2xl border border-gray-200 bg-white px-7 py-8 h-full shadow-sm">
                <div className="mb-6">
                  {/* Book */}
                  <div className="mb-5 flex justify-center">
                    <Icon3D name="book" size={80} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Free</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-black">0</span>
                    <span className="text-sm font-medium text-gray-400">so'm</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Always free</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {["10 practice reading tests","All question types","Instant band scoring"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <Icon3D name="checkmark" size={16} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className="block w-full rounded-full border-2 border-gray-200 py-2.5 text-center text-sm font-bold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition">
                  Get started
                </Link>
              </div>
            </Reveal>

            {/* Lite */}
            <Reveal>
              <div className="flex flex-col rounded-2xl border-2 border-red-200 bg-rose-50 px-7 py-8 h-full shadow-md shadow-red-100">
                <div className="mb-6">
                  {/* Rocket */}
                  <div className="mb-5 flex justify-center">
                    <Icon3D name="rocket" size={96} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Lite</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-black">50,000</span>
                    <span className="text-sm font-medium text-gray-400">so'm</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">30 days</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {["Everything in Free","All IELTS Volume tests","Unlimited attempts"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Icon3D name="checkmark" size={16} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-red-500 py-2.5 text-center text-sm font-bold text-white hover:bg-red-600 transition shadow-md shadow-red-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Get via Telegram
                </a>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal>
              <div className="flex flex-col rounded-2xl border-2 border-red-500 bg-gradient-to-b from-red-500 to-red-600 px-7 py-8 h-full shadow-xl shadow-red-300/50 relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-red-600 shadow-md">
                    <Icon3D name="star" size={16} />
                    Most popular
                  </span>
                </div>
                <div className="mb-6">
                  {/* Trophy */}
                  <div className="mb-5 flex justify-center">
                    <Icon3D name="trophy" size={96} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-1">Pro</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">150,000</span>
                    <span className="text-sm font-medium text-red-200">so'm</span>
                  </div>
                  <p className="mt-1 text-xs text-red-200">30 days</p>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {[
                    "Everything in Lite",
                    "Predicted tests (pre-exam)",
                    "Most frequently tested topics",
                    "Maximum score guarantee",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-red-50">
                      <Icon3D name="checkmark" size={16} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-white py-2.5 text-center text-sm font-bold text-red-600 hover:bg-red-50 transition shadow-md">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Get via Telegram
                </a>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── CONTACT ADMIN ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-screen-xl px-8">
          <Reveal>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-gray-100 bg-gray-50 px-6 py-10 text-center sm:px-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2AABEE] shadow-sm">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-black sm:text-3xl">Got a question?</h2>
                <p className="mt-2 max-w-md text-sm sm:text-base text-gray-500">
                  For billing, plans, or anything about the platform, reach out to the admin directly on Telegram.
                </p>
              </div>
              <a href="https://t.me/nvrmuhammad" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#2AABEE] px-7 py-3 text-sm sm:text-base font-bold text-white shadow-md shadow-blue-200/60 hover:bg-[#229ED9] hover:-translate-y-0.5 transition-all">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Contact Admin
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center">
              <Icon3D name="graduation-cap" size={32} />
            </div>
            <span className="font-bold text-black text-sm">Real IELTS <span className="text-red-500">Prep</span></span>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 Real IELTS Prep · Free for all students. ·{" "}
            <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              3D icons by Icons8
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
