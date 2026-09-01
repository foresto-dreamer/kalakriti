"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { MOCK_CENTERS } from "./ProcurementCenters";
import { createClient } from "@/lib/supabase/client";

interface LiveQueueProps {
  activeBooking: {
    center: string;
    crop: string;
    weight: number;
    date: string;
    timeSlot: string;
    tokenId: string;
  } | null;
}

export default function LiveQueue({ activeBooking }: LiveQueueProps) {
  const { t, lang } = useTranslation();
  const [selectedCenterId, setSelectedCenterId] = useState(MOCK_CENTERS[0].id);
  const [userToken, setUserToken] = useState("");
  const [positionResult, setPositionResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");
  const [secondsUntilSync, setSecondsUntilSync] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time queue state from operator table
  const [servingToken, setServingToken] = useState<number>(105);
  const [avgWaitPerToken, setAvgWaitPerToken] = useState<number>(8);
  const [activeCounter, setActiveCounter] = useState("Weighbridge Counter 1");

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveQueue();
    setSecondsUntilSync(10);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Helper to normalize high IDs into realistic yard token numbers (e.g., #110 - #120)
  const normalizeToYardToken = (rawVal: string | number): number => {
    const rawNum = typeof rawVal === "number" ? rawVal : parseInt(String(rawVal).replace(/\D/g, ""), 10);
    if (isNaN(rawNum) || rawNum <= 0) return servingToken + 4;
    if (rawNum >= 100 && rawNum <= 999) return rawNum;
    return 100 + (rawNum % 30) + 3;
  };

  // Auto-fill user token from props, search params, or localStorage
  useEffect(() => {
    let tokenToSet = "";
    let centerToSet = "";

    if (activeBooking?.tokenId) {
      tokenToSet = String(normalizeToYardToken(activeBooking.tokenId));
      if (activeBooking.center) centerToSet = activeBooking.center;
    } else if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      const urlCenter = urlParams.get("center");

      if (urlToken) {
        tokenToSet = String(normalizeToYardToken(urlToken));
      } else {
        const storedBooking = localStorage.getItem("kisanSetu_latest_booking");
        if (storedBooking) {
          try {
            const parsed = JSON.parse(storedBooking);
            if (parsed.tokenNumber) {
              tokenToSet = String(parsed.tokenNumber);
            } else if (parsed.tokenId) {
              tokenToSet = String(normalizeToYardToken(parsed.tokenId));
            }
            if (parsed.center) centerToSet = parsed.center;
          } catch {}
        }
      }
      if (urlCenter) centerToSet = urlCenter;
    }

    if (!tokenToSet) {
      tokenToSet = "110";
    }

    setUserToken(tokenToSet);

    if (centerToSet) {
      const match = MOCK_CENTERS.find((c) => c.name.toLowerCase().includes(centerToSet.toLowerCase()));
      if (match) setSelectedCenterId(match.id);
    }
  }, [activeBooking]);

  // Fetch Centre Queue Stats (Read-Only from Supabase / Operator Records)
  const fetchActiveQueue = async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const { data: processing } = await supabase
        .from("bookings")
        .select("token_number")
        .eq("centre_id", selectedCenterId)
        .eq("booking_date", today)
        .eq("status", "processing")
        .order("token_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (processing?.token_number) {
        setServingToken(processing.token_number);
      } else {
        const { data: recent } = await supabase
          .from("bookings")
          .select("token_number")
          .eq("centre_id", selectedCenterId)
          .eq("booking_date", today)
          .order("token_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recent?.token_number) {
          setServingToken(recent.token_number);
        } else if (typeof window !== "undefined") {
          const savedRegistry = localStorage.getItem("kisanSetu_checked_in_registry");
          if (savedRegistry) {
            try {
              const list = JSON.parse(savedRegistry);
              if (Array.isArray(list) && list.length > 0) {
                const active = list.find((f) => f.status === "At Weighbridge") || list[0];
                if (active?.tokenNumber) setServingToken(active.tokenNumber);
              }
            } catch {}
          }
        }
      }

      setAvgWaitPerToken(8);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.warn("Live queue fetch note:", err);
    }
  };

  // Farmer Queue Position Calculation
  const calculateQueuePosition = (userTokenNum: number) => {
    const currentServing = servingToken || 105;
    const diff = userTokenNum - currentServing;

    if (diff < 0) {
      setPositionResult({
        status: "served",
        message: t("queue_status_served") || "Your token has already been served! Please report to the dispatch counter.",
        slotsAhead: 0,
        estWait: 0,
        alertColor: "bg-slate-100 border-slate-300 text-slate-700",
      });
    } else if (diff === 0) {
      setPositionResult({
        status: "serving_now",
        slotsAhead: 0,
        estWait: 0,
        message: t("queue_status_your_turn") || "🎉 YOUR TURN! Proceed directly to Weighbridge 1.",
        alertColor: "bg-emerald-50 border-emerald-300 text-emerald-800 animate-pulse",
      });
    } else {
      const slotsAhead = diff;
      const estWait = slotsAhead * (avgWaitPerToken || 8);
      let statusMsg = "";
      let alertColor = "";

      if (slotsAhead <= 3) {
        statusMsg = t("queue_status_immediate") || "🚨 Please report immediately! You are next in line.";
        alertColor = "bg-rose-50 border-rose-300 text-rose-800 animate-pulse";
      } else if (slotsAhead <= 6) {
        statusMsg = t("queue_status_prepare") || "🚚 Prepare for transport. Your turn will arrive shortly.";
        alertColor = "bg-amber-50 border-amber-300 text-amber-900";
      } else {
        statusMsg = t("queue_status_safe") || "🏡 Safe at home. You have ample time before your turn.";
        alertColor = "bg-emerald-50 border-emerald-300 text-emerald-800";
      }

      setPositionResult({
        status: "waiting",
        slotsAhead,
        estWait,
        message: statusMsg,
        alertColor,
      });
    }
  };

  // 10-Second Auto-Refresh Interval
  useEffect(() => {
    fetchActiveQueue();

    const refreshInterval = setInterval(() => {
      fetchActiveQueue();
      setSecondsUntilSync(10);
    }, 10000);

    const countdownInterval = setInterval(() => {
      setSecondsUntilSync((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [selectedCenterId]);

  // Recalculate position when userToken or servingToken changes
  useEffect(() => {
    const num = parseInt(userToken, 10);
    if (!isNaN(num)) {
      calculateQueuePosition(num);
    }
  }, [userToken, servingToken]);

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToken) return;
    const num = parseInt(userToken.replace(/\D/g, ""), 10);
    if (isNaN(num)) return;
    setIsChecking(true);
    calculateQueuePosition(num);
    setTimeout(() => setIsChecking(false), 200);
  };

  const parsedUserToken = parseInt(userToken, 10) || (servingToken + 4);
  const slotsAheadCount = Math.max(0, parsedUserToken - servingToken);
  const maxVisibleTractors = 5;
  const isOverflow = slotsAheadCount > maxVisibleTractors;
  const displayCount = Math.min(slotsAheadCount, maxVisibleTractors);

  return (
    <section id="queue" className="pt-6 sm:pt-10 pb-16 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/60 text-slate-900 font-sans min-h-screen">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t("queue_telemetry") || "Live APMC Mandi Telemetry"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            {t("queue_title") || "Live Queue Monitor"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed px-2">
            {t("queue_desc") || "Track token processing numbers live. Avoid waiting in long lines by arriving exactly when your token is near."}
          </p>
        </div>

        {/* TOP POSITIONED: MOBILE-OPTIMIZED LIVE YARD PROGRESSION (TRACTOR CONVOY) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0 shadow-xs">
                🚜
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                  {t("queue_convoy_title") || "Live Yard Progression Convoy"}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {t("queue_convoy_desc") || "Real-time vehicle movement towards the weighbridge"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
              <span className="text-xs font-black bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full shadow-xs">
                {slotsAheadCount} {t("queue_status_vehicles") || "Tractors"} {t("queue_more") === "More" || t("queue_more") === "ଅଧିକ" ? "Ahead" : t("queue_more")}
              </span>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold text-xs px-3.5 py-1 rounded-full border border-slate-200 hover:border-emerald-300 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer group"
                title="Click to refresh live yard telemetry"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3.5 h-3.5 text-emerald-600 transition-transform duration-500 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"}`}
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isRefreshing ? (t("queue_syncing") || "Syncing...") : (t("queue_refresh") || "Refresh")}</span>
              </button>
            </div>
          </div>

          {/* Road Convoy Track Container */}
          <div className="relative bg-slate-50/80 border border-slate-200/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden shadow-inner">
            {/* Horizontal Scroll Area */}
            <div className="overflow-x-auto pb-2 pt-2 scroll-smooth">
              <div className="relative flex items-center justify-between min-w-[500px] sm:min-w-[560px] px-3 gap-3">
                {/* Connecting Track Line */}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 rounded-full overflow-hidden z-0">
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300"></div>
                </div>

                {/* Destination: Electronic Weighbridge Scale */}
                <div className="relative z-10 flex flex-col items-center shrink-0">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white border-2 border-emerald-500 flex items-center justify-center text-2xl sm:text-3xl shadow-md ring-4 ring-emerald-500/15 transition-transform hover:scale-105">
                    ⚖️
                  </div>
                  <span className="text-[9px] font-black text-emerald-900 mt-1.5 uppercase font-mono tracking-wider">
                    {t("queue_weighbridge") || "WEIGHBRIDGE"}
                  </span>
                  <span className="text-[9px] font-mono font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full mt-0.5 shadow-xs">
                    #{servingToken} {t("queue_serving_badge") || "SERVING"}
                  </span>
                </div>

                {/* Tractors Ahead In Line */}
                {Array.from({ length: displayCount }).map((_, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center shrink-0">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl sm:text-2xl shadow-xs transition-transform hover:scale-105">
                      🚜
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase font-mono">
                      {t("queue_yard_queue") || "YARD QUEUE"}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md mt-0.5 shadow-xs">
                      #{servingToken + idx + 1}
                    </span>
                  </div>
                ))}

                {/* Overflow Badge if more than maxVisibleTractors */}
                {isOverflow && (
                  <div className="relative z-10 flex flex-col items-center shrink-0">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-mono text-xs font-black shadow-xs">
                      +{slotsAheadCount - maxVisibleTractors}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase">
                      {t("queue_more") || "MORE"}
                    </span>
                  </div>
                )}

                {/* Farmer's Own Spot */}
                <div className="relative z-10 flex flex-col items-center shrink-0">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-emerald-500 border-2 border-emerald-300 text-white flex items-center justify-center text-2xl sm:text-3xl shadow-md ring-4 ring-emerald-400/25 transition-transform hover:scale-105">
                    🚜
                  </div>
                  <span className="text-[9px] font-black text-slate-900 mt-1.5 uppercase font-mono tracking-wider">
                    {t("queue_your_truck") || "YOUR TRUCK"}
                  </span>
                  <span className="text-[9px] font-mono font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-full mt-0.5 shadow-xs">
                    #{parsedUserToken} {t("queue_you") || "YOU"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Scroll Indicator Helper */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium sm:hidden">
              <span>⚖️ {t("queue_scale_entry") || "Scale Entry"}</span>
              <span className="text-emerald-700 font-bold">{t("queue_swipe_convoy") || "Swipe convoy line ➔"}</span>
              <span>🚜 {t("queue_your_spot") || "Your Spot"}</span>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LOWER SECTION: OPERATOR BROADCAST + POSITION CHECKER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-start">
          {/* Left Panel: Clean Operator Broadcast Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            {/* Live Indicator Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>{t("queue_operator_feed") || "OPERATOR FEED • LIVE"}</span>
              </span>

              <span className="text-xs text-slate-500 font-mono">
                {t("queue_syncing_in").replace("{seconds}", String(secondsUntilSync)) || `Syncing in ${secondsUntilSync}s`}
              </span>
            </div>

            {/* Procurement Center Selection */}
            <div className="space-y-3.5 my-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  {t("queue_center_hub") || "Procurement Center Hub"}
                </label>
                <div className="relative">
                  <select
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm font-bold cursor-pointer shadow-xs appearance-none"
                  >
                    {MOCK_CENTERS.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {t(`center_${idx + 1}_name`)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {t("queue_active_terminal") || "Active Terminal"}
                </span>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>{activeCounter}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    {t("queue_connected") || "Connected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Serving Token Banner */}
            <div className="text-center bg-gradient-to-b from-emerald-50/90 to-teal-50/40 border-2 border-emerald-500/30 rounded-2xl py-5 sm:py-6 px-4 my-4 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-black text-emerald-900/80 uppercase tracking-wider block">
                {t("queue_serving") || "NOW SERVING TOKEN"}
              </span>
              <p className="text-4xl sm:text-6xl font-black text-emerald-600 font-mono tracking-tight my-1 sm:my-2">
                #{servingToken || 105}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{t("queue_weighbridge_active") || "Weighbridge Counter 1 Active"}</span>
              </p>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{t("queue_avg_pace") || "Avg Pace per Load"}</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 font-mono mt-0.5 block">~{avgWaitPerToken} {t("queue_serving_mins") || "Mins"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{t("queue_last_sync") || "Last Sync"}</span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-1 block">{lastSyncedTime}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Farmer Position Checker & Milestones */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Token Input Search */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="mb-3.5">
                <h3 className="text-base sm:text-lg font-black text-slate-950">{t("queue_check_title") || "Track Your Position"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("queue_check_desc_custom") || "Enter your token number to view live queue position and estimated arrival time."}
                </p>
              </div>

              <form onSubmit={handleManualCheck} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t("queue_enter_token_placeholder") || "Enter Token (e.g. 110)"}
                    value={userToken}
                    onChange={(e) => setUserToken(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChecking}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                >
                  {isChecking ? (t("login_otp_verifying") || "Checking...") : (t("queue_track_btn") || "Track")}
                </button>
              </form>

              {/* Status Alert Banner */}
              {positionResult && (
                <div className="mt-4 space-y-3">
                  <div className={`p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${positionResult.alertColor}`}>
                    <span className="text-base shrink-0">📢</span>
                    <span className="leading-snug">{positionResult.message}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-black uppercase tracking-wider">
                        {t("queue_tractors_ahead_label") || "TRACTORS AHEAD"}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono block mt-0.5">
                        {slotsAheadCount} {t("queue_status_vehicles") || "Tractors"}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-black uppercase tracking-wider">
                        {t("queue_est_wait_label") || "ESTIMATED WAIT"}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono block mt-0.5">
                        ~{positionResult.estWait} {t("queue_serving_mins") || "Mins"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Timeline Steps */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3.5">
                {t("queue_timeline") || "Intake Milestones"}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-black text-xs mb-1">
                    1
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("queue_milestone_serving") || "Serving Now"}</span>
                  <span className="text-xs font-black text-emerald-700 font-mono mt-0.5 block">#{servingToken}</span>
                </div>

                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto font-black text-xs mb-1">
                    2
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("queue_milestone_next") || "Next Gate"}</span>
                  <span className="text-xs font-black text-slate-800 font-mono mt-0.5 block">#{servingToken + 1}</span>
                </div>

                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto font-black text-xs mb-1">
                    3
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">{t("queue_milestone_yard") || "In Yard"}</span>
                  <span className="text-xs font-black text-slate-800 font-mono mt-0.5 block">{slotsAheadCount} {t("queue_status_vehicles") || "Tractors"}</span>
                </div>

                <div className="bg-emerald-50/80 p-2.5 sm:p-3 rounded-xl border-2 border-emerald-500">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto font-black text-xs mb-1">
                    📍
                  </div>
                  <span className="text-[9px] text-emerald-800 font-bold uppercase block">{t("queue_your_spot") || "Your Spot"}</span>
                  <span className="text-xs font-black text-emerald-900 font-mono mt-0.5 block">#{parsedUserToken}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
