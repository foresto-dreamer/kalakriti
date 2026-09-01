"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "./Navbar";
import LoginPortal from "./LoginPortal";

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

const DEFAULT_PROFILE: FarmerProfileData = {
  name: "Rameshwar Singh",
  phone: "+91 9876543210",
  state: "Uttar Pradesh",
  district: "Kanpur Nagar",
  location: "Kalyanpur, Block-4",
  area: 6.5,
  primaryCrop: "Paddy (धान)",
  bankAccount: "SBI ****4920",
  dbtStatus: "Active & Verified",
  farmerId: "KS-FARM-8291",
  joinedDate: "Mar 2026",
};

const PROFILE_I18N: Record<string, Record<string, string>> = {
  en: {
    page_title: "Farmer Profile Dashboard",
    page_desc: "Manage your registered agriculture profile, cultivable land, active tokens, and DBT bank ledger.",
    kyc_verified: "KYC Verified",
    member_since: "Member Since",
    farmer_id: "Farmer ID",
    btn_book_slot: "Book Delivery Slot",
    btn_logout: "Log Out",
    metric_land: "Land Holding",
    metric_crop: "Primary Crop",
    metric_dbt_bank: "DBT Linked Account",
    metric_payment_status: "Payment Status",
    tab_details: "Profile Details",
    tab_slots: "Active Tokens & Slots",
    tab_payments: "DBT Sales Ledger",
    sec_info_title: "Farmer Personal & Land Information",
    sec_info_desc: "Official contact and agriculture parameters registered for MSP procurement.",
    btn_edit: "Edit Details",
    btn_cancel: "Cancel",
    btn_save: "Save Profile Changes",
    lbl_name: "Full Name",
    lbl_phone: "Registered Mobile Number",
    lbl_state: "State",
    lbl_district: "District",
    lbl_location: "Village / Tehsil Location",
    lbl_area: "Cultivable Area (Acres)",
    lbl_crop: "Primary Crop Cultivated",
    lbl_bank: "Linked Bank Account",
    lbl_dbt: "DBT Aadhaar Seeding",
    toast_saved: "Profile details updated successfully!",
    confirm_logout: "Are you sure you want to log out from Farmer's Portal?",
    th_tx_id: "Transaction ID",
    th_crop: "Crop & Quantity",
    th_msp: "MSP Rate",
    th_amount: "Total Amount",
    th_date: "Transfer Date",
    th_status: "Payment Status",
    btn_track_live: "Track in Live Queue",
  },
  hi: {
    page_title: "किसान प्रोफाइल डैशबोर्ड",
    page_desc: "अपनी पंजीकृत कृषि प्रोफाइल, भूमि विवरण, सक्रिय टोकन और डीबीटी बैंक लेजर प्रबंधित करें।",
    kyc_verified: "केवाईसी सत्यापित",
    member_since: "सदस्यता",
    farmer_id: "किसान आईडी",
    btn_book_slot: "फसल स्लॉट बुक करें",
    btn_logout: "लॉग आउट",
    metric_land: "कुल भूमि",
    metric_crop: "मुख्य फसल",
    metric_dbt_bank: "डीबीटी बैंक खाता",
    metric_payment_status: "भुगतान स्थिति",
    tab_details: "प्रोफाइल विवरण",
    tab_slots: "सक्रिय टोकन व स्लॉट",
    tab_payments: "डीबीटी खाता लेजर",
    sec_info_title: "व्यक्तिगत व कृषि भूमि विवरण",
    sec_info_desc: "न्यूनतम समर्थन मूल्य (MSP) खरीद के लिए पंजीकृत विवरण।",
    btn_edit: "विवरण संपादित करें",
    btn_cancel: "रद्द करें",
    btn_save: "बदलाव सहेजें",
    lbl_name: "पूरा नाम",
    lbl_phone: "पंजीकृत मोबाइल नंबर",
    lbl_state: "राज्य",
    lbl_district: "जिला",
    lbl_location: "गाँव / तहसील स्थान",
    lbl_area: "कृषि योग्य भूमि (एकड़)",
    lbl_crop: "मुख्य फसल",
    lbl_bank: "संबद्ध बैंक खाता",
    lbl_dbt: "डीबीटी आधार सीडिंग",
    toast_saved: "प्रोफाइल विवरण सफलतापूर्वक अपडेट किया गया!",
    confirm_logout: "क्या आप किसान पोर्टल से लॉग आउट करना चाहते हैं?",
    th_tx_id: "लेनदेन संख्या (ID)",
    th_crop: "फसल व वजन",
    th_msp: "एमएसपी दर",
    th_amount: "कुल राशि",
    th_date: "अंतरण तिथि",
    th_status: "भुगतान स्थिति",
    btn_track_live: "लाइव कतार ट्रैक करें",
  },
  bn: {
    page_title: "কৃষক প্রোফাইল ড্যাশবোর্ড",
    page_desc: "আপনার নিবন্ধিত কৃষি প্রোফাইল, জমির পরিমাণ, লাইভ টোকেন এবং ডিবিটি ব্যাংক লেজার দেখুন।",
    kyc_verified: "কেওয়াইসি যাচাইকৃত",
    member_since: "সদস্যপদ",
    farmer_id: "কৃষক আইডি",
    btn_book_slot: "ডেলিভারি স্লট বুক করুন",
    btn_logout: "লগ আউট",
    metric_land: "মোট জমি",
    metric_crop: "প্রধান শস্য",
    metric_dbt_bank: "ডিবিটি সংযুক্ত ব্যাংক",
    metric_payment_status: "পেমেন্ট স্ট্যাটাস",
    tab_details: "প্রোফাইল বিবরণ",
    tab_slots: "সক্রিয় টোকেন ও স্লট",
    tab_payments: "ডিবিটি লেজার",
    sec_info_title: "ব্যক্তিগত ও কৃষি জমির তথ্য",
    sec_info_desc: "সরকারি সহায়ক মূল্যে ক্রয়ের জন্য নিবন্ধিত সরকারি তথ্য।",
    btn_edit: "সম্পাদনা করুন",
    btn_cancel: "বাতিল",
    btn_save: "সংরক্ষণ করুন",
    lbl_name: "সম্পূর্ণ নাম",
    lbl_phone: "নিবন্ধিত মোবাইল নম্বর",
    lbl_state: "রাজ্য",
    lbl_district: "জেলা",
    lbl_location: "গ্রাম / তহসিল অবস্থান",
    lbl_area: "চাষযোগ্য জমি (একর)",
    lbl_crop: "প্রধান শস্য",
    lbl_bank: "সংযুক্ত ব্যাংক অ্যাকাউন্ট",
    lbl_dbt: "ডিবিটি আধার সংযোগ",
    toast_saved: "প্রোফাইল বিবরণ সফলভাবে আপডেট হয়েছে!",
    confirm_logout: "আপনি কি নিশ্চিত যে আপনি লগ আউট করতে চান?",
    th_tx_id: "লেনদেন নম্বর (ID)",
    th_crop: "শস্য ও পরিমাণ",
    th_msp: "এমএসপি দর",
    th_amount: "মোট টাকা",
    th_date: "স্থানান্তরের তারিখ",
    th_status: "পেমেন্ট স্ট্যাটাস",
    btn_track_live: "লাইভ কাতার ট্র্যাকার",
  },
  pa: {
    page_title: "ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਡੈਸ਼ਬੋਰਡ",
    page_desc: "ਆਪਣੀ ਰਜਿਸਟਰਡ ਖੇਤੀਬਾੜੀ ਪ੍ਰੋਫਾਈਲ, ਜ਼ਮੀਨ ਦੇ ਵੇਰਵੇ, ਲਾਈਵ ਟੋਕਨ ਅਤੇ ਡੀਬੀਟੀ ਖਾਤਾ ਵੇਖੋ।",
    kyc_verified: "ਕੇਵਾਈਸੀ ਪ੍ਰਮਾਣਿਤ",
    member_since: "ਮੈਂਬਰਸ਼ਿਪ",
    farmer_id: "ਕਿਸਾਨ ID",
    btn_book_slot: "ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
    btn_logout: "ਲਾਗ ਆਉਟ",
    metric_land: "ਕੁੱਲ ਜ਼ਮੀਨ",
    metric_crop: "ਮੁੱਖ ਫ਼ਸਲ",
    metric_dbt_bank: "ਡੀਬੀਟੀ ਬੈਂਕ ਖਾਤਾ",
    metric_payment_status: "ਭੁਗਤਾਨ ਸਥਿਤੀ",
    tab_details: "ਪ੍ਰੋਫਾਈਲ ਵੇਰਵੇ",
    tab_slots: "ਸਰਗਰਮ ਟੋਕਨ ਤੇ ਸਲਾਟ",
    tab_payments: "ਡੀਬੀਟੀ ਸੇਲਜ਼ ਲੇਖਾ",
    sec_info_title: "ਨਿੱਜੀ ਅਤੇ ਖੇਤੀਬਾੜੀ ਜ਼ਮੀਨ ਜਾਣਕਾਰੀ",
    sec_info_desc: "ਸਰਕਾਰੀ ਖਰੀਦ ਲਈ ਰਜਿਸਟਰ ਕੀਤੇ ਗਏ ਵੇਰਵੇ।",
    btn_edit: "ਵੇਰਵੇ ਬਦਲੋ",
    btn_cancel: "ਰੱਦ ਕਰੋ",
    btn_save: "ਸੰਭਾਲੋ",
    lbl_name: "ਪੂਰਾ ਨਾਮ",
    lbl_phone: "ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ",
    lbl_state: "ਰਾਜ",
    lbl_district: "ਜ਼ਿਲ੍ਹਾ",
    lbl_location: "ਪਿੰਡ / ਤਹਿਸੀਲ",
    lbl_area: "ਖੇਤੀ ਯੋਗ ਜ਼ਮੀਨ (ਏਕੜ)",
    lbl_crop: "ਮੁੱਖ ਫ਼ਸਲ",
    lbl_bank: "ਜੁੜਿਆ ਬੈਂਕ ਖਾਤਾ",
    lbl_dbt: "ਡੀਬੀਟੀ ਆਧਾਰ ਲਿੰਕ",
    toast_saved: "ਪ੍ਰੋਫਾਈਲ ਵੇਰਵੇ ਸਫਲਤਾਪੂਰਵਕ ਅੱਪਡੇਟ ਕੀਤੇ ਗਏ!",
    confirm_logout: "ਕੀ ਤੁਸੀਂ ਲੌਗ ਆਉਟ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    th_tx_id: "ਲੈਣ-ਦੇਣ ID",
    th_crop: "ਫ਼ਸਲ ਤੇ ਭਾਰ",
    th_msp: "ਐਮ.ਐਸ.ਪੀ. ਰੇਟ",
    th_amount: "ਕੁੱਲ ਰਕਮ",
    th_date: "ਮਿਤੀ",
    th_status: "ਸਥਿਤੀ",
    btn_track_live: "ਲਾਈਵ ਲਾਈਨ ਵੇਖੋ",
  },
  or: {
    page_title: "କୃଷକ ପ୍ରୋଫାଇଲ୍ ଡ୍ୟାସବୋର୍ଡ",
    page_desc: "ଆପଣଙ୍କର ପଞ୍ଜୀକୃତ କୃଷି ପ୍ରୋଫାଇଲ୍, ଜମି ବିବରଣୀ, ସକ୍ରିୟ ଟୋକନ ଏବଂ DBT ଖାତା ପରିଚାଳନା କରନ୍ତୁ।",
    kyc_verified: "KYC ଯାଞ୍ଚ ହୋଇଛି",
    member_since: "ସଦସ୍ୟତା",
    farmer_id: "କୃଷକ ID",
    btn_book_slot: "ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ",
    btn_logout: "ଲଗ୍ ଆଉଟ୍",
    metric_land: "ମୋଟ ଜମି",
    metric_crop: "ମୁଖ୍ୟ ଫସଲ",
    metric_dbt_bank: "DBT ସଂଯୁକ୍ତ ବ୍ୟାଙ୍କ",
    metric_payment_status: "ଦେୟ ସ୍ଥିତି",
    tab_details: "ପ୍ରୋଫାଇଲ୍ ବିବରଣୀ",
    tab_slots: "ସକ୍ରିୟ ଟୋକନ ଓ ସ୍ଲଟ୍",
    tab_payments: "DBT ବିକ୍ରୟ ଲେଖା",
    sec_info_title: "ବ୍ୟକ୍ତିଗତ ଓ କୃଷି ଜମି ବିବରଣୀ",
    sec_info_desc: "ସରକାରୀ MSP କ୍ରୟ ପାଇଁ ପଞ୍ଜୀକୃତ ତଥ୍ୟ।",
    btn_edit: "ସମ୍ପାଦନା କରନ୍ତୁ",
    btn_cancel: "ବାତିଲ୍",
    btn_save: "ସଂରକ୍ଷଣ କରନ୍ତୁ",
    lbl_name: "ପୂରା ନାମ",
    lbl_phone: "ମୋବାଇଲ୍ ନମ୍ବର",
    lbl_state: "ରାଜ୍ୟ",
    lbl_district: "ଜିଲ୍ଲା",
    lbl_location: "ଗ୍ରାମ / ତହସିଲ",
    lbl_area: "ଚାଷ ଜମି (ଏକର)",
    lbl_crop: "ମୁଖ୍ୟ ଫସଲ",
    lbl_bank: "ସଂଯୁକ୍ତ ବ୍ୟାଙ୍କ ଖାତା",
    lbl_dbt: "DBT ଆଧାର ସଂଯୋଗ",
    toast_saved: "ପ୍ରୋଫାଇଲ୍ ସଫଳତାର ସହ ଅଦ୍ୟତନ ହେଲା!",
    confirm_logout: "ଆପଣ କଣ ଲଗ୍ ଆଉଟ୍ କରିବାକୁ ଚାହାଁନ୍ତି?",
    th_tx_id: "କାରବାର ID",
    th_crop: "ଫସଲ ଓ ଓଜନ",
    th_msp: "MSP ଦର",
    th_amount: "ମୋଟ ରାଶି",
    th_date: "ତାରିଖ",
    th_status: "ଦେୟ ସ୍ଥିତି",
    btn_track_live: "ଲାଇଭ୍ ଧାଡ଼ି ଦେଖନ୍ତୁ",
  },
};

const MOCK_BOOKINGS = [
  {
    id: "KS-593021",
    token: 593021,
    crop: "Paddy (Common)",
    weight: 35,
    center: "GreenValley Agriculture Hub",
    date: "2026-08-28",
    slot: "08:00 AM - 10:00 AM",
    status: "Confirmed & Scheduled",
  },
  {
    id: "KS-582109",
    token: 582109,
    crop: "Wheat (Grade A)",
    weight: 40,
    center: "Northern Mandi Depot",
    date: "2026-06-15",
    slot: "10:00 AM - 12:00 PM",
    status: "Completed & Paid",
  },
];

const MOCK_DBT_PAYMENTS = [
  {
    id: "DBT-940281",
    crop: "Paddy (Common)",
    weight: "35 Qtl",
    rate: "₹2,300 / Qtl",
    amount: "₹80,500",
    date: "2026-07-10",
    utr: "SBIN8291048201",
    status: "Transferred to SBI ****4920",
  },
  {
    id: "DBT-882910",
    crop: "Wheat (Grade A)",
    weight: "45 Qtl",
    rate: "₹2,275 / Qtl",
    amount: "₹1,02,375",
    date: "2026-04-18",
    utr: "SBIN7192840192",
    status: "Transferred to SBI ****4920",
  },
  {
    id: "DBT-772901",
    crop: "Mustard",
    weight: "15 Qtl",
    rate: "₹5,650 / Qtl",
    amount: "₹84,750",
    date: "2026-03-24",
    utr: "SBIN6629102948",
    status: "Transferred to SBI ****4920",
  },
];

export default function FarmerProfilePage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const l = PROFILE_I18N[lang] || PROFILE_I18N.en;

  const [profile, setProfile] = useState<FarmerProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FarmerProfileData>(DEFAULT_PROFILE);
  const [toast, setToast] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "slots" | "payments">("details");

  useEffect(() => {
    const loadProfile = () => {
      const stored = localStorage.getItem("kisanSetu_farmer_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const merged = { ...DEFAULT_PROFILE, ...parsed };
          setProfile(merged);
          setFormData(merged);
        } catch {
          setProfile(DEFAULT_PROFILE);
          setFormData(DEFAULT_PROFILE);
        }
      } else {
        setProfile(DEFAULT_PROFILE);
        setFormData(DEFAULT_PROFILE);
      }
    };

    loadProfile();

    window.addEventListener("kisanSetu_profile_updated", loadProfile);
    window.addEventListener("storage", loadProfile);
    return () => {
      window.removeEventListener("kisanSetu_profile_updated", loadProfile);
      window.removeEventListener("storage", loadProfile);
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("kisanSetu_farmer_profile", JSON.stringify(formData));
    setProfile(formData);
    setIsEditing(false);
    setToast(l.toast_saved);
    window.dispatchEvent(new Event("kisanSetu_profile_updated"));
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => setToast(""), 3500);
  };

  const handleLogout = () => {
    if (confirm(l.confirm_logout)) {
      localStorage.removeItem("kisanSetu_farmer_profile");
      window.dispatchEvent(new Event("kisanSetu_profile_updated"));
      window.dispatchEvent(new Event("storage"));
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      <Navbar onLoginClick={() => setLoginModalOpen(true)} />
      <LoginPortal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        {/* Toast Alert */}
        {toast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-emerald-600/20 animate-fade-in-up">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{toast}</span>
            </div>
            <button onClick={() => setToast("")} className="text-white hover:opacity-80 font-black cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Clean Hero Header Card (White Theme) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 text-white p-1 shadow-md shadow-emerald-600/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {l.kyc_verified}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-2">
                  <span>{profile.location}, {profile.district}</span>
                  <span>•</span>
                  <span className="font-mono text-emerald-700 font-bold">{profile.phone}</span>
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                  <span>{l.farmer_id}: <strong className="text-slate-800 font-bold">{profile.farmerId}</strong></span>
                  <span>•</span>
                  <span>{l.member_since}: <strong className="text-slate-800 font-bold">{profile.joinedDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => router.push("/scheduler")}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {l.btn_book_slot}
              </button>
              <button
                onClick={handleLogout}
                className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer font-bold flex items-center gap-1.5"
                title="Log out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {l.btn_logout}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{l.metric_land}</span>
              <span className="text-lg font-black text-slate-900">{profile.area} Acres</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{l.metric_crop}</span>
              <span className="text-lg font-black text-emerald-700">{profile.primaryCrop}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{l.metric_dbt_bank}</span>
              <span className="text-lg font-black text-slate-900 font-mono">{profile.bankAccount}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{l.metric_payment_status}</span>
              <span className="text-lg font-black text-emerald-700">{profile.dbtStatus}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "details"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {l.tab_details}
          </button>
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "slots"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {l.tab_slots} ({MOCK_BOOKINGS.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "payments"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            {l.tab_payments}
          </button>
        </div>

        {/* Tab Content 1: Editable Profile Details */}
        {activeTab === "details" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{l.sec_info_title}</h3>
                <p className="text-xs text-slate-500">{l.sec_info_desc}</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  {l.btn_edit}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFormData(profile);
                    setIsEditing(false);
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                >
                  {l.btn_cancel}
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_name}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_phone}</label>
                  <input
                    type="text"
                    disabled
                    value={formData.phone}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-sm font-mono font-semibold cursor-not-allowed"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_state}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_district}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Village / Tehsil */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_location}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                {/* Land Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_area}</label>
                  <input
                    type="number"
                    step="0.5"
                    disabled={!isEditing}
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Primary Crop */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_crop}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.primaryCrop}
                    onChange={(e) => setFormData({ ...formData, primaryCrop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Bank Account (DBT) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_bank}</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-600 text-slate-900 rounded-xl px-4 py-3 text-sm font-mono font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* DBT Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{l.lbl_dbt}</label>
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    {profile.dbtStatus}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer"
                  >
                    {l.btn_save}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab Content 2: Active Tokens & Slots */}
        {activeTab === "slots" && (
          <div className="space-y-4">
            {MOCK_BOOKINGS.map((slot) => (
              <div
                key={slot.id}
                className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-3xl p-6 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xl font-black font-mono">
                    #{slot.token}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-lg text-slate-900">{slot.center}</h4>
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {slot.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Crop: <strong className="text-slate-900">{slot.crop}</strong> ({slot.weight} Quintals)
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      Date: <strong className="text-slate-900">{slot.date}</strong> | Time: <strong className="text-slate-900">{slot.slot}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => router.push(`/queue?token=${slot.token}&center=${encodeURIComponent(slot.center)}`)}
                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {l.btn_track_live}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content 3: DBT Payment Ledger */}
        {activeTab === "payments" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
            <h3 className="text-xl font-black text-slate-900 mb-1">Direct Benefit Transfer (DBT) Ledger</h3>
            <p className="text-xs text-slate-500 mb-6">Government procurement payment records transferred straight to your bank account.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">{l.th_tx_id}</th>
                    <th className="pb-3">{l.th_crop}</th>
                    <th className="pb-3">{l.th_msp}</th>
                    <th className="pb-3">{l.th_amount}</th>
                    <th className="pb-3">{l.th_date}</th>
                    <th className="pb-3">{l.th_status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {MOCK_DBT_PAYMENTS.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-mono font-bold text-slate-700">{pay.id}</td>
                      <td className="py-4 text-slate-900 font-bold">{pay.crop} ({pay.weight})</td>
                      <td className="py-4 text-slate-600">{pay.rate}</td>
                      <td className="py-4 text-emerald-700 font-black text-base">{pay.amount}</td>
                      <td className="py-4 text-slate-500">{pay.date}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {pay.status}
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
    </div>
  );
}
