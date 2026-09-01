"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface LoginPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FarmerProfileData {
  name: string;
  phone: string;
  state: string;
  district: string;
  location: string;
  area: number;
  primaryCrop: string;
  bankAccount: string;
  dbtStatus: string;
  farmerId: string;
  joinedDate: string;
}

const INDIAN_STATES = [
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "West Bengal",
  "Odisha",
  "Bihar",
  "Rajasthan",
  "Maharashtra",
  "Gujarat",
  "Andhra Pradesh",
  "Karnataka",
];

const CROPS_LIST = ["Paddy (धान)", "Wheat (गेहूं)", "Mustard (सरसों)", "Maize (मक्का)", "Barley (जौ)"];

export default function LoginPortal({ isOpen, onClose }: LoginPortalProps) {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("4241");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    state: "Uttar Pradesh",
    district: "Kanpur Nagar",
    location: "",
    area: "5",
    primaryCrop: "Paddy (धान)",
    bankAccount: "SBI ****4920",
  });

  useEffect(() => {
    // Check if farmer is already logged in
    const cachedProfile = localStorage.getItem("kisanSetu_farmer_profile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed?.name) {
          setProfileForm((prev) => ({
            ...prev,
            name: parsed.name || "",
            state: parsed.state || "Uttar Pradesh",
            district: parsed.district || "Kanpur Nagar",
            location: parsed.location || "",
            area: parsed.area?.toString() || "5",
            primaryCrop: parsed.primaryCrop || "Paddy (धान)",
            bankAccount: parsed.bankAccount || "SBI ****4920",
          }));
        }
      } catch {}
    }
  }, []);

  const sendOtpForPhone = (num: string) => {
    if (num.length !== 10) return;
    setIsSubmitting(true);
    setErrorMessage("");
    // Instant dummy OTP generator (4241)
    setTimeout(() => {
      setPhoneNumber(num);
      setOtp("4241");
      setIsSubmitting(false);
      setStep("otp");
    }, 300);
  };

  useEffect(() => {
    const handleLoginEvent = (e: any) => {
      const { phone, autoSendOtp } = e.detail || {};
      if (phone) {
        const clean = phone.replace(/\D/g, "").slice(-10);
        setPhoneNumber(clean);
        if (autoSendOtp && clean.length === 10) {
          sendOtpForPhone(clean);
        }
      }
    };
    window.addEventListener("kisansetu_open_login", handleLoginEvent);
    return () => window.removeEventListener("kisansetu_open_login", handleLoginEvent);
  }, []);

  // Geolocation auto-detection
  const detectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          if (data) {
            const villageOrLocality = data.locality || data.city || data.principalSubdivisionDistrict || "Local Village";
            const district = data.principalSubdivisionDistrict || data.city || "District Area";
            const state = data.principalSubdivision || "Uttar Pradesh";

            setProfileForm((prev) => ({
              ...prev,
              location: villageOrLocality,
              district: district,
              state: INDIAN_STATES.includes(state) ? state : prev.state,
            }));
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
          setErrorMessage("Could not resolve location name automatically. Please type it in.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn("Location permission denied:", err);
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    sendOtpForPhone(phoneNumber);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate Dummy OTP (4241)
    if (otp.trim() !== "4241") {
      setErrorMessage("Invalid OTP. Please enter dummy code 4241.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsSubmitting(false);
      const existing = localStorage.getItem("kisanSetu_farmer_profile");
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed?.name) {
            onClose();
            router.push("/profile");
            return;
          }
        } catch {}
      }
      // Trigger automatic GPS location check on profile step
      setStep("profile");
      detectLocation();
    }, 250);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!profileForm.location.trim()) {
      setErrorMessage("Please enter your Village / Tehsil location.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const newProfile: FarmerProfileData = {
      name: profileForm.name.trim(),
      phone: `+91 ${phoneNumber || "9876543210"}`,
      state: profileForm.state || "Uttar Pradesh",
      district: profileForm.district.trim() || "Kanpur Nagar",
      location: profileForm.location.trim(),
      area: Number(profileForm.area) || 5,
      primaryCrop: profileForm.primaryCrop || "Paddy (धान)",
      bankAccount: profileForm.bankAccount || "SBI ****4920",
      dbtStatus: "Active & Verified",
      farmerId: `KS-FARM-${Math.floor(1000 + Math.random() * 9000)}`,
      joinedDate: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    };

    localStorage.setItem("kisanSetu_farmer_profile", JSON.stringify(newProfile));
    window.dispatchEvent(new Event("kisanSetu_profile_updated"));
    window.dispatchEvent(new Event("storage"));

    setIsSubmitting(false);
    onClose();
    router.push("/profile");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 py-6 animate-fade-in-up font-sans">
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 text-white overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step 1: Phone Number */}
        {step === "phone" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Farmer Login Portal</h2>
              <p className="text-sm text-slate-400">Enter your 10-digit mobile number to access your account.</p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="flex rounded-2xl bg-slate-950 border border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-all">
                  <span className="px-4 py-3 bg-slate-800 text-slate-300 font-bold text-sm flex items-center border-r border-slate-700">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-500 font-mono text-base focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {errorMessage && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{errorMessage}</p>}

              <button
                type="submit"
                disabled={phoneNumber.length !== 10 || isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? "Sending OTP..." : "Get OTP Code"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification (Dummy: 4241) */}
        {step === "otp" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Verify Mobile Number</h2>
              <p className="text-sm text-slate-400">
                Code sent to <span className="font-bold text-white font-mono">+91 {phoneNumber}</span>
              </p>
            </div>

            {/* Dummy OTP Hint Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-semibold">Fixed Demo OTP Code:</span>
              <span className="font-mono font-black text-emerald-400 text-base tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                4241
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Enter 4-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-center tracking-[0.5em] text-2xl font-black text-emerald-400 rounded-2xl py-3.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono shadow-inner"
                  autoFocus
                />
              </div>

              {errorMessage && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{errorMessage}</p>}

              <button
                type="submit"
                disabled={otp.length !== 4 || isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? "Verifying..." : "Verify & Proceed"}
              </button>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                <button type="button" onClick={() => setStep("phone")} className="hover:text-emerald-400 underline cursor-pointer">
                  Change Number
                </button>
                <button type="button" onClick={() => setOtp("4241")} className="text-emerald-400 hover:underline font-bold cursor-pointer">
                  Auto-Fill 4241
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Farmer Basic Details Setup with Geolocation */}
        {step === "profile" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Farmer Basic Profile</h2>
              <p className="text-xs text-slate-400">Complete your profile to unlock auto-slot booking and token access.</p>
            </div>

            {/* Auto GPS Detect Button */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Device GPS Location</span>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isDetectingLocation ? (
                  <>
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                    Detecting...
                  </>
                ) : (
                  "Auto-Detect Location"
                )}
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rameshwar Singh"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* State & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">State</label>
                  <select
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Kanpur Nagar"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Village & Land Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Village / Tehsil Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kalyanpur"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Land Area (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    placeholder="5.0"
                    value={profileForm.area}
                    onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Primary Crop */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Primary Crop</label>
                <select
                  value={profileForm.primaryCrop}
                  onChange={(e) => setProfileForm({ ...profileForm, primaryCrop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {CROPS_LIST.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage && <p className="text-xs font-bold text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{errorMessage}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] mt-2"
              >
                {isSubmitting ? "Saving Profile..." : "Save Details & Open Profile Page"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
