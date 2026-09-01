"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useTranslation } from "@/hooks/useTranslation";
import { useSearchParams } from "next/navigation";

export interface FarmerBookingPass {
  tokenId: string;
  tokenNumber?: number;
  farmerName: string;
  farmerPhone?: string;
  phone?: string;
  center: string;
  crop: string;
  weight: number;
  date: string;
  timeSlot: string;
  confirmationStatus?: string;
  qrCode?: string;
}

const DEFAULT_DEMO_PASS: FarmerBookingPass = {
  tokenId: "KS-781920",
  tokenNumber: 112,
  farmerName: "Ramesh Kumar",
  farmerPhone: "+91 98765 43210",
  center: "Chandaka RMC Procurement Yard, Odisha",
  crop: "Paddy (Common)",
  weight: 35.0,
  date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  timeSlot: "08:00 AM - 10:00 AM",
  confirmationStatus: "Confirmed",
};

export default function FarmerPassView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [pass, setPass] = useState<FarmerBookingPass>(DEFAULT_DEMO_PASS);
  const [generatedQr, setGeneratedQr] = useState<string>("");
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isPassUsed, setIsPassUsed] = useState(false);
  const [usedTimestamp, setUsedTimestamp] = useState<string>("");

  // Function to verify if token has been scanned by operator
  const checkTokenConsumption = (targetTokenId: string, targetTokenNum?: number) => {
    if (typeof window === "undefined") return false;
    try {
      const usedTokens = JSON.parse(localStorage.getItem("kisanSetu_used_tokens") || "[]");
      const numStr = String(targetTokenNum || targetTokenId.replace(/\D/g, ""));
      const isUsed = usedTokens.includes(targetTokenId) || (numStr && usedTokens.includes(numStr));

      if (isUsed) {
        setIsPassUsed(true);
        setUsedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        return true;
      }

      // Also check checked-in registry
      const registry = JSON.parse(localStorage.getItem("kisanSetu_checked_in_registry") || "[]");
      if (Array.isArray(registry)) {
        const found = registry.find(
          (f) => String(f.tokenNumber) === numStr || f.farmerName?.toLowerCase() === pass.farmerName?.toLowerCase()
        );
        if (found) {
          setIsPassUsed(true);
          setUsedTimestamp(found.checkInTime || "Today");
          return true;
        }
      }
    } catch {}
    setIsPassUsed(false);
    return false;
  };

  useEffect(() => {
    const loadBooking = async () => {
      let activePass = DEFAULT_DEMO_PASS;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("kisanSetu_latest_booking");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.tokenId || parsed.center)) {
              activePass = {
                ...DEFAULT_DEMO_PASS,
                ...parsed,
              };
            }
          } catch {}
        }

        const farmerProfile = localStorage.getItem("farmer_profile") || localStorage.getItem("kisanSetu_farmer_profile");
        if (farmerProfile) {
          try {
            const p = JSON.parse(farmerProfile);
            if (p.name) activePass.farmerName = p.name;
            if (p.phone) activePass.farmerPhone = p.phone;
          } catch {}
        }
      }

      if (urlToken) {
        const num = urlToken.replace(/\D/g, "");
        activePass = {
          ...activePass,
          tokenId: urlToken.startsWith("KS-") ? urlToken : `KS-${num || urlToken}`,
          tokenNumber: Number(num) || activePass.tokenNumber,
        };
      }

      setPass(activePass);
      checkTokenConsumption(activePass.tokenId, activePass.tokenNumber);

      const qrPayload = JSON.stringify({
        tokenId: activePass.tokenId,
        tokenNumber: activePass.tokenNumber || Number(activePass.tokenId.replace(/\D/g, "")) || 112,
        farmerName: activePass.farmerName,
        phone: activePass.farmerPhone || activePass.phone || "+91 98765 43210",
        center: activePass.center,
        crop: activePass.crop,
        weight: activePass.weight,
        date: activePass.date,
        timeSlot: activePass.timeSlot,
        oneTimePass: true,
        valid: !isPassUsed,
        issuedAt: new Date().toISOString(),
      });

      try {
        const dataUrl = await QRCode.toDataURL(qrPayload, {
          margin: 1,
          width: 420,
          errorCorrectionLevel: "H",
          color: {
            dark: "#022c22",
            light: "#ffffff",
          },
        });
        setGeneratedQr(dataUrl);
      } catch (err) {
        console.error("QR Generation error:", err);
      }
    };

    loadBooking();

    // Listen for storage events (e.g. when operator scans in another tab)
    const handleStorageChange = () => {
      checkTokenConsumption(pass.tokenId, pass.tokenNumber);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [urlToken]);

  // Test scan simulation toggle
  const togglePassScanSimulation = () => {
    if (typeof window === "undefined") return;
    try {
      const used = JSON.parse(localStorage.getItem("kisanSetu_used_tokens") || "[]");
      if (isPassUsed) {
        // Reset
        const filtered = used.filter((t: string) => t !== pass.tokenId && t !== String(pass.tokenNumber));
        localStorage.setItem("kisanSetu_used_tokens", JSON.stringify(filtered));
        setIsPassUsed(false);
      } else {
        // Mark as scanned
        if (!used.includes(pass.tokenId)) used.push(pass.tokenId);
        if (pass.tokenNumber && !used.includes(String(pass.tokenNumber))) used.push(String(pass.tokenNumber));
        localStorage.setItem("kisanSetu_used_tokens", JSON.stringify(used));
        setIsPassUsed(true);
        setUsedTimestamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const copyTokenNumber = () => {
    navigator.clipboard?.writeText(pass.tokenId);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans print:min-h-0 print:bg-white print:p-0 print:m-0">
      <div className="max-w-3xl mx-auto print:max-w-none print:w-full">
        {/* Page Top Header */}
        <div className="text-center mb-6 print:hidden">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("pass_page_title") || "Official Gate Pass & Scannable QR Code"}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
            {t("pass_page_desc") || "Show this scannable QR code at the APMC gate for instant contactless check-in."}
          </p>
        </div>

        {/* OFFICIAL GATE PASS SLIP */}
        <div
          id="printable-gate-pass"
          className={`rounded-3xl p-5 sm:p-7 shadow-2xl border-2 relative overflow-hidden printable-slip-area print:border-2 print:border-black print:shadow-none print:p-4 print:text-black print:bg-white print:rounded-none ${
            isPassUsed
              ? "bg-slate-950 text-white border-rose-500/50"
              : "bg-slate-950 text-white border-emerald-500/40"
          }`}
        >
          {/* Watermark badge */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full flex items-start justify-end p-2.5 font-black text-[9px] uppercase tracking-widest pointer-events-none print:hidden ${
              isPassUsed ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isPassUsed ? (t("pass_watermark_used") || "PASS USED") : (t("pass_watermark_valid") || "VALID PASS")}
          </div>

          {/* Slip Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800 print:border-b-2 print:border-dashed print:border-slate-300 print:pb-2">
            <img src="/icon.svg" alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md border border-slate-700 print:border-none" />
            <div>
              <span className="text-[8.5px] sm:text-[9.5px] font-extrabold text-emerald-400 print:text-emerald-800 uppercase tracking-widest block">
                {t("pass_gov_ministry") || "Government of India • Ministry of Agriculture & Farmers Welfare"}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white print:text-slate-900 tracking-tight leading-none mt-0.5">
                {t("pass_yard_entry_title") || "APMC YARD ENTRY GATE PASS"}
              </h2>
              <p className="text-[10px] text-slate-400 print:text-slate-600 font-semibold mt-0.5">
                {t("pass_dbt_sub") || "Direct Benefit Transfer (DBT) Crop Procurement Hub"}
              </p>
            </div>
          </div>

          {/* INVALID PASS ALERT BANNER (IF SCANNED) */}
          {isPassUsed && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl p-3 my-3 text-xs flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base">🚫</span>
                <div>
                  <strong className="block font-black text-white">{t("pass_expired_title") || "ONE-TIME PASS USED & EXPIRED"}</strong>
                  <p className="text-[11px] text-rose-200">
                    {t("pass_expired_desc") ? t("pass_expired_desc").replace("{time}", usedTimestamp || "Today") : `This pass was verified and checked in at the APMC yard gate (${usedTimestamp || "Today"}).`}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-rose-950/80 border border-rose-500/40 text-rose-200 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                {t("pass_void_badge") || "VOID"}
              </span>
            </div>
          )}

          {/* TOP SECTION: TOKEN ID + TIME WINDOW + SCANNABLE QR CODE (BIGGER & RESPONSIVE) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 border-b border-slate-800 print:border-slate-200">
            {/* Left: Token ID & Arrival Window */}
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-wider block">
                    {t("pass_assigned_token") || "ASSIGNED TOKEN NUMBER"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                        isPassUsed ? "text-slate-400 line-through" : "text-emerald-400 print:text-emerald-700"
                      }`}
                    >
                      {pass.tokenId}
                    </span>
                    <button
                      onClick={copyTokenNumber}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 print:hidden"
                      title="Copy Token ID"
                    >
                      <span>📋</span>
                      <span>{copiedNotification ? (t("pass_copied") || "Copied!") : (t("pass_copy") || "Copy")}</span>
                    </button>
                  </div>
                </div>

                <div>
                  {isPassUsed ? (
                    <span className="text-rose-300 bg-rose-500/20 border border-rose-500/40 rounded-full px-2.5 py-0.5 font-black text-[10px] inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>{t("pass_used_void_status") || "PASS USED (VOID)"}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 print:text-emerald-900 print:bg-emerald-100 print:border-emerald-300 rounded-full px-2.5 py-0.5 font-black text-[10px] inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 print:bg-emerald-600 animate-pulse"></span>
                      <span>{t("pass_valid_status") || "VALID ONE-TIME PASS"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Scheduled Arrival Time Window */}
              <div className="bg-slate-900/95 border border-slate-800 print:bg-emerald-50 print:border-emerald-200 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  ⏰
                </div>
                <div>
                  <span className="text-[8.5px] font-black text-emerald-400 print:text-emerald-900 uppercase tracking-wider block">
                    {t("pass_arrival_window") || "SCHEDULED ARRIVAL TIME WINDOW"}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white print:text-slate-900 font-mono">
                    {pass.timeSlot} • <span className="font-bold text-slate-300 print:text-slate-700">{pass.date}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: TOP POSITIONED SCANNABLE QR CODE (BIGGER ON MOBILE & LAPTOP) */}
            <div className="flex flex-col items-center shrink-0 bg-slate-900/90 print:bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-800 print:border-none shadow-md relative group">
              <div className="relative">
                {generatedQr ? (
                  <img
                    src={generatedQr}
                    alt="Farmer Gate Pass QR Code"
                    className={`w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 print:w-28 print:h-28 rounded-2xl border-2 bg-white p-1.5 shadow-md transition-all ${
                      isPassUsed
                        ? "opacity-30 grayscale border-rose-500"
                        : "border-slate-700 print:border-slate-300"
                    }`}
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 border-2 border-dashed border-emerald-400 bg-white rounded-2xl flex items-center justify-center font-bold text-emerald-800 text-xs">
                    {t("pass_generating_qr") || "Generating QR..."}
                  </div>
                )}

                {/* Overlaid Invalid / Scanned Watermark if pass is consumed */}
                {isPassUsed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border-2 border-rose-500 p-2 text-center">
                    <span className="text-2xl sm:text-3xl mb-1">❌</span>
                    <span className="text-xs sm:text-sm font-black text-rose-400 uppercase tracking-tight">
                      {t("pass_qr_overlay_scanned") || "PASS SCANNED"}
                    </span>
                    <span className="text-[9px] font-mono text-slate-300 font-bold mt-0.5">
                      {t("pass_qr_overlay_verified") || "Already Verified"}
                    </span>
                  </div>
                )}
              </div>

              <span
                className={`text-[9px] sm:text-[10px] font-mono font-bold mt-1.5 tracking-wider uppercase ${
                  isPassUsed ? "text-rose-400" : "text-emerald-400 print:text-slate-600"
                }`}
              >
                {isPassUsed ? (t("pass_expired_footer") || "🚫 EXPIRED ONE-TIME PASS") : (t("pass_scan_footer") || "📷 SCAN AT APMC GATE")}
              </span>
            </div>
          </div>

          {/* LOWER SECTION: BENEFICIARY DETAILS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 text-xs print:gap-2">
            <div className="bg-slate-900/90 print:bg-slate-50 p-2.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-500 block font-bold text-[8.5px] uppercase">{t("pass_grid_farmer") || "Farmer Beneficiary"}</span>
              <span className="text-white print:text-slate-900 font-black text-xs sm:text-sm block mt-0.5">{pass.farmerName}</span>
              <span className="text-slate-400 print:text-slate-500 font-mono text-[10px] block mt-0.5">{pass.farmerPhone || "+91 98765 43210"}</span>
            </div>

            <div className="bg-slate-900/90 print:bg-slate-50 p-2.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-500 block font-bold text-[8.5px] uppercase">{t("pass_grid_center") || "Designated Procurement Center"}</span>
              <span className="text-white print:text-slate-900 font-bold text-[11px] block mt-0.5 leading-snug">{pass.center}</span>
            </div>

            <div className="bg-slate-900/90 print:bg-slate-50 p-2.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-500 block font-bold text-[8.5px] uppercase">{t("pass_grid_crop") || "Commodity Crop Variety"}</span>
              <span className="text-emerald-400 print:text-emerald-800 font-black text-xs block mt-0.5">🌾 {t("crop_" + pass.crop.split(" ")[0]) || pass.crop}</span>
            </div>

            <div className="bg-slate-900/90 print:bg-slate-50 p-2.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 print:text-slate-500 block font-bold text-[8.5px] uppercase">{t("pass_grid_weight") || "Declared Intake Weight"}</span>
              <span className="text-white print:text-slate-900 font-mono font-black text-xs sm:text-sm block mt-0.5">
                {pass.weight} {t("pass_quintals") || "Quintals"} <span className="text-[10px] font-normal text-slate-400 print:text-slate-500">({pass.weight * 100} kg)</span>
              </span>
            </div>
          </div>

          {/* Slip Footer Security Stamp */}
          <div className="mt-2 pt-2 border-t border-slate-800 print:border-slate-200 text-center text-[8.5px] text-slate-400 print:text-slate-500 flex items-center justify-between">
            <span>{t("pass_footer_security") || "🔒 Verified Digitally via KisanSetu National Mandi Portal"}</span>
            <span>{t("pass_footer_token") || "Gate Entry Token"}: {pass.tokenId}</span>
          </div>
        </div>

        {/* USER ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-5 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>🖨️</span>
            <span>{t("pass_btn_print") || "Print Official Gate Pass"}</span>
          </button>

          {generatedQr && (
            <a
              href={generatedQr}
              download={`KisanSetu_Pass_${pass.tokenId}.png`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md border border-slate-700 transition-all cursor-pointer flex items-center gap-2 hover:scale-105"
            >
              <span>📥</span>
              <span>{t("pass_btn_download") || "Download QR Code"}</span>
            </a>
          )}

          <a
            href={`/queue?token=${pass.tokenId.replace(/\D/g, "")}&center=${encodeURIComponent(pass.center)}`}
            className="bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-slate-300 shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <span>📍</span>
            <span>{t("pass_btn_track") || "Track Live Yard Queue"}</span>
          </a>

          <a
            href="/scheduler"
            className="text-slate-500 hover:text-slate-900 font-bold text-xs px-3 py-1.5 cursor-pointer"
          >
            🔄 {t("pass_btn_new") || "Book New Appointment"}
          </a>
        </div>
      </div>
    </div>
  );
}
