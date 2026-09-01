"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProblemsCarousel from "./ProblemsCarousel";
import LoginPortal from "./LoginPortal";
import LanguageSelector from "./LanguageSelector";
import StaffPortal from "./StaffPortal";

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<"operator" | "admin">("operator");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setToastMessage(`🌐 Preferred Language: ${lang}`);
    // Clear toast message after 4 seconds
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  useEffect(() => {
    const handleOpenLogin = () => {
      setLoginOpen(true);
    };
    window.addEventListener("kisansetu_open_login", handleOpenLogin);
    return () => window.removeEventListener("kisansetu_open_login", handleOpenLogin);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      {/* Header Navigation */}
      <Navbar 
        onLoginClick={() => setLoginOpen(true)} 
        onOperatorClick={() => {
          setStaffRole("operator");
          setStaffOpen(true);
        }}
        onAdminClick={() => {
          setStaffRole("admin");
          setStaffOpen(true);
        }}
      />

      {/* Main Hero Viewport */}
      <main className="flex-1 w-full">
        <Hero />
        <ProblemsCarousel />
      </main>

      {/* Premium Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <a href="/" className="flex items-center space-x-2.5">
                <img
                  src="/icon.svg"
                  alt="KisanSetu Logo"
                  className="w-8 h-8 rounded-xl shadow-md shadow-emerald-500/20"
                />
                <span className="text-2xl font-black tracking-tight block">
                  <span className="text-emerald-400">Kisan</span>Setu
                </span>
              </a>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empowering farmers with digitised scheduling, queue tracking, and direct mandi linkage. Built for transparent Indian agriculture.
              </p>
            </div>
            
            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">Farmer Resources</h5>
              <ul className="space-y-2.5 text-sm text-slate-300 font-semibold">
                <li><a href="/centers" className="hover:text-white transition-colors">Find Centers Near Me</a></li>
                <li><a href="/scheduler" className="hover:text-white transition-colors">Book Delivery Token</a></li>
                <li><a href="/queue" className="hover:text-white transition-colors">Live Queue Tracker</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">Governing Support</h5>
              <ul className="space-y-2.5 text-sm text-slate-300 font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">PM-Kisan Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MSP Crop Schemes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">DBT Bank Registration</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">Emergency Mandi Support</h5>
              <p className="text-sm text-slate-300">
                Facing issues with booking or slot delivery? Contact our 24/7 farmer support helpline.
              </p>
              <p className="text-emerald-400 font-bold text-lg mt-3">
                📞 1800-420-1234 (Toll-Free)
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 font-bold">
            <p>© {new Date().getFullYear()} KisanSetu Portal. Designed in support of digital agriculture initiatives.</p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-100 bg-slate-900 text-white border border-slate-800 px-5 py-3 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          {toastMessage}
        </div>
      )}

      {/* Global Modals */}
      <LoginPortal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <StaffPortal isOpen={staffOpen} onClose={() => setStaffOpen(false)} role={staffRole} />
      <LanguageSelector onLanguageSelect={handleLanguageSelect} />
    </div>
  );
}
