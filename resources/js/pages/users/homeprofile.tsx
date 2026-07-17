import React from "react";
import { MapPin, Clock, Wallet, ArrowUpRight, Compass, ListChecks, FileEdit, GraduationCap } from "lucide-react";

/**
 * StudyInNepal — Landing page section
 * -----------------------------------
 * NOTE: All university names, courses, durations and fees below are SAMPLE
 * placeholder data. Swap the `universities` array with your real content —
 * the layout will flow automatically.
 */

const journey = [
  { icon: Compass, label: "Explore", detail: "Browse verified universities" },
  { icon: ListChecks, label: "Compare", detail: "Check courses & tuition" },
  { icon: FileEdit, label: "Apply", detail: "Submit one simple form" },
  { icon: GraduationCap, label: "Enroll", detail: "Start your program" },
];

const universities = [
  {
    name: "Tribhuvan University",
    location: "Kathmandu",
    course: "BSc. Computer Science & IT",
    duration: "4 years",
    fee: "US $1,200 / yr",
  },
  {
    name: "Kathmandu University",
    location: "Dhulikhel",
    course: "Bachelor of Business Administration",
    duration: "4 years",
    fee: "US $1,800 / yr",
  },
  {
    name: "Pokhara University",
    location: "Pokhara",
    course: "BHM — Hospitality Management",
    duration: "4 years",
    fee: "US $1,400 / yr",
  },
];

export default function StudyInNepalSection() {
  return (
    <section className="relative w-full bg-[#FAF8F3] text-[#20262E] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .sin-display { font-family: 'Fraunces', serif; }
        .sin-body { font-family: 'IBM Plex Sans', sans-serif; }
        .sin-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* faint ridge silhouette in the background */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-40 opacity-[0.12] pointer-events-none"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,200 L0,120 L120,40 L220,110 L340,10 L470,100 L600,30 L740,120 L860,60 L980,130 L1100,50 L1200,110 L1200,200 Z"
          fill="#B9812A"
        />
      </svg>

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        {/* eyebrow */}
        <div className="sin-mono text-xs tracking-[0.25em] uppercase text-[#2F8577] mb-5">
          StudyInNepal · Application Platform
        </div>

        {/* headline + subhead */}
        <div className="max-w-2xl">
          <h2 className="sin-display text-4xl md:text-5xl leading-tight font-medium">
            Real universities, honest fees,
            <span className="text-[#B9812A]"> one simple application.</span>
          </h2>
          <p className="sin-body text-[#7C8680] mt-5 text-base md:text-lg leading-relaxed">
            StudyInNepal helps students find and apply to affordable, verified
            degree programs across Nepal — with transparent tuition, clear
            course details, and a single application you can track from your
            phone.
          </p>
        </div>

        {/* journey / trail signature element */}
        <div className="mt-16 mb-16">
          <div className="relative flex items-start justify-between max-w-3xl">
            <div className="absolute top-5 left-0 right-0 h-px bg-[#E3DED2]" />
            {journey.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative flex flex-col items-center text-center w-1/4 px-2">
                  <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E3DED2] flex items-center justify-center z-10">
                    <Icon size={16} className="text-[#2F8577]" />
                  </div>
                  <div className="sin-mono text-[10px] tracking-widest uppercase text-[#7C8680] mt-3">
                    0{i + 1}
                  </div>
                  <div className="sin-body text-sm font-medium mt-1">{step.label}</div>
                  <div className="sin-body text-xs text-[#7C8680] mt-1 hidden md:block">
                    {step.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* university / course cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {universities.map((u) => (
            <div
              key={u.name}
              className="bg-[#FFFFFF] border border-[#E3DED2] rounded-lg p-6 flex flex-col justify-between hover:border-[#2F8577] transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 sin-mono text-[11px] uppercase tracking-wider text-[#7C8680]">
                  <MapPin size={12} />
                  {u.location}
                </div>
                <h3 className="sin-display text-xl font-medium mt-3">{u.name}</h3>
                <p className="sin-body text-sm text-[#4A5560] mt-2">{u.course}</p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E3DED2]">
                  <div className="flex items-center gap-1.5 sin-mono text-xs text-[#7C8680]">
                    <Clock size={12} />
                    {u.duration}
                  </div>
                  <div className="flex items-center gap-1.5 sin-mono text-xs text-[#B9812A]">
                    <Wallet size={12} />
                    {u.fee}
                  </div>
                </div>
              </div>

              <button className="sin-body group flex items-center justify-between text-sm mt-6 text-[#20262E] hover:text-[#2F8577] transition-colors">
                View program
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-16 pt-10 border-t border-[#E3DED2]">
          <p className="sin-body text-sm text-[#7C8680] max-w-sm">
            Sample data shown above — connect your own university and course
            list to populate this section.
          </p>
          <button className="sin-body bg-[#e3dfd9] text-[#FAF8F3] font-medium text-sm px-6 py-3 rounded-md hover:bg-[#CE9646] transition-colors whitespace-nowrap">
            Start your application
          </button>
        </div>
      </div>
    </section>
  );
}