import React from "react";
import { MapPin, Clock, Wallet, ArrowUpRight } from "lucide-react";

/**
 * StudyInNepal — Landing page section
 * -----------------------------------
 * NOTE: University names, courses, durations and fees below are SAMPLE
 * placeholder data. Swap the `universities` array with your real content —
 * the layout flows automatically for any number of entries.
 */

const journey = [
  { label: "Explore", elevation: "1,400m" },
  { label: "Compare", elevation: "2,800m" },
  { label: "Apply", elevation: "4,200m" },
  { label: "Enroll", elevation: "5,364m" },
];

const universities = [
  {
    code: "TU",
    name: "Tribhuvan University",
    location: "Kathmandu",
    course: "BSc. Computer Science & IT",
    duration: "4 years",
    fee: "US $1,200 / yr",
  },
  {
    code: "KU",
    name: "Kathmandu University",
    location: "Dhulikhel",
    course: "Bachelor of Business Administration",
    duration: "4 years",
    fee: "US $1,800 / yr",
  },
  {
    code: "PU",
    name: "Pokhara University",
    location: "Pokhara",
    course: "BHM — Hospitality Management",
    duration: "4 years",
    fee: "US $1,400 / yr",
  },
  {
    code: "PrU",
    name: "Purbanchal University",
    location: "Biratnagar",
    course: "BE — Civil Engineering",
    duration: "4 years",
    fee: "US $1,600 / yr",
  },
  {
    code: "NEC",
    name: "Nepal Engineering College",
    location: "Bhaktapur",
    course: "BE — Computer Engineering",
    duration: "4 years",
    fee: "US $2,000 / yr",
  },
  {
    code: "IOM",
    name: "Institute of Medicine, TU",
    location: "Kathmandu",
    course: "MBBS",
    duration: "5.5 years",
    fee: "US $5,500 / yr",
  },
];

export default function StudyInNepalSection() {
  return (
    <section className="relative w-full bg-[#F2ECDD] text-[#211C14] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .sin-display { font-family: 'Newsreader', serif; font-optical-sizing: auto; }
        .sin-body { font-family: 'Inter', sans-serif; }
        .sin-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        {/* eyebrow */}
        <div className="sin-mono text-xs tracking-[0.25em] uppercase text-[#24564A] mb-5">
          StudyInNepal
        </div>

        {/* heading + subheading + summary */}
        <div className="max-w-2xl">
          <h2 className="sin-display text-4xl md:text-5xl leading-tight font-medium">
            Choosing a university in Nepal, without the guesswork.
          </h2>
          <p className="sin-body text-lg text-[#4A4436] mt-4 font-medium">
            Verified programs. Real tuition. One application.
          </p>
          <p className="sin-body text-[#6B6255] mt-4 text-base leading-relaxed">
            StudyInNepal is a single place to browse accredited degree
            programs across the country's universities, compare tuition and
            course length side by side, and apply once instead of chasing
            down every admissions office on your own.
          </p>
        </div>

        {/* journey — ascent markers, elevation as progress */}
        <div className="mt-16 mb-16">
          <div className="relative max-w-3xl">
            <svg
              className="absolute left-0 right-0 top-4 w-full h-16"
              viewBox="0 0 720 64"
              preserveAspectRatio="none"
            >
              <polyline
                points="20,56 253,42 487,24 700,4"
                fill="none"
                stroke="#24564A"
                strokeOpacity="0.35"
                strokeWidth="2"
              />
            </svg>
            <div className="relative flex items-end justify-between">
              {journey.map((step, i) => (
                <div
                  key={step.label}
                  className="flex flex-col items-center text-center w-1/4 px-2"
                  style={{ marginBottom: `${i * 10}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D98E2B] border-2 border-[#F2ECDD] shadow-sm" />
                  <div className="sin-body text-sm font-medium mt-3">{step.label}</div>
                  <div className="sin-mono text-[10px] text-[#6B6255] mt-1">{step.elevation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* university / course cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {universities.map((u) => (
            <div
              key={u.name}
              className="relative bg-[#FAF6EA] border border-[#DAD0B8] rounded-lg p-6 flex flex-col justify-between hover:border-[#24564A] transition-colors"
            >
              {/* institutional seal */}
              <div className="absolute top-5 right-5 w-11 h-11 rounded-full border-2 border-[#D98E2B] flex items-center justify-center rotate-[-6deg]">
                <span className="sin-mono text-[10px] tracking-wider text-[#D98E2B]">{u.code}</span>
              </div>

              <div className="pr-12">
                <div className="flex items-center gap-1.5 sin-mono text-[11px] uppercase tracking-wider text-[#6B6255]">
                  <MapPin size={12} />
                  {u.location}
                </div>
                <h3 className="sin-display text-xl font-medium mt-3">{u.name}</h3>
                <p className="sin-body text-sm text-[#4A4436] mt-2">{u.course}</p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#DAD0B8]">
                  <div className="flex items-center gap-1.5 sin-mono text-xs text-[#6B6255]">
                    <Clock size={12} />
                    {u.duration}
                  </div>
                  <div className="flex items-center gap-1.5 sin-mono text-xs text-[#D98E2B]">
                    <Wallet size={12} />
                    {u.fee}
                  </div>
                </div>
              </div>

              <button className="sin-body group flex items-center justify-between text-sm mt-6 text-[#211C14] hover:text-[#24564A] transition-colors">
                View program
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-16 pt-10 border-t border-[#DAD0B8]">
          <p className="sin-body text-sm text-[#6B6255] max-w-sm">
            Sample data shown above — connect your own university and course
            list to populate this section.
          </p>
          <button className="sin-body bg-[#24564A] text-[#F2ECDD] font-medium text-sm px-6 py-3 rounded-md hover:bg-[#1B4238] transition-colors whitespace-nowrap">
            Start your application
          </button>
        </div>
      </div>
    </section>
  );
}