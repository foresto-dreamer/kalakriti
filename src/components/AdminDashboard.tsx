"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffSession, signOutStaff, isAuthorizedAdmin, AUTHORIZED_ADMIN_EMAILS } from "@/lib/firebase/config";
import StaffLoginModal from "@/components/StaffLoginModal";

interface FarmerRecord {
  id: string;
  name: string;
  phone: string;
  aadhaar: string;
  district: string;
  state: string;
  landArea: number; // in acres
  primaryCrop: string;
  kycStatus: "Verified" | "Pending KYC" | "Action Required";
  bankAccount: string;
  ifsc: string;
  registeredDate: string;
  totalProcuredQtl: number;
  totalDbtDisbursed: number; // ₹
}

const INITIAL_FARMERS_DB: FarmerRecord[] = [
  {
    id: "FARM-7001",
    name: "Ram Singh",
    phone: "+91 98765 43210",
    aadhaar: "XXXX-XXXX-8912",
    district: "Kalyanpur, Kanpur",
    state: "Uttar Pradesh",
    landArea: 12.5,
    primaryCrop: "Wheat",
    kycStatus: "Verified",
    bankAccount: "912384729102",
    ifsc: "SBIN0001234",
    registeredDate: "12 May 2024",
    totalProcuredQtl: 145.0,
    totalDbtDisbursed: 332775,
  },
  {
    id: "FARM-7002",
    name: "Rajesh Kumar Nayak",
    phone: "+91 94371 88201",
    aadhaar: "XXXX-XXXX-4531",
    district: "Chandaka, Khordha",
    state: "Odisha",
    landArea: 8.0,
    primaryCrop: "Paddy (Common)",
    kycStatus: "Verified",
    bankAccount: "501002349182",
    ifsc: "ORBC0100452",
    registeredDate: "18 Jun 2024",
    totalProcuredQtl: 92.4,
    totalDbtDisbursed: 212520,
  },
  {
    id: "FARM-7003",
    name: "Gurpreet Singh Gill",
    phone: "+91 98140 33412",
    aadhaar: "XXXX-XXXX-7729",
    district: "Ludhiana",
    state: "Punjab",
    landArea: 22.0,
    primaryCrop: "Paddy (Grade A)",
    kycStatus: "Verified",
    bankAccount: "302918239012",
    ifsc: "PUNB0123900",
    registeredDate: "05 Jul 2024",
    totalProcuredQtl: 280.0,
    totalDbtDisbursed: 649600,
  },
  {
    id: "FARM-7004",
    name: "Bikash Mohanty",
    phone: "+91 97782 10934",
    aadhaar: "XXXX-XXXX-6102",
    district: "Cuttack Sadar",
    state: "Odisha",
    landArea: 6.5,
    primaryCrop: "Paddy (Common)",
    kycStatus: "Pending KYC",
    bankAccount: "440192837461",
    ifsc: "UCBA0000912",
    registeredDate: "14 Aug 2024",
    totalProcuredQtl: 35.0,
    totalDbtDisbursed: 80500,
  },
  {
    id: "FARM-7005",
    name: "Rameshwar Patil",
    phone: "+91 98220 91823",
    aadhaar: "XXXX-XXXX-3349",
    district: "Baramati, Pune",
    state: "Maharashtra",
    landArea: 15.0,
    primaryCrop: "Soybean",
    kycStatus: "Verified",
    bankAccount: "601928374610",
    ifsc: "MAHB0000312",
    registeredDate: "22 Aug 2024",
    totalProcuredQtl: 110.0,
    totalDbtDisbursed: 537900,
  },
  {
    id: "FARM-7006",
    name: "Amit Barik",
    phone: "+91 93370 44519",
    aadhaar: "XXXX-XXXX-9904",
    district: "Puri Coastal",
    state: "Odisha",
    landArea: 4.5,
    primaryCrop: "Groundnut",
    kycStatus: "Action Required",
    bankAccount: "109283746519",
    ifsc: "SBIN0004912",
    registeredDate: "27 Aug 2024",
    totalProcuredQtl: 18.0,
    totalDbtDisbursed: 122040,
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [farmers, setFarmers] = useState<FarmerRecord[]>(INITIAL_FARMERS_DB);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if session exists in localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kisanSetu_admin_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && isAuthorizedAdmin(parsed.email)) {
            setSession(parsed);
          } else {
            setSession(null);
          }
        } catch {
          setSession(null);
        }
      } else {
        setSession(null);
      }
      setIsLoaded(true);

      // Check if user registered their own profile in KisanSetu
      const registeredFarmer = localStorage.getItem("farmer_profile");
      if (registeredFarmer) {
        try {
          const parsed = JSON.parse(registeredFarmer);
          if (parsed.name && parsed.phone) {
            const dynamicFarmer: FarmerRecord = {
              id: "FARM-LIVE-01",
              name: parsed.name,
              phone: parsed.phone,
              aadhaar: parsed.aadhaar ? `XXXX-XXXX-${parsed.aadhaar.slice(-4)}` : "XXXX-XXXX-9901",
              district: parsed.district || parsed.location || "Chandaka, Khordha",
              state: parsed.state || "Odisha",
              landArea: Number(parsed.landArea || parsed.area) || 5.0,
              primaryCrop: parsed.primaryCrop || "Paddy (Common)",
              kycStatus: "Verified",
              bankAccount: parsed.bankAccount || "991823901923",
              ifsc: parsed.ifsc || "SBIN0001092",
              registeredDate: "Today (Live)",
              totalProcuredQtl: 28.5,
              totalDbtDisbursed: 65550,
            };
            setFarmers((prev) => [dynamicFarmer, ...prev.filter((f) => f.phone !== dynamicFarmer.phone)]);
          }
        } catch {}
      }
    }
  }, []);

  const handleLogout = async () => {
    await signOutStaff("admin");
    setSession(null);
    router.push("/");
  };

  const handleToggleKyc = (id: string) => {
    setFarmers((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextStatus = f.kycStatus === "Verified" ? "Pending KYC" : "Verified";
          return { ...f, kycStatus: nextStatus };
        }
        return f;
      })
    );
    setNotification(`Updated KYC status for farmer ID ${id}`);
    setTimeout(() => setNotification(null), 3500);
    if (selectedFarmer && selectedFarmer.id === id) {
      setSelectedFarmer((prev) => (prev ? { ...prev, kycStatus: prev.kycStatus === "Verified" ? "Pending KYC" : "Verified" } : null));
    }
  };

  const isAuthorized = Boolean(session && isAuthorizedAdmin(session.email));

  if (isLoaded && !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Government Admin Portal</h2>
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mt-3 font-semibold">
              Access Restricted: APMC Operators and unauthorized accounts cannot access the National Beneficiary Registry.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">
              Authorized Government Administrator Gmails:
            </span>
            {AUTHORIZED_ADMIN_EMAILS.map((email) => (
              <div key={email} className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <span>✓</span>
                <span>{email}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Sign in with Authorized Google Account
            </button>
            <button
              onClick={() => router.push("/operator")}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-2xl border border-slate-700 transition-all cursor-pointer"
            >
              Switch to APMC Operator Desk
            </button>
          </div>
        </div>

        <StaffLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          initialRole="admin"
        />
      </div>
    );
  }

  // Metrics Calculations
  const totalFarmersCount = farmers.length;
  const totalAcres = farmers.reduce((acc, f) => acc + f.landArea, 0).toFixed(1);
  const totalProcuredVolume = farmers.reduce((acc, f) => acc + f.totalProcuredQtl, 0).toFixed(1);
  const totalDbtAmount = farmers.reduce((acc, f) => acc + f.totalDbtDisbursed, 0);
  const verifiedCount = farmers.filter((f) => f.kycStatus === "Verified").length;
  const kycPercent = Math.round((verifiedCount / totalFarmersCount) * 100);

  const filteredFarmers = farmers.filter((farmer) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      farmer.name.toLowerCase().includes(q) ||
      farmer.phone.toLowerCase().includes(q) ||
      farmer.district.toLowerCase().includes(q) ||
      farmer.id.toLowerCase().includes(q) ||
      farmer.primaryCrop.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || farmer.kycStatus === statusFilter;
    const matchesState = stateFilter === "All" || farmer.state === stateFilter;
    return matchesQuery && matchesStatus && matchesState;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Top Admin Navigation Bar */}
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
              National Admin Console
            </span>
          </div>

          {/* Officer Profile & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-black text-white">{session?.name || "Admin Officer"}</span>
              <span className="block text-[10px] text-emerald-400 font-bold">{session?.email || "admin@kisansetu.gov.in"}</span>
            </div>
            <button
              onClick={() => router.push("/operator")}
              className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer hidden md:inline-flex items-center gap-1.5"
            >
              <span>🛠️</span>
              <span>Operator Desk</span>
            </button>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner with Heading */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🌾 Central Farmer Registry & MSP Disbursals</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time oversight of verified farmer beneficiaries, MSP crop deliveries, and direct bank transfers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setNotification("Exported beneficiary registry to CSV format.");
                setTimeout(() => setNotification(null), 3000);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
            <a
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              Public Portal
            </a>
          </div>
        </div>

        {/* Live Notification Bar */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Registered Beneficiaries</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalFarmersCount} Farmers</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">100% Live</span> across active states
            </div>
            <div className="absolute top-4 right-4 text-2xl opacity-20">👨‍🌾</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Cultivated Area</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalAcres} <span className="text-sm font-bold text-slate-400">Acres</span></div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">GPS Geotagged</span> land holdings
            </div>
            <div className="absolute top-4 right-4 text-2xl opacity-20">🗺️</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Procurement Intake</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalProcuredVolume} <span className="text-sm font-bold text-slate-400">Quintals</span></div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">Verified weight</span> across APMC yards
            </div>
            <div className="absolute top-4 right-4 text-2xl opacity-20">⚖️</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Direct DBT Payout</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">₹{(totalDbtAmount / 100000).toFixed(2)} <span className="text-sm font-bold text-slate-400">Lakh</span></div>
            <div className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
              <span>⚡ {kycPercent}% Aadhaar KYC Linked</span>
            </div>
            <div className="absolute top-4 right-4 text-2xl opacity-20">💳</div>
          </div>
        </div>

        {/* Search, Filter & Controls */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-1/2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Farmer name, Aadhaar, Phone, District, or Crop..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Pending KYC">Pending KYC</option>
                <option value="Action Required">Action Required</option>
              </select>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All States</option>
                <option value="Odisha">Odisha</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Punjab">Punjab</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Farmers Registry Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>📋 Beneficiary Farmer Directory</span>
              <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">
                {filteredFarmers.length} found
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Farmer ID & Name</th>
                  <th className="py-3.5 px-4">Contact & Aadhaar</th>
                  <th className="py-3.5 px-4">Location / State</th>
                  <th className="py-3.5 px-4">Land & Crop</th>
                  <th className="py-3.5 px-4">Disbursed DBT</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      No matching farmer records found.
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-extrabold text-white">{farmer.name}</div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold">{farmer.id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-300">{farmer.phone}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{farmer.aadhaar}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{farmer.district}</div>
                        <div className="text-[11px] text-slate-400">{farmer.state}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-white">{farmer.landArea} Acres</div>
                        <div className="text-[11px] text-emerald-400 font-bold">{farmer.primaryCrop}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-emerald-300">₹{farmer.totalDbtDisbursed.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{farmer.totalProcuredQtl} Qtl Delivered</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${
                            farmer.kycStatus === "Verified"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : farmer.kycStatus === "Pending KYC"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          <span>{farmer.kycStatus === "Verified" ? "●" : "▲"}</span>
                          <span>{farmer.kycStatus}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedFarmer(farmer)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                            title="View Full Profile"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleToggleKyc(farmer.id)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                              farmer.kycStatus === "Verified"
                                ? "bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                            }`}
                            title="Toggle KYC verification"
                          >
                            {farmer.kycStatus === "Verified" ? "Revoke" : "Verify KYC"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Farmer Details Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              onClick={() => setSelectedFarmer(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/40">
                👨‍🌾
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedFarmer.name}</h3>
                <span className="text-xs text-emerald-400 font-mono font-bold">{selectedFarmer.id} • Registered {selectedFarmer.registeredDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm mb-6">
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Aadhaar (UIDAI Masked)</span>
                <span className="font-mono font-bold text-white">{selectedFarmer.aadhaar}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Mobile Number</span>
                <span className="font-bold text-white">{selectedFarmer.phone}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Cultivated Land</span>
                <span className="font-bold text-white">{selectedFarmer.landArea} Acres</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Primary Crop</span>
                <span className="font-bold text-emerald-400">{selectedFarmer.primaryCrop}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Bank Account for DBT</span>
                <span className="font-mono font-bold text-white">{selectedFarmer.bankAccount}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold text-xs">Bank IFSC</span>
                <span className="font-mono font-bold text-white">{selectedFarmer.ifsc}</span>
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between mb-6">
              <div>
                <span className="block text-xs text-emerald-300 font-semibold">Total Direct Benefit Transfer (DBT)</span>
                <span className="text-xl font-black text-emerald-400">₹{selectedFarmer.totalDbtDisbursed.toLocaleString()}</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold border border-emerald-500/40">
                {selectedFarmer.totalProcuredQtl} Qtl Procured
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleToggleKyc(selectedFarmer.id)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                {selectedFarmer.kycStatus === "Verified" ? "Revoke KYC" : "Approve & Verify KYC"}
              </button>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
