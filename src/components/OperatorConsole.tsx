"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Html5Qrcode } from "html5-qrcode";
import { StaffSession, signOutStaff } from "@/lib/firebase/config";

export interface CheckedInFarmer {
  id: string;
  tokenNumber: number;
  farmerName: string;
  phone: string;
  crop: string;
  weightQtl: number;
  checkInTime: string;
  checkInMethod: "Camera QR Scan" | "Manual Entry";
  vehicleNumber?: string;
  status: "Checked In" | "At Weighbridge" | "Completed";
  moisturePercent?: number;
  mspRatePerQtl?: number;
  totalPayout?: number;
}

const INITIAL_CHECKED_IN: CheckedInFarmer[] = [
  {
    id: "CHK-001",
    tokenNumber: 110,
    farmerName: "Ram Singh",
    phone: "+91 98765 43210",
    crop: "Wheat",
    weightQtl: 40.0,
    checkInTime: "08:15 AM",
    checkInMethod: "Camera QR Scan",
    vehicleNumber: "UP-78-AB-1234",
    status: "Completed",
    moisturePercent: 12.4,
    mspRatePerQtl: 2275,
    totalPayout: 91000,
  },
  {
    id: "CHK-002",
    tokenNumber: 111,
    farmerName: "Rajesh Nayak",
    phone: "+91 94371 88201",
    crop: "Paddy (Common)",
    weightQtl: 28.5,
    checkInTime: "09:30 AM",
    checkInMethod: "Camera QR Scan",
    vehicleNumber: "OD-02-CD-5678",
    status: "At Weighbridge",
    moisturePercent: 13.1,
    mspRatePerQtl: 2300,
    totalPayout: 65550,
  },
  {
    id: "CHK-003",
    tokenNumber: 112,
    farmerName: "Bikash Mohanty",
    phone: "+91 97782 10934",
    crop: "Paddy (Common)",
    weightQtl: 35.0,
    checkInTime: "10:05 AM",
    checkInMethod: "Manual Entry",
    vehicleNumber: "OD-05-XY-9012",
    status: "Checked In",
  },
];

const MSP_RATES: Record<string, number> = {
  "Paddy (Common)": 2300,
  "Paddy (Grade A)": 2320,
  "Wheat": 2275,
  "Mustard Seed": 5450,
  "Groundnut (Peanut)": 6780,
  "Soybean": 4892,
  "Maize (Corn)": 2090,
};

export default function OperatorConsole() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [selectedYard, setSelectedYard] = useState("Chandaka RMC Procurement Yard, Odisha");
  const [activeTab, setActiveTab] = useState<"camera" | "manual" | "weighbridge" | "registry">("camera");

  // Registry & Queue State
  const [checkedInList, setCheckedInList] = useState<CheckedInFarmer[]>(INITIAL_CHECKED_IN);
  const [consumedQrTokens, setConsumedQrTokens] = useState<Set<string>>(new Set(["KS-110", "KS-111"]));
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual Form State
  const [manualToken, setManualToken] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCrop, setManualCrop] = useState("Paddy (Common)");
  const [manualWeight, setManualWeight] = useState<number>(30);
  const [manualVehicle, setManualVehicle] = useState("");

  // Digital Weighment State
  const [selectedFarmerForWeigh, setSelectedFarmerForWeigh] = useState<CheckedInFarmer | null>(INITIAL_CHECKED_IN[1]);
  const [grossWeight, setGrossWeight] = useState<number>(31.2);
  const [tareWeight, setTareWeight] = useState<number>(2.7);
  const [moisturePercent, setMoisturePercent] = useState<number>(12.8);
  const [cropQuality, setCropQuality] = useState<"Grade A" | "FAQ" | "Grade B">("FAQ");
  const [issuedSlip, setIssuedSlip] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kisanSetu_operator_session");
      if (stored) {
        try {
          setSession(JSON.parse(stored));
        } catch {}
      } else {
        const defaultOperator: StaffSession = {
          uid: "operator-default",
          name: "Manoj Kumar Das",
          email: "manoj.operator@odishamandi.gov.in",
          role: "operator",
          loginTime: new Date().toISOString(),
        };
        setSession(defaultOperator);
        localStorage.setItem("kisanSetu_operator_session", JSON.stringify(defaultOperator));
      }

      // Check if existing check-ins stored
      const savedRegistry = localStorage.getItem("kisanSetu_checked_in_registry");
      if (savedRegistry) {
        try {
          setCheckedInList(JSON.parse(savedRegistry));
        } catch {}
      }
    }
  }, []);

  const saveRegistry = (updated: CheckedInFarmer[]) => {
    setCheckedInList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kisanSetu_checked_in_registry", JSON.stringify(updated));
    }
  };

  const handleLogout = async () => {
    stopCameraScanner();
    await signOutStaff("operator");
    router.push("/");
  };

  // Start HTML5 Camera QR Scanner
  const startCameraScanner = async (targetFacing: "environment" | "user" = facingMode) => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader");
      } else if (html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {}
      }

      const config = { fps: 15, qrbox: { width: 250, height: 250 } };
      await html5QrCodeRef.current.start(
        { facingMode: targetFacing },
        config,
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setCameraError("Camera access denied or device has no camera. You can also use Manual Entry.");
      setIsCameraActive(false);
    }
  };

  const switchCameraFacingMode = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isCameraActive) {
      await startCameraScanner(nextMode);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
    }
    setIsCameraActive(false);
  };

  // Process Scanned QR Code
  const handleQrCodeScanned = (scannedText: string) => {
    let tokenId = "";
    let farmerName = "Farmer Beneficiary";
    let crop = "Paddy (Common)";
    let weight = 30;
    let phone = "+91 98765 00000";

    try {
      if (scannedText.startsWith("{")) {
        const parsed = JSON.parse(scannedText);
        tokenId = parsed.tokenId || parsed.token || `KS-${Math.floor(100000 + Math.random() * 900000)}`;
        farmerName = parsed.farmerName || farmerName;
        crop = parsed.crop || crop;
        weight = Number(parsed.weight) || weight;
        phone = parsed.phone || phone;
      } else if (scannedText.includes("token=")) {
        const url = new URL(scannedText, "http://localhost");
        const tok = url.searchParams.get("token") || "";
        tokenId = `KS-${tok.replace(/\D/g, "").slice(0, 6) || Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        tokenId = scannedText.trim();
      }
    } catch {
      tokenId = scannedText.trim() || `KS-${Date.now().toString().slice(-6)}`;
    }

    // CHECK FOR ONE-TIME PASS VALIDITY
    if (consumedQrTokens.has(tokenId)) {
      setNotification({
        type: "error",
        message: `⚠️ REJECTED: One-Time QR Pass for ${tokenId} (${farmerName}) has ALREADY been used!`,
      });
      return;
    }

    // Check if already in checked in list
    const existing = checkedInList.find((f) => String(f.tokenNumber) === String(tokenId).replace(/\D/g, ""));
    if (existing) {
      setNotification({
        type: "error",
        message: `⚠️ Farmer ${existing.farmerName} (Token #${existing.tokenNumber}) is ALREADY Checked In at ${existing.checkInTime}!`,
      });
      return;
    }

    // Mark Token as Consumed
    setConsumedQrTokens((prev) => new Set([...prev, tokenId]));

    if (typeof window !== "undefined") {
      try {
        const used = JSON.parse(localStorage.getItem("kisanSetu_used_tokens") || "[]");
        if (!used.includes(tokenId)) used.push(tokenId);
        const numStr = String(tokenId).replace(/\D/g, "");
        if (numStr && !used.includes(numStr)) used.push(numStr);
        localStorage.setItem("kisanSetu_used_tokens", JSON.stringify(used));
        window.dispatchEvent(new Event("storage"));
      } catch {}
    }

    const numericToken = Number(String(tokenId).replace(/\D/g, "")) || Math.floor(100 + Math.random() * 900);
    const newCheckIn: CheckedInFarmer = {
      id: `CHK-${Date.now().toString().slice(-4)}`,
      tokenNumber: numericToken,
      farmerName,
      phone,
      crop,
      weightQtl: weight,
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      checkInMethod: "Camera QR Scan",
      vehicleNumber: `OD-${Math.floor(10 + Math.random() * 90)}-TR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Checked In",
    };

    const updated = [newCheckIn, ...checkedInList];
    saveRegistry(updated);
    setSelectedFarmerForWeigh(newCheckIn);

    setNotification({
      type: "success",
      message: `✅ SUCCESS: Scanned One-Time QR Pass for ${farmerName} (Token #${numericToken}). Checked in to Yard Queue!`,
    });
  };

  // Submit Manual Check-In
  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualToken.trim()) {
      setNotification({ type: "error", message: "Please fill in Token Number and Farmer Name." });
      return;
    }

    const numericToken = Number(manualToken.replace(/\D/g, "")) || Math.floor(100 + Math.random() * 900);
    const newCheckIn: CheckedInFarmer = {
      id: `CHK-${Date.now().toString().slice(-4)}`,
      tokenNumber: numericToken,
      farmerName: manualName.trim(),
      phone: manualPhone.trim() || "+91 98765 00000",
      crop: manualCrop,
      weightQtl: manualWeight,
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      checkInMethod: "Manual Entry",
      vehicleNumber: manualVehicle.trim() || "N/A",
      status: "Checked In",
    };

    const updated = [newCheckIn, ...checkedInList];
    saveRegistry(updated);
    setSelectedFarmerForWeigh(newCheckIn);

    setManualToken("");
    setManualName("");
    setManualPhone("");
    setManualVehicle("");

    setNotification({
      type: "success",
      message: `✅ Manual Check-In Created: ${newCheckIn.farmerName} (Token #${numericToken}) added to Queue.`,
    });
    setActiveTab("registry");
  };

  // Export to Excel Sheet (.xlsx)
  const handleDownloadExcel = () => {
    try {
      const exportData = checkedInList.map((f, idx) => {
        const netW = f.weightQtl;
        const rate = MSP_RATES[f.crop] || 2300;
        const payout = f.totalPayout || Math.round(netW * rate);

        return {
          "S.No": idx + 1,
          "Check-In Time": f.checkInTime,
          "Token Number": f.tokenNumber,
          "Farmer Beneficiary Name": f.farmerName,
          "Contact Number": f.phone,
          "Crop Commodity": f.crop,
          "Gross / Net Weight (Qtl)": f.weightQtl,
          "Moisture Content (%)": f.moisturePercent ? `${f.moisturePercent}%` : "12.5%",
          "MSP Rate (₹/Qtl)": rate,
          "Total Estimated Payout (₹)": payout,
          "Check-In Method": f.checkInMethod,
          "Vehicle / Tractor No": f.vehicleNumber || "N/A",
          "Processing Status": f.status,
          "Procurement Yard": selectedYard,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Checked-In Farmers");

      // Auto-size columns
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 20 },
        { wch: 22 },
        { wch: 20 },
        { wch: 16 },
        { wch: 24 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 35 },
      ];

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `APMC_CheckedIn_Farmers_${dateStr}.xlsx`);

      setNotification({
        type: "success",
        message: `📥 Downloaded Excel Sheet (APMC_CheckedIn_Farmers_${dateStr}.xlsx) successfully!`,
      });
    } catch (err: any) {
      console.error("Excel export error:", err);
      setNotification({ type: "error", message: "Failed to generate Excel file: " + err.message });
    }
  };

  // Complete Weighment & Issue Slip
  const netWeight = Math.max(0, Number((grossWeight - tareWeight).toFixed(2)));
  const currentCrop = selectedFarmerForWeigh?.crop || "Paddy (Common)";
  const ratePerQtl = MSP_RATES[currentCrop] || 2300;
  const totalPayout = Math.round(netWeight * ratePerQtl);

  const handleCompleteWeighment = () => {
    if (!selectedFarmerForWeigh) return;

    const slip = {
      slipNumber: `WSLIP-${Date.now().toString().slice(-6)}`,
      yard: selectedYard,
      tokenNumber: selectedFarmerForWeigh.tokenNumber,
      farmerName: selectedFarmerForWeigh.farmerName,
      phone: selectedFarmerForWeigh.phone,
      crop: currentCrop,
      grossWeight,
      tareWeight,
      netWeight,
      moisturePercent,
      cropQuality,
      ratePerQtl,
      totalPayout,
      timestamp: new Date().toLocaleString(),
      operatorName: session?.name || "Yard Operator",
    };
    setIssuedSlip(slip);

    // Update status in list
    const updated = checkedInList.map((f) =>
      f.tokenNumber === selectedFarmerForWeigh.tokenNumber
        ? {
            ...f,
            status: "Completed" as const,
            moisturePercent,
            mspRatePerQtl: ratePerQtl,
            totalPayout,
          }
        : f
    );
    saveRegistry(updated);

    setNotification({
      type: "success",
      message: `Weighment completed for ${selectedFarmerForWeigh.farmerName}. Generated Slip #${slip.slipNumber}!`,
    });
  };

  const totalCheckedInCount = checkedInList.length;
  const totalIntakeQtl = checkedInList.reduce((acc, f) => acc + f.weightQtl, 0).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2 group">
              <img src="/icon.svg" alt="Logo" className="w-8 h-8 rounded-xl" />
              <span className="text-xl font-black">
                <span className="text-emerald-400">Kisan</span>
                <span className="text-white">Setu</span>
              </span>
            </a>
            <div className="h-5 w-px bg-slate-700 hidden sm:block"></div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider hidden sm:inline-block">
              APMC Yard Operator Console
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-black text-white">{session?.name || "Operator Officer"}</span>
              <span className="block text-[10px] text-emerald-400 font-bold">{session?.email || "operator@kisansetu.gov.in"}</span>
            </div>
            <a
              href="/"
              className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer hidden md:inline-flex items-center gap-1.5"
            >
              <span>🏠</span>
              <span>Public Portal</span>
            </a>
            <button
              onClick={handleLogout}
              className="text-xs font-black bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Compact Yard Banner & Quick Stats (Mobile Friendly) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-lg mb-4 sm:mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/30 shrink-0">
              🏬
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Procurement Yard</span>
              <select
                value={selectedYard}
                onChange={(e) => setSelectedYard(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-extrabold text-xs sm:text-sm rounded-xl px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer truncate"
              >
                <option value="Chandaka RMC Procurement Yard, Odisha">Chandaka RMC Procurement Yard, Odisha</option>
                <option value="Kalyanpur Krishi Mandi, Uttar Pradesh">Kalyanpur Krishi Mandi, Uttar Pradesh</option>
                <option value="GreenValley Agriculture Hub, Kanpur">GreenValley Agriculture Hub, Kanpur</option>
                <option value="Ludhiana Central Grain Depot, Punjab">Ludhiana Central Grain Depot, Punjab</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex-1 sm:flex-initial text-center sm:text-left">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Check-Ins</span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">{totalCheckedInCount} Farmers</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex-1 sm:flex-initial text-center sm:text-left">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Intake</span>
              <span className="text-sm sm:text-base font-black text-white font-mono">{totalIntakeQtl} Qtl</span>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
              title="Download Excel Spreadsheet of all checked-in farmers"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Live Notification Alert Bar */}
        {notification && (
          <div
            className={`mb-4 p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between animate-fadeIn border ${
              notification.type === "error"
                ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                : "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{notification.type === "error" ? "⚠️" : "✅"}</span>
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {/* TOP OF ALL: PRIMARY TAB NAVIGATION SELECTOR (MOBILE RESPONSIVE GRID) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab("camera")}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "camera"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>📷</span>
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={() => {
              stopCameraScanner();
              setActiveTab("manual");
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>✍️</span>
            <span>Manual Entry</span>
          </button>

          <button
            onClick={() => {
              stopCameraScanner();
              setActiveTab("weighbridge");
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "weighbridge"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>⚖️</span>
            <span>Weighbridge</span>
          </button>

          <button
            onClick={() => {
              stopCameraScanner();
              setActiveTab("registry");
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "registry"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>📋</span>
            <span>Registry ({totalCheckedInCount})</span>
          </button>
        </div>

        {/* TOP POSITIONED: TAB 1 Camera QR Scanner */}
        {activeTab === "camera" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>📷 Live Gate Camera QR Scanner</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scan farmer's One-Time QR Pass at the yard entry gate for instant check-in.
                  </p>
                </div>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative bg-slate-950 border-2 border-dashed border-emerald-500/40 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-center p-3">
                <div id="reader" className="w-full max-w-sm rounded-xl overflow-hidden"></div>

                {!isCameraActive && (
                  <div className="text-center space-y-3 py-6 px-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-pulse">
                      📸
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm sm:text-base">Camera Scanner Ready</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
                        Tap button below to launch phone/webcam camera scanner.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => startCameraScanner()}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        📸 Start Camera Scanner
                      </button>

                      {/* Mobile-Only Reverse / Flip Camera Selector */}
                      <button
                        onClick={switchCameraFacingMode}
                        className="sm:hidden w-full bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        title="Toggle Front/Rear Camera"
                      >
                        <span>🔄</span>
                        <span>Mode: {facingMode === "environment" ? "Rear (Back) Camera" : "Front (Selfie) Camera"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {isCameraActive && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {/* Mobile-Only Live Flip / Reverse Camera Button */}
                    <button
                      onClick={switchCameraFacingMode}
                      className="sm:hidden bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="Switch between front and back cameras on phone"
                    >
                      <span>🔄</span>
                      <span>Flip Cam ({facingMode === "environment" ? "Rear" : "Front"})</span>
                    </button>

                    <button
                      onClick={stopCameraScanner}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      ⏹ Stop Scanner
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs text-center max-w-sm">
                    {cameraError}
                  </div>
                )}
              </div>

              {/* Quick Simulated Test Scanner */}
              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  ⚡ 1-Tap QR Scan Simulator (For Testing Pass Invalidation):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleQrCodeScanned(JSON.stringify({ tokenId: "KS-781920", farmerName: "Ramesh Kumar", crop: "Paddy (Common)", weight: 35.0, phone: "+91 98765 43210" }))}
                    className="bg-slate-900 hover:bg-emerald-900/40 hover:text-emerald-300 text-slate-200 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Scan Pass KS-781920 (Ramesh)
                  </button>
                  <button
                    onClick={() => handleQrCodeScanned(JSON.stringify({ tokenId: "KS-112", farmerName: "Bikash Mohanty", crop: "Paddy (Common)", weight: 35.0, phone: "+91 97782 10934" }))}
                    className="bg-slate-900 hover:bg-emerald-900/40 hover:text-emerald-300 text-slate-200 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Scan Token #112 (Bikash)
                  </button>
                  <button
                    onClick={() => handleQrCodeScanned(JSON.stringify({ tokenId: "KS-113", farmerName: "Gurpreet Gill", crop: "Paddy (Grade A)", weight: 60.0, phone: "+91 98140 33412" }))}
                    className="bg-slate-900 hover:bg-emerald-900/40 hover:text-emerald-300 text-slate-200 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Scan Token #113 (Gurpreet)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Quick Recent Check-Ins Sidebar */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-black text-white text-base">Recent Check-Ins</h4>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                  {checkedInList.length} total
                </span>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {checkedInList.map((farmer) => (
                  <div
                    key={farmer.id}
                    onClick={() => {
                      setSelectedFarmerForWeigh(farmer);
                      setActiveTab("weighbridge");
                    }}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-emerald-400 text-sm">Token #{farmer.tokenNumber}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{farmer.checkInTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{farmer.farmerName}</span>
                      <span className="text-slate-300 font-semibold">{farmer.crop} ({farmer.weightQtl} Qtl)</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">{farmer.vehicleNumber || "Vehicle N/A"}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${farmer.status === "Completed" ? "bg-slate-800 text-slate-400" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {farmer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Manual Entry Form */}
        {activeTab === "manual" && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 pb-4 border-b border-slate-800">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>✍️ Manual Farmer Check-In Form</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                If the farmer does not have a smartphone or QR slip, enter their details manually to issue a queue token.
              </p>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Assigned Token Number *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 115"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Farmer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rameshwar Patil"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Vehicle / Tractor Reg No</label>
                  <input
                    type="text"
                    placeholder="e.g. OD-02-AB-1234"
                    value={manualVehicle}
                    onChange={(e) => setManualVehicle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Crop Commodity</label>
                  <select
                    value={manualCrop}
                    onChange={(e) => setManualCrop(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(MSP_RATES).map((crop) => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Estimated Weight (Qtl)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all cursor-pointer"
              >
                Check In Farmer to Live Queue
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Digital Weighbridge Terminal */}
        {activeTab === "weighbridge" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>⚖️ Electronic Weighbridge Station</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Processing: <span className="text-emerald-400 font-bold">{selectedFarmerForWeigh?.farmerName || "Select a farmer"}</span> (Token #{selectedFarmerForWeigh?.tokenNumber || "N/A"})
                  </p>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  Weighbridge 1
                </span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gross Truck/Tractor Weight (Qtl)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 text-white font-black text-base rounded-2xl px-4 py-3 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tare Empty Vehicle (Qtl)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tareWeight}
                      onChange={(e) => setTareWeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 text-white font-black text-base rounded-2xl px-4 py-3 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Moisture Level (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={moisturePercent}
                      onChange={(e) => setMoisturePercent(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 text-white font-black text-base rounded-2xl px-4 py-3 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className={`text-[10px] font-bold mt-1 block ${moisturePercent <= 14 ? "text-emerald-400" : "text-amber-400"}`}>
                      {moisturePercent <= 14 ? "✓ Within standard limit (≤14%)" : "⚠️ High Moisture Content"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Quality Grade</label>
                    <select
                      value={cropQuality}
                      onChange={(e) => setCropQuality(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-2xl px-3 py-3 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Grade A">Grade A (Super Quality)</option>
                      <option value="FAQ">FAQ (Fair Average Quality)</option>
                      <option value="Grade B">Grade B (Minor Dockage)</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Payout Box */}
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-5 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-bold">Net Crop Weight:</span>
                    <span className="text-xl font-black text-white font-mono">{netWeight} Quintals</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300 font-bold">MSP Rate:</span>
                    <span className="text-sm font-bold text-emerald-400">₹{ratePerQtl.toLocaleString()} / Qtl</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                    <span className="text-sm font-black text-emerald-300">Total Direct DBT Payout:</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                      ₹{totalPayout.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCompleteWeighment}
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition-all cursor-pointer"
                >
                  Complete Weighment & Generate Official Slip
                </button>
              </div>
            </div>

            {/* Select Checked-In Farmer Sidebar */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="font-black text-white text-base pb-3 border-b border-slate-800">Select Checked-In Farmer</h4>
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                {checkedInList.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFarmerForWeigh(f);
                      setGrossWeight(Number((f.weightQtl + 2.5).toFixed(2)));
                      setTareWeight(2.5);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedFarmerForWeigh?.tokenNumber === f.tokenNumber
                        ? "bg-emerald-950/50 border-emerald-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between font-bold text-xs">
                      <span>Token #{f.tokenNumber}</span>
                      <span className="text-emerald-400 font-mono">{f.weightQtl} Qtl</span>
                    </div>
                    <div className="text-xs text-white font-extrabold mt-1">{f.farmerName}</div>
                    <div className="text-[10px] text-slate-400">{f.crop}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Checked-In Farmers Registry Table (Excel Linked) */}
        {activeTab === "registry" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📋 Checked-In Beneficiaries Master Sheet</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    {checkedInList.length} records
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  All scanned and manual entries are auto-connected to the downloadable Excel spreadsheet.
                </p>
              </div>

              <button
                onClick={handleDownloadExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Master Excel (.xlsx)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Time & Token</th>
                    <th className="py-3.5 px-4">Farmer Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Crop Commodity</th>
                    <th className="py-3.5 px-4">Weight (Qtl)</th>
                    <th className="py-3.5 px-4">Check-In Method</th>
                    <th className="py-3.5 px-4">Vehicle No</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {checkedInList.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-emerald-400 block">Token #{f.tokenNumber}</span>
                        <span className="text-[10px] text-slate-400">{f.checkInTime}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{f.farmerName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{f.phone}</td>
                      <td className="py-3.5 px-4 text-emerald-300 font-bold">{f.crop}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{f.weightQtl} Qtl</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          {f.checkInMethod === "Camera QR Scan" ? "📷 Camera QR" : "✍️ Manual Entry"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{f.vehicleNumber || "N/A"}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${f.status === "Completed" ? "bg-slate-800 text-slate-400" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Generated Slip Modal */}
      {issuedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIssuedSlip(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
              <span className="text-2xl">🌾</span>
              <h3 className="text-xl font-black tracking-tight text-slate-900">APMC GOVT PROCUREMENT RECEIPT</h3>
              <p className="text-xs text-slate-600 font-semibold">{issuedSlip.yard}</p>
              <span className="inline-block mt-2 font-mono font-extrabold text-xs bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
                {issuedSlip.slipNumber} • Token #{issuedSlip.tokenNumber}
              </span>
            </div>

            <div className="py-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Farmer Beneficiary:</span>
                <span className="font-extrabold text-slate-900">{issuedSlip.farmerName} ({issuedSlip.phone})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Commodity Variety:</span>
                <span className="font-bold text-slate-900">{issuedSlip.crop}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Gross Weight:</span>
                <span className="font-mono text-slate-900">{issuedSlip.grossWeight} Qtl</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tare Weight:</span>
                <span className="font-mono text-slate-900">{issuedSlip.tareWeight} Qtl</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Net Procured Weight:</span>
                <span className="font-mono font-black text-slate-900 text-base">{issuedSlip.netWeight} Qtl</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Moisture Content:</span>
                <span className="font-bold text-slate-900">{issuedSlip.moisturePercent}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">MSP Rate:</span>
                <span className="font-bold text-emerald-800">₹{issuedSlip.ratePerQtl}/Qtl</span>
              </div>
              <div className="flex justify-between py-2 mt-2 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                <span className="font-black text-emerald-950">Total DBT Disbursal Amount:</span>
                <span className="font-black text-emerald-800 text-lg">₹{issuedSlip.totalPayout.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-2 mb-4">
              Authorized by Operator: {issuedSlip.operatorName} • {issuedSlip.timestamp}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Official Slip</span>
              </button>
              <button
                onClick={() => setIssuedSlip(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
