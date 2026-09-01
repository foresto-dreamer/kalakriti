"use client";

import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Slide {
  id: number;
  farmer: string;
  location: string;
  problemTitle: string;
  problem: string;
  solutionTitle: string;
  solution: string;
  problemIcon: React.ReactNode;
  solutionIcon: React.ReactNode;
}

export default function ProblemsCarousel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const slides: Slide[] = [
    {
      id: 0,
      farmer: "Harpreet Singh",
      location: "Sangrur, Punjab",
      problemTitle: "18-Hour Queue Delays",
      problem: "I used to line up my tractor at the mandi gate for 18 hours in the burning heat, wasting fuel and food, just waiting for my turn to deliver grain.",
      solutionTitle: "KisanSetu Live Token Scheduler",
      solution: "Now, I book a delivery schedule slot online, track the queue status on my phone, and arrive exactly when my token is next. No waiting!",
      problemIcon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      solutionIcon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 1,
      farmer: "Devendra Patra",
      location: "Bargarh, Odisha",
      problemTitle: "Traveling to Closed Mandis",
      problem: "Last season, I traveled 15km with my harvest only to find the center had run out of capacity. I had to pay extra for overnight tractor rent.",
      solutionTitle: "Real-Time Mandi Capacity Meter",
      solution: "KisanSetu displays live space utilization and wait times for every hub. I check capacity before loading my crop, ensuring a guaranteed entry.",
      problemIcon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      solutionIcon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      )
    },
    {
      id: 2,
      farmer: "Ramesh Naskar",
      location: "Burdwan, West Bengal",
      problemTitle: "Payment Delays of 2-3 Months",
      problem: "After selling my crop, it used to take months of visits to cooperative banks and commission agents to get my hard-earned payment cleared.",
      solutionTitle: "Direct Benefit Transfer (DBT)",
      solution: "With KisanSetu portal registration, my crop sales invoice is verified instantly at the gate, and MSP payout is credited to my bank account in 72 hours.",
      problemIcon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      solutionIcon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  // Mobile Auto-play slide animation every 6 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        if (container.clientWidth < container.scrollWidth) {
          const nextIndex = (activeTab + 1) % slides.length;
          const targetLeft = nextIndex * (container.scrollWidth / slides.length);
          container.scrollTo({
            left: targetLeft,
            behavior: "smooth"
          });
          setActiveTab(nextIndex);
        }
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [activeTab, slides.length]);

  return (
    <section className="py-20 bg-slate-950 text-white overflow-hidden relative z-20 border-t border-slate-900">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            Real Challenges • Smart Resolutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black mt-4 tracking-tight">
            How KisanSetu Solves Key Farmer Painpoints
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Directly addressing procurement inefficiencies with a modern, transparent digital infrastructure.
          </p>
        </div>

        {/* 1. PC SCREEN VIEW: TWO ALIGNED ROWS WITH GRAPHICAL CONNECTORS */}
        <div className="hidden md:block space-y-6">
          {/* Row 1: The Problems */}
          <div className="grid grid-cols-3 gap-6">
            {slides.map((slide) => (
              <div 
                key={`pc-prob-${slide.id}`}
                className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-rose-500/30 transition-all duration-300 shadow-md group relative overflow-hidden"
              >
                {/* Accent top gradient on hover */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      {slide.problemIcon}
                    </span>
                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider">
                      Challenge
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                      {slide.problemTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 italic mt-2.5 leading-relaxed font-medium">
                      "{slide.problem}"
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between">
                  <div>
                    <span className="block font-black text-slate-200 text-xs">{slide.farmer}</span>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      📍 {slide.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Row Connectors */}
          <div className="flex justify-around items-center py-2 px-10">
            {slides.map((slide) => (
              <div key={`pc-conn-${slide.id}`} className="w-1/3 flex flex-col items-center">
                <div className="w-px h-8 border-l-2 border-dashed border-slate-700/60"></div>
                <div className="bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-400 px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                  Resolved By
                </div>
                <div className="w-px h-6 border-l-2 border-dashed border-emerald-600/60"></div>
              </div>
            ))}
          </div>

          {/* Row 2: The KisanSetu Solutions */}
          <div className="grid grid-cols-3 gap-6">
            {slides.map((slide) => (
              <div 
                key={`pc-sol-${slide.id}`}
                className="bg-emerald-950/5 border border-emerald-500/20 hover:border-emerald-500/40 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-md group relative overflow-hidden"
              >
                {/* Accent top gradient */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500/40"></div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      {slide.solutionIcon}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                      Solution
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-400">
                      {slide.solutionTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-semibold">
                      {slide.solution}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-emerald-500/15 mt-5">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    ✓ Verified Advantage
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. MOBILE SCREEN VIEW: HORIZONTAL SCROLL OF INTERACTIVE PAIRS */}
        <div className="md:hidden space-y-4">
          {/* Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            onScroll={(e) => {
              const scrollLeft = e.currentTarget.scrollLeft;
              const width = e.currentTarget.clientWidth;
              if (width > 0) {
                const newIndex = Math.round(scrollLeft / width);
                if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeTab) {
                  setActiveTab(newIndex);
                }
              }
            }}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 no-scrollbar scroll-smooth"
          >
            {slides.map((slide) => (
              <div 
                key={`mob-pair-${slide.id}`}
                className="w-[85vw] sm:w-[360px] shrink-0 snap-center flex flex-col gap-3"
              >
                {/* Problem Card */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        {slide.problemIcon}
                      </span>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider">
                        Challenge
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {slide.problemTitle}
                      </h4>
                      <p className="text-xs text-slate-400 italic mt-2 leading-relaxed">
                        "{slide.problem}"
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <div>
                      <span className="block font-black text-slate-200 text-[11px]">{slide.farmer}</span>
                      <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">📍 {slide.location}</span>
                    </div>
                  </div>
                </div>

                {/* Connecting Divider Badge */}
                <div className="flex justify-center -my-1 z-10">
                  <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-emerald-400 flex items-center gap-1 shadow-md uppercase tracking-wider">
                    <span>Solved By KisanSetu</span>
                    <span>↓</span>
                  </div>
                </div>

                {/* Solution Card */}
                <div className="bg-emerald-950/10 border border-emerald-500/20 p-5 rounded-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/30"></div>
                  
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        {slide.solutionIcon}
                      </span>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                        Solution
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-400">
                        {slide.solutionTitle}
                      </h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed font-semibold">
                        {slide.solution}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-500/10 mt-4">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                      ✓ Instant Benefit
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Swipe Indicators */}
          <div className="flex justify-center space-x-1.5 pt-1">
            {slides.map((_, idx) => (
              <div 
                key={`mob-dot-${idx}`}
                className="h-1.5 w-4 rounded-full bg-slate-800 transition-colors"
                style={{ backgroundColor: activeTab === idx ? "#10b981" : "#1e293b" }}
              />
            ))}
          </div>
          <p className="text-[10px] text-center text-slate-500 font-medium">
            Swipe left/right to view other challenges ↔
          </p>
        </div>
      </div>
    </section>
  );
}
