"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { MOCK_CENTERS } from "./ProcurementCenters";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  options?: Array<{ label: string; action: () => void | string | Promise<any>; primary?: boolean }>;
  ticket?: {
    tokenId: string;
    tokenNumber: number;
    center: string;
    crop: string;
    weight: number;
    date: string;
    timeSlot: string;
  };
  redirectUrl?: string;
  redirectLabel?: string;
}

interface BookingDraft {
  center: string;
  centreId: string;
  crop: string;
  weight: number;
  date: string;
  timeSlot: string;
  slotId: string;
}

const CROPS = ["Paddy", "Wheat", "Maize", "Mustard", "Barley"];

const CROP_LABELS: Record<string, Record<string, string>> = {
  Paddy: { en: "Paddy", hi: "धान (Paddy)", bn: "ধান (Paddy)", pa: "ਝੋਨਾ (Paddy)", or: "ଧାନ (Paddy)" },
  Wheat: { en: "Wheat", hi: "गेहूं (Wheat)", bn: "গম (Wheat)", pa: "ਕਣਕ (Wheat)", or: "ଗହମ (Wheat)" },
  Maize: { en: "Maize", hi: "मक्का (Maize)", bn: "ভুট্টা (Maize)", pa: "ਮੱਕੀ (Maize)", or: "ମକା (Maize)" },
  Mustard: { en: "Mustard", hi: "सरसों (Mustard)", bn: "সর্ষে (Mustard)", pa: "ਸਰ੍ਹੋਂ (Mustard)", or: "ସୋରିଷ (Mustard)" },
  Barley: { en: "Barley", hi: "जौ (Barley)", bn: "বার্লি (Barley)", pa: "ਜੌਂ (Barley)", or: "ଯବ (Barley)" },
};

const TIME_SLOTS = [
  { time: "08:00 AM - 10:00 AM", id: "11111111-aaa1-1111-1111-111111111111" },
  { time: "10:00 AM - 12:00 PM", id: "11111111-aaa2-1111-1111-111111111111" },
  { time: "12:00 PM - 02:00 PM", id: "11111111-aaa3-1111-1111-111111111111" },
  { time: "02:00 PM - 04:00 PM", id: "11111111-aaa4-1111-1111-111111111111" },
  { time: "04:00 PM - 06:00 PM", id: "11111111-aaa5-1111-1111-111111111111" },
];

const CHAT_I18N: Record<string, Record<string, string>> = {
  en: {
    title: "KisanMitra",
    subtitle: "AI Assistant",
    tagline: "Voice & Auto-Booking",
    welcome: "Namaste! 🙏 I am **KisanMitra**, your AI Assistant. I can help you **book delivery slots**, access your **Gate Pass & QR code**, track **live yard queues & proceedings**, or check weather. Speak or type below!",
    btn_book_slot: "🌾 Book a Delivery Slot",
    btn_gate_pass: "🎫 Gate Pass & QR Code",
    btn_queue: "⚡ Live Queue & Proceedings",
    btn_login_otp: "🔐 Farmer's Login & OTP",
    btn_my_profile: "👨‍🌾 Farmer Profile",
    btn_centers: "📍 View Nearby Centers",
    btn_msp: "💰 Mandi MSP Rates",
    profile_summary: "👨‍🌾 **Farmer Profile Details Found!**\n\n• **Name**: {name}\n• **Farmer ID**: {id}\n• **Location**: {location}, {district}\n• **Land Area**: {area} Acres\n• **Primary Crop**: {crop}\n• **DBT Account**: {bank}\n\nYou can update details, view active tokens, or check DBT sales ledger on your profile page!",
    btn_open_profile: "🚀 Open Full Profile Dashboard",
    step_1_center: "Step 1 of 4: Please choose your nearest **Procurement Center** for crop delivery:",
    step_2_crop: "📍 Center: **{center}** ✅\n\nStep 2 of 4: Which **crop variety** are you delivering?",
    step_3_weight: "🌾 Crop: **{crop}** ✅\n\nStep 3 of 4: What is your estimated **weight in Quintals**? (1 Qtl = 100 kg):",
    step_4_date: "⚖️ Weight: **{weight} Quintals** ✅\n\nStep 4 of 4: Select your **delivery date**:",
    step_5_slot: "📅 Date: **{date}** ✅\n\nFinal Step: Choose an available **arrival time window**:",
    confirm_title: "📋 **Booking Summary Ready!**\n\n• **Center**: {center}\n• **Crop**: {crop}\n• **Weight**: {weight} Quintals ({kg} kg)\n• **Date**: {date}\n• **Time Slot**: {slot}\n\nReady to generate your live digital queue token?",
    btn_confirm_token: "⚡ Yes, Generate Digital Token",
    btn_modify: "🔄 Modify Details",
    booking_success: "🎉 **Booking Confirmed! Token #{token} Generated!**\n\nYour digital token has been registered. Opening Live Queue tracker...",
    btn_track_queue: "⚡ View in Live Queue Tracker",
    btn_book_another: "🔄 Book Another Slot",
    login_ask_phone: "📲 **Farmer Login Portal**\n\nPlease speak or type your **10-digit mobile number** (e.g. 9876543210). I will open the portal with Demo OTP (**4241**) and take you to your Profile! ⚡",
    login_otp_sent: "📱 **Farmer Portal Opened!**\n\nAuto-filled mobile number **+91 {mobile}** and generated Demo OTP **4241**.\n\nPlease enter code **4241** in the popup to open your full profile! 🔐",
    btn_view_login: "🔑 View Login Window",
    fallback_out_of_scope: "I am **KisanMitra**, the digital assistant for **KisanSetu Farmer's Portal** 🌾.\n\nI can assist you with all **KisanSetu services**:\n• **Booking Delivery Slots & Generating Tokens**\n• **Digital Gate Entry Pass & Scannable QR Codes**\n• **Live Yard Queue Position, Tractors Ahead & Proceedings**\n• **Finding Nearby Procurement Centers & Mandis**\n• **Today's Mandi MSP Crop Rates**\n• **Farmer Login & Profile Access**\n\nPlease select one of the platform options below or ask me anything about these services!",
    input_placeholder: "Type or speak: 'My Gate Pass', 'Live Queue', 'Book slot'...",
    listening_banner: "Listening to your voice... Speak now!",
    mic_blocked: "🎙️ Microphone access is blocked in browser settings. Please allow microphone permissions in your address bar or type below!",
    date_today: "Today",
    date_tomorrow: "Tomorrow",
    date_2days: "In 2 Days",
    qtl_10: "10 Quintals (1,000 kg)",
    qtl_25: "25 Quintals (2,500 kg)",
    qtl_35: "35 Quintals (3,500 kg)",
    qtl_50: "50 Quintals (5,000 kg)",
  },
  hi: {
    title: "किसान मित्र",
    subtitle: "एआई सहायक",
    tagline: "आवाज और ऑटो-बुकिंग",
    welcome: "नमस्ते किसान भाई! 🙏 मैं **किसान मित्र** हूँ, किसानसेतु का एआई सहायक। मैं फसल डिलीवरी स्लॉट बुक करने, गेट पास व QR कोड देखने, लाइव कतार स्थिति व मंडी कार्यवाही में आपकी पूरी मदद करूँगा। बोलकर या लिखकर बताएं!",
    btn_book_slot: "🌾 फसल स्लॉट बुक करें",
    btn_gate_pass: "🎫 गेट पास व QR कोड",
    btn_queue: "⚡ लाइव कतार व कार्यवाही",
    btn_login_otp: "🔐 किसान लॉगिन व OTP",
    btn_my_profile: "👨‍🌾 मेरी किसान प्रोफाइल",
    btn_centers: "📍 नजदीकी खरीद केंद्र",
    btn_msp: "💰 मंडी MSP रेट्स",
    profile_summary: "👨‍🌾 **किसान प्रोफाइल विवरण!**\n\n• **नाम**: {name}\n• **किसान ID**: {id}\n• **स्थान**: {location}, {district}\n• **जमीन**: {area} एकड़\n• **मुख्य फसल**: {crop}\n• **DBT बैंक**: {bank}\n\nआप प्रोफाइल पेज पर सभी विवरण अपडेट कर सकते हैं व टोकन व DBT लेजर देख सकते हैं!",
    btn_open_profile: "🚀 पूरा प्रोफाइल पेज खोलें",
    step_1_center: "चरण 1: कृपया फसल डिलीवरी के लिए अपना नजदीकी **खरीद केंद्र** चुनें:",
    step_2_crop: "📍 केंद्र: **{center}** ✅\n\nचरण 2: आप कौन सी **फसल** ला रहे हैं?",
    step_3_weight: "🌾 फसल: **{crop}** ✅\n\nचरण 3: आपका अनुमानित **वजन (क्विंटल में)** कितना है? (1 क्विंटल = 100 किग्रा):",
    step_4_date: "⚖️ वजन: **{weight} क्विंटल** ✅\n\nचरण 4: अपनी **डिलीवरी की तारीख** चुनें:",
    step_5_slot: "📅 तारीख: **{date}** ✅\n\nअंतिम चरण: उपलब्ध **आगमन समय स्लॉट** चुनें:",
    confirm_title: "📋 **बुकिंग विवरण तैयार है!**\n\n• **केंद्र**: {center}\n• **फसल**: {crop}\n• **वजन**: {weight} क्विंटल ({kg} किग्रा)\n• **तारीख**: {date}\n• **समय स्लॉट**: {slot}\n\nक्या आप लाइव डिजिटल टोकन जनरेट करने के लिए तैयार हैं?",
    btn_confirm_token: "⚡ हाँ, डिजिटल टोकन जनरेट करें",
    btn_modify: "🔄 विवरण बदलें",
    booking_success: "🎉 **बुकिंग सफल! टोकन #{token} जनरेट हो गया!**\n\nआपका डिजिटल टोकन दर्ज हो चुका है। लाइव कतार ट्रैकर खोला जा रहा है...",
    btn_track_queue: "⚡ लाइव कतार ट्रैकर देखें",
    btn_book_another: "🔄 दूसरा स्लॉट बुक करें",
    login_ask_phone: "📲 **किसान लॉगिन पोर्टल**\n\nकृपया अपना **10 अंकों का मोबाइल नंबर** (उदा. 9876543210) बोलें या लिखें। मैं डेमो OTP (**4241**) के साथ पोर्टल खोल दूंगा! ⚡",
    login_otp_sent: "📱 **किसान पोर्टल खुल गया!**\n\nमोबाइल नंबर **+91 {mobile}** भरकर डेमो OTP **4241** तैयार है।\n\nकृपया पॉपअप में **4241** दर्ज करके अपनी प्रोफाइल खोलें! 🔐",
    btn_view_login: "🔑 लॉगिन विंडो देखें",
    fallback_out_of_scope: "मैं **किसान मित्र** हूँ, किसानसेतु पोर्टल का डिजिटल सहायक 🌾।\n\nमैं केवल **किसानसेतु पोर्टल सेवाओं** में आपकी सहायता कर सकता हूँ:\n• **फसल टोकन व स्लॉट बुकिंग**\n• **डिजिटल गेट पास व QR कोड**\n• **लाइव यार्ड कतार, ट्रैक्टर ट्रैकिंग व मंडी कार्यवाही**\n• **नजदीकी खरीद केंद्र व मंडियां**\n• **आज के मंडी MSP रेट्स**\n• **किसान लॉगिन व प्रोफाइल**",
    input_placeholder: "बोलें या लिखें: 'मेरा गेट पास', 'लाइव कतार', 'स्लॉट बुक करें'...",
    listening_banner: "आवाज सुनी जा रही है... अब बोलें!",
    mic_blocked: "🎙️ माइक्रोफ़ोन की अनुमति ब्लॉक है। कृपया एड्रेस बार में माइक्रोफ़ोन चालू करें या नीचे लिखें!",
    date_today: "आज",
    date_tomorrow: "कल",
    date_2days: "2 दिन बाद",
    qtl_10: "10 क्विंटल (1,000 kg)",
    qtl_25: "25 क्विंटल (2,500 kg)",
    qtl_35: "35 क्विंटल (3,500 kg)",
    qtl_50: "50 क्विंटल (5,000 kg)",
  },
  bn: {
    title: "কিষাণমিত্র",
    subtitle: "এআই সহকারী",
    tagline: "ভয়েস ও অটো-বুকিং",
    welcome: "নমস্কার কৃষক ভাই! 🙏 আমি **কিষাণমিত্র**, কিষাণসেতু পোর্টালের এআই সহকারী। আমি শস্য ডেলিভারি স্লট বুক করতে, গেট পাস ও QR কোড দেখতে এবং লাইভ কাতার বুঝতে সাহায্য করব। কথা বলুন বা টাইপ করুন!",
    btn_book_slot: "🌾 ডেলিভারি স্লট বুক করুন",
    btn_gate_pass: "🎫 গেট পাস ও QR কোড",
    btn_queue: "⚡ লাইভ কাতার ও কার্যক্রম",
    btn_login_otp: "🔐 কৃষক লগইন ও OTP",
    btn_my_profile: "👨‍🌾 আমার কৃষক প্রোফাইল",
    btn_centers: "📍 নিকটবর্তী ক্রয় কেন্দ্র",
    btn_msp: "💰 আজকের মান্ডি MSP দর",
    profile_summary: "👨‍🌾 **কৃষক প্রোফাইল বিবরণ!**\n\n• **নাম**: {name}\n• **কৃষক আইডি**: {id}\n• **অবস্থান**: {location}, {district}\n• **জমি**: {area} একর\n• **প্রধান শস্য**: {crop}\n• **ডিবিটি ব্যাংক**: {bank}\n\nআপনি আপনার ফুল-স্ক্রিন প্রোফাইল পেজে সমস্ত বিবরণ দেখতে ও আপডেট করতে পারেন!",
    btn_open_profile: "🚀 সম্পূর্ণ প্রোফাইল পেজ খুলুন",
    step_1_center: "ধাপ ১: অনুগ্রহ করে শস্য ডেলিভারির জন্য আপনার নিকটবর্তী **ক্রয় কেন্দ্র** নির্বাচন করুন:",
    step_2_crop: "📍 কেন্দ্র: **{center}** ✅\n\nধাপ ২: আপনি কোন **শস্য** ডেলিভারি করছেন?",
    step_3_weight: "🌾 শস্য: **{crop}** ✅\n\nধাপ ৩: আপনার আনুমানিক **ওজন (কুইন্টালে)** কত? (১ কুইন্টাল = ১০০ কেজি):",
    step_4_date: "⚖️ ওজন: **{weight} কুইন্টাল** ✅\n\nধাপ ৪: আপনার **ডেলিভারির তারিখ** নির্বাচন করুন:",
    step_5_slot: "📅 তারিখ: **{date}** ✅\n\nশেষ ধাপ: একটি উপলব্ধ **সময় স্লট** নির্বাচন করুন:",
    confirm_title: "📋 **বুকিং বিবরণ প্রস্তুত!**\n\n• **কেন্দ্র**: {center}\n• **শস্য**: {crop}\n• **ওজন**: {weight} কুইন্টাল ({kg} কেজি)\n• **তারিখ**: {date}\n• **সময় স্লট**: {slot}\n\nআপনি কি লাইভ ডিজিটাল টোকেন তৈরি করতে প্রস্তুত?",
    btn_confirm_token: "⚡ হ্যাঁ, ডিজিটাল টোকেন তৈরি করুন",
    btn_modify: "🔄 বিবরণ পরিবর্তন করুন",
    booking_success: "🎉 **বুকিং নিশ্চিত! টোকেন #{token} তৈরি হয়েছে!**\n\nআপনার ডিজিটাল টোকেন নিবন্ধিত হয়েছে। লাইভ কাতার ট্র্যাকার খোলা হচ্ছে...",
    btn_track_queue: "⚡ লাইভ কাতার ট্র্যাকার দেখুন",
    btn_book_another: "🔄 অন্য স্লট বুক করুন",
    login_ask_phone: "📲 **কৃষক লগইন পোর্টাল**\n\nঅনুগ্রহ করে আপনার **১০-সংখ্যার মোবাইল নম্বর** বলুন বা লিখুন। ডেমো OTP (**4241**) দিয়ে পোর্টাল খুলে দেওয়া হবে! ⚡",
    login_otp_sent: "📱 **কৃষক পোর্টাল খোলা হয়েছে!**\n\nমোবাইল নম্বর **+91 {mobile}** তৈরি এবং ডেমো OTP **4241**। পপআপে **4241** লিখুন! 🔐",
    btn_view_login: "🔑 লগইন উইন্ডো দেখুন",
    fallback_out_of_scope: "আমি **কিষাণমিত্র**, কিষাণসেতু পোর্টালের ডিজিটাল সহকারী 🌾।\n\nআমি কেবল **কিষাণসেতু প্ল্যাটফর্মের পরিষেবাগুলিতে** সাহায্য করতে পারি:\n• **শস্য টোকেন ও স্লট বুকিং**\n• **ডিজিটাল গেট পাস ও QR কোড**\n• **লাইভ ইয়ার্ড কাতার ও মান্ডি কার্যক্রম**\n• **নিকটবর্তী ক্রয় কেন্দ্র ও মান্ডি**\n• **আজকের মান্ডি এমএসপি দর**",
    input_placeholder: "বলুন বা লিখুন: 'আমার গেট পাস', 'লাইভ কাতার'...",
    listening_banner: "কথা শুনছি... এখন বলুন!",
    mic_blocked: "🎙️ মাইক্রোফোনের অনুমতি বন্ধ আছে। অ্যাড্রেস বারে অনুমতি দিন অথবা নিচে লিখুন!",
    date_today: "আজ",
    date_tomorrow: "আগামীকাল",
    date_2days: "২ দিন পর",
    qtl_10: "১০ কুইন্টাল (১,০০০ কেজি)",
    qtl_25: "২৫ কুইন্টাল (২,৫০০ কেজি)",
    qtl_35: "৩৫ কুইন্টাল (৩,৫০০ কেজি)",
    qtl_50: "৫০ কুইন্টাল (৫,০০০ কেজি)",
  },
  pa: {
    title: "ਕਿਸਾਨ ਮਿੱਤਰ",
    subtitle: "ਏਆਈ ਸਹਾਇਕ",
    tagline: "ਆਵਾਜ਼ ਤੇ ਆਟੋ-ਬੁਕਿੰਗ",
    welcome: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! 🙏 ਮੈਂ **ਕਿਸਾਨ ਮਿੱਤਰ** ਹਾਂ, ਕਿਸਾਨਸੇਤੂ ਦਾ ਏਆਈ ਸਹਾਇਕ। ਮੈਂ ਫ਼ਸਲ ਡਿਲਿਵਰੀ ਸਲਾਟ ਬੁੱਕ ਕਰਨ, ਗੇਟ ਪਾਸ ਤੇ QR ਕੋਡ ਵੇਖਣ, ਲਾਈਵ ਲਾਈਨ ਤੇ ਯਾਰਡ ਕਾਰਵਾਈ ਵੇਖਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਬੋਲੋ ਜਾਂ ਲਿਖੋ!",
    btn_book_slot: "🌾 ਫ਼ਸਲ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
    btn_gate_pass: "🎫 ਗੇਟ ਪਾਸ ਤੇ QR ਕੋਡ",
    btn_queue: "⚡ ਲਾਈਵ ਲਾਈਨ ਤੇ ਕਾਰਵਾਈ",
    btn_login_otp: "🔐 ਕਿਸਾਨ ਲੌਗਇਨ ਤੇ OTP",
    btn_my_profile: "👨‍🌾 ਮੇਰੀ ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ",
    btn_centers: "📍 ਨੇੜਲੇ ਖਰੀਦ ਕੇਂਦਰ",
    btn_msp: "💰 ਮੰਡੀ MSP ਰੇਟ",
    profile_summary: "👨‍🌾 **ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਵੇਰਵੇ!**\n\n• **ਨਾਮ**: {name}\n• **ਕਿਸਾਨ ID**: {id}\n• **ਸਥਾਨ**: {location}, {district}\n• **ਜ਼ਮੀਨ**: {area} ਏਕੜ\n• **ਮੁੱਖ ਫ਼ਸਲ**: {crop}\n• **DBT ਬੈਂਕ**: {bank}\n\nਤੁਸੀਂ ਆਪਣੇ ਪੂਰੇ ਪ੍ਰੋਫਾਈਲ ਪੇਜ 'ਤੇ ਸਾਰੇ ਵੇਰਵੇ ਵੇਖ ਤੇ ਅੱਪਡੇਟ ਕਰ ਸਕਦੇ ਹੋ!",
    btn_open_profile: "🚀 ਪੂਰਾ ਪ੍ਰੋਫਾਈਲ ਪੇਜ ਖੋਲ੍ਹੋ",
    step_1_center: "ਪੜਾਅ 1: ਕਿਰਪਾ ਕਰਕੇ ਫ਼ਸਲ ਡਿਲਿਵਰੀ ਲਈ ਆਪਣਾ ਨੇੜਲਾ **ਖਰੀਦ ਕੇਂਦਰ** ਚੁਣੋ:",
    step_2_crop: "📍 ਕੇਂਦਰ: **{center}** ✅\n\nਪੜਾਅ 2: ਤੁਸੀਂ ਕਿਹੜੀ **ਫ਼ਸਲ** ਲਿਆ ਰਹੇ ਹੋ?",
    step_3_weight: "🌾 ਫ਼ਸਲ: **{crop}** ✅\n\nਪੜਾਅ 3: ਤੁਹਾਡਾ ਅਨੁਮਾਨਿਤ **ਭਾਰ (ਕੁਇੰਟਲ ਵਿੱਚ)** ਕਿੰਨਾ ਹੈ? (1 ਕੁਇੰਟਲ = 100 ਕਿੱਲੋ):",
    step_4_date: "⚖️ ਭਾਰ: **{weight} ਕੁਇੰਟਲ** ✅\n\nਪੜਾਅ 4: ਆਪਣੀ **ਡਿਲਿਵਰੀ ਮਿਤੀ** ਚੁਣੋ:",
    step_5_slot: "📅 ਮਿਤੀ: **{date}** ✅\n\nਆਖਰੀ ਪੜਾਅ: ਉਪਲਬਧ **ਸਮਾਂ ਸਲਾਟ** ਚੁਣੋ:",
    confirm_title: "📋 **ਬੁਕਿੰਗ ਵੇਰਵੇ ਤਿਆਰ ਹਨ!**\n\n• **ਕੇਂਦਰ**: {center}\n• **ਫ਼ਸਲ**: {crop}\n• **ਭਾਰ**: {weight} ਕੁਇੰਟਲ ({kg} ਕਿੱਲੋ)\n• **ਮਿਤੀ**: {date}\n• **ਸਮਾਂ ਸਲਾਟ**: {slot}\n\nਕੀ ਤੁਸੀਂ ਡਿਜੀਟਲ ਟੋਕਨ ਬਣਾਉਣ ਲਈ ਤਿਆਰ ਹੋ?",
    btn_confirm_token: "⚡ ਹਾਂ, ਡਿਜੀਟਲ ਟੋਕਨ ਬਣਾਓ",
    btn_modify: "🔄 ਵੇਰਵੇ ਬਦਲੋ",
    booking_success: "🎉 **ਬੁਕਿੰਗ ਪੱਕੀ! ਟੋਕਨ #{token} ਬਣ ਗਿਆ!**\n\nਤੁਹਾਡਾ ਡਿਜੀਟਲ ਟੋਕਨ ਦਰਜ ਹੋ ਚੁੱਕਾ ਹੈ। ਲਾਈਵ ਲਾਈਨ ਟਰੈਕਰ ਖੋਲ੍ਹਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    btn_track_queue: "⚡ ਲਾਈਵ ਲਾਈਨ ਵੇਖੋ",
    btn_book_another: "🔄 ਹੋਰ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
    login_ask_phone: "📲 **ਕਿਸਾਨ ਲੌਗਇਨ ਪੋਰਟਲ**\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ **10-ਅੰਕਾਂ ਵਾਲਾ ਮੋਬਾਈਲ ਨੰਬਰ** (ਜਿਵੇਂ 9876543210) ਬੋਲੋ ਜਾਂ ਲਿਖੋ। ਡੈਮੋ OTP (**4241**) ਨਾਲ ਪੋਰਟਲ ਖੋਲ੍ਹਿਆ ਜਾਵੇਗਾ! ⚡",
    login_otp_sent: "📱 **ਕਿਸਾਨ ਪੋਰਟਲ ਖੁੱਲ੍ਹ ਗਿਆ!**\n\nਮੋਬਾਈਲ ਨੰਬਰ **+91 {mobile}** ਅਤੇ ਡੈਮੋ OTP **4241**। ਪੌਪਅੱਪ ਵਿੱਚ **4241** ਭਰੋ! 🔐",
    btn_view_login: "🔑 ਲੌਗਇਨ ਵਿੰਡੋ ਵੇਖੋ",
    fallback_out_of_scope: "ਮੈਂ **ਕਿਸਾਨ ਮਿੱਤਰ** ਹਾਂ, ਕਿਸਾਨਸੇਤੂ ਪੋਰਟਲ ਦਾ ਡਿਜੀਟਲ ਸਹਾਇਕ 🌾।\n\nਮੈਂ ਕੇਵਲ **ਕਿਸਾਨਸੇਤੂ ਪੋਰਟਲ ਸੇਵਾਵਾਂ** ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n• **ਫ਼ਸਲ ਟੋਕਨ ਤੇ ਸਲਾਟ ਬੁਕਿੰਗ**\n• **ਡਿਜੀਟਲ ਗੇਟ ਪਾਸ ਤੇ QR ਕੋਡ**\n• **ਲਾਈਵ ਯਾਰਡ ਲਾਈਨ ਤੇ ਮੰਡੀ ਕਾਰਵਾਈ**\n• **ਨੇੜਲੇ ਖਰੀਦ ਕੇਂਦਰ ਤੇ ਮੰਡੀਆਂ**\n• **ਅੱਜ ਦੇ ਮੰਡੀ MSP ਰੇਟ**",
    input_placeholder: "ਬੋਲੋ ਜਾਂ ਲਿਖੋ: 'ਮੇਰਾ ਗੇਟ ਪਾਸ', 'ਲਾਈਵ ਲਾਈਨ'...",
    listening_banner: "ਆਵਾਜ਼ ਸੁਣ ਰਿਹਾ ਹਾਂ... ਹੁਣ ਬੋਲੋ!",
    mic_blocked: "🎙️ ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਬੰਦ ਹੈ। ਐਡਰੈੱਸ ਬਾਰ ਵਿੱਚ ਇਜਾਜ਼ਤ ਦਿਓ ਜਾਂ ਹੇਠਾਂ ਲਿਖੋ!",
    date_today: "ਅੱਜ",
    date_tomorrow: "ਭਲਕੇ (ਕੱਲ੍ਹ)",
    date_2days: "2 ਦਿਨਾਂ ਬਾਅਦ",
    qtl_10: "10 ਕੁਇੰਟਲ (1,000 kg)",
    qtl_25: "25 ਕੁਇੰਟਲ (2,500 kg)",
    qtl_35: "35 ਕੁਇੰਟਲ (3,500 kg)",
    qtl_50: "50 ਕੁਇੰਟਲ (5,000 kg)",
  },
  or: {
    title: "କିଷାନ ମିତ୍ର",
    subtitle: "ଏଆଇ ସହାୟକ",
    tagline: "ଭଏସ୍ ଓ ଅଟୋ-ବୁକିଂ",
    welcome: "ନମସ୍କାର କୃଷକ ଭାଇ! 🙏 ମୁଁ **କିଷାନ ମିତ୍ର**, କିଷାନସେତୁର ଏଆଇ ସହାୟକ। ଫସଲ ଡେଲିଭରୀ ସ୍ଲଟ୍ ବୁକିଂ, ଗେଟ୍ ପାସ୍ ଓ QR କୋଡ୍, ଲାଇଭ୍ ଧାଡ଼ି ସ୍ଥିତି ଏବଂ କାର୍ଯ୍ୟପ୍ରଣାଳୀ ଜାଣିବାରେ ମୁଁ ସାହାଯ୍ୟ କରିବି। କୁହନ୍ତୁ କିମ୍ବା ଲେଖନ୍ତୁ!",
    btn_book_slot: "🌾 ଫସଲ ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ",
    btn_gate_pass: "🎫 ଗେଟ୍ ପାସ୍ ଓ QR କୋଡ୍",
    btn_queue: "⚡ ଲାଇଭ୍ ଧାଡ଼ି ଓ ପ୍ରଣାଳୀ",
    btn_login_otp: "🔐 କୃଷକ ଲଗଇନ୍ ଓ OTP",
    btn_my_profile: "👨‍🌾 ମୋର କୃଷକ ପ୍ରୋଫାଇଲ୍",
    btn_centers: "📍 ନିକଟସ୍ଥ କ୍ରୟ କେନ୍ଦ୍ର",
    btn_msp: "💰 ଆଜିର ମଣ୍ଡି MSP ଦର",
    profile_summary: "👨‍🌾 **କୃଷକ ପ୍ରୋଫାଇଲ୍ ବିବରଣୀ!**\n\n• **ନାମ**: {name}\n• **କୃଷକ ID**: {id}\n• **ସ୍ଥାନ**: {location}, {district}\n• **ଜମି**: {area} ଏକର\n• **ମୁଖ୍ୟ ଫସଲ**: {crop}\n• **DBT ବ୍ୟାଙ୍କ**: {bank}\n\nଆପଣ ପ୍ରୋଫାଇଲ୍ ପେଜ୍ ଖୋଲି ବିବରଣୀ ଅଦ୍ୟତନ କରିପାରିବେ!",
    btn_open_profile: "🚀 ପ୍ରୋଫାଇଲ୍ ପେଜ୍ ଖୋଲନ୍ତୁ",
    step_1_center: "ପର୍ଯ୍ୟାୟ ୧: ଦୟାକରି ଫସଲ ଡେଲିଭରୀ ପାଇଁ ଆପଣଙ୍କ ନିକଟସ୍ଥ **କ୍ରୟ କେନ୍ଦ୍ର** ବାଛନ୍ତୁ:",
    step_2_crop: "📍 କେନ୍ଦ୍ର: **{center}** ✅\n\nପର୍ଯ୍ୟାୟ ୨: ଆପଣ କେଉଁ **ଫସଲ** ଆଣୁଛନ୍ତି?",
    step_3_weight: "🌾 ଫସଲ: **{crop}** ✅\n\nପର୍ଯ୍ୟାୟ ୩: ଆପଣଙ୍କର ଆନୁମାନିକ **ଓଜନ (କ୍ୱିଣ୍ଟାଲରେ)** କେତେ? (୧ କ୍ୱିଣ୍ଟାଲ = ୧୦୦ କିଗ୍ରା):",
    step_4_date: "⚖️ ଓଜନ: **{weight} କ୍ୱିଣ୍ଟାଲ** ✅\n\nପର୍ଯ୍ୟାୟ ୪: ଆପଣଙ୍କ **ଡେଲିଭରୀ ତାରିଖ** ବାଛନ୍ତୁ:",
    step_5_slot: "📅 ତାରିଖ: **{date}** ✅\n\nଶେଷ ପର୍ଯ୍ୟାୟ: ଉପଲବ୍ଧ **ସମୟ ସ୍ଲଟ୍** ବାଛନ୍ତୁ:",
    confirm_title: "📋 **ବୁକିଂ ବିବରଣୀ ପ୍ରସ୍ତୁତ!**\n\n• **କେନ୍ଦ୍ର**: {center}\n• **ଫସଲ**: {crop}\n• **ଓଜନ**: {weight} କ୍ୱିଣ୍ଟାଲ ({kg} କିଗ୍ରା)\n• **ତାରିଖ**: {date}\n• **ସମୟ ସ୍ଲଟ୍**: {slot}\n\nଆପଣ କଣ ଡିଜିଟାଲ୍ ଟୋକନ ସୃଷ୍ଟି କରିବାକୁ ପ୍ରସ୍ତୁତ?",
    btn_confirm_token: "⚡ ହଁ, ଡିଜିଟାଲ୍ ଟୋକନ ସୃଷ୍ଟି କରନ୍ତୁ",
    btn_modify: "🔄 ବିବରଣୀ ବଦଳାନ୍ତୁ",
    booking_success: "🎉 **ବୁକିଂ ନିଶ୍ଚିତ! ଟୋକନ #{token} ସୃଷ୍ଟି ହୋଇଛି!**\n\nଲାଇଭ୍ ଧାଡ଼ି ଟ୍ରାକର୍ ଖୋଲାଯାଉଛି...",
    btn_track_queue: "⚡ ଲାଇଭ୍ ଧାଡ଼ି ଦେଖନ୍ତୁ",
    btn_book_another: "🔄 ଅନ୍ୟ ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ",
    login_ask_phone: "📲 **କୃଷକ ଲଗଇନ୍ ପୋର୍ଟାଲ୍**\n\nଦୟାକରି ଆପଣଙ୍କର **୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର** କୁହନ୍ତୁ କିମ୍ବା ଲେଖନ୍ତୁ। ଡେମୋ OTP (**4241**) ବ୍ୟବହାର ହେବ! ⚡",
    login_otp_sent: "📱 **କୃଷକ ପୋର୍ଟାଲ୍ ଖୋଲିଗଲା!**\n\nମୋବାଇଲ୍ ନମ୍ବର **+91 {mobile}** ଓ ଡେମୋ OTP **4241**। ପପ୍-ଅପ୍ ରେ **4241** ଦିଅନ୍ତୁ! 🔐",
    btn_view_login: "🔑 ଲଗଇନ୍ ୱିଣ୍ଡୋ ଦେଖନ୍ତୁ",
    fallback_out_of_scope: "ମୁଁ **କିଷାନ ମିତ୍ର**, କିଷାନସେତୁ ପୋର୍ଟାଲର ଡିଜିଟାଲ୍ ସହାୟକ 🌾।\n\nମୁଁ କେବଳ **କିଷାନସେତୁ ସେବା**ରେ ସାହାଯ୍ୟ କରିପାରିବି:\n• **ଫସଲ ଟୋକନ ଓ ସ୍ଲଟ୍ ବୁକିଂ**\n• **ଡିଜିଟାଲ୍ ଗେଟ୍ ପାସ୍ ଓ QR କୋଡ୍**\n• **ଲାଇଭ୍ ମଣ୍ଡି ଧାଡ଼ି ଓ ଟ୍ରାକ୍ଟର ପ୍ରଣାଳୀ**\n• **ନିକଟସ୍ଥ କ୍ରୟ କେନ୍ଦ୍ର ଓ ମଣ୍ଡି**\n• **ଆଜିର ମଣ୍ଡି MSP ଦର**",
    input_placeholder: "କୁହନ୍ତୁ କିମ୍ବା ଲେଖନ୍ତୁ: 'ମୋ ଗେଟ୍ ପାସ୍', 'ଲାଇଭ୍ ଧାଡ଼ି'...",
    listening_banner: "ଶୁଣୁଛି... ଏବେ କୁହନ୍ତୁ!",
    mic_blocked: "🎙️ ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ବନ୍ଦ ଅଛି। ତଳେ ଲେଖନ୍ତୁ!",
    date_today: "ଆଜି",
    date_tomorrow: "ଆସନ୍ତାକାଲି",
    date_2days: "୨ ଦିନ ପରେ",
    qtl_10: "୧୦ କ୍ୱିଣ୍ଟାଲ (୧,୦୦୦ kg)",
    qtl_25: "୨୫ କ୍ୱିଣ୍ଟାଲ (୨,୫୦୦ kg)",
    qtl_35: "୩୫ କ୍ୱିଣ୍ଟାଲ (୩,୫୦୦ kg)",
    qtl_50: "୫୦ କ୍ୱିଣ୍ଟାଲ (୫,୦୦୦ kg)",
  },
};

function renderFormattedText(text: string, isUser: boolean) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, lIdx) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={lIdx} className="block leading-relaxed">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                const inner = part.slice(2, -2);
                return (
                  <strong
                    key={pIdx}
                    className={isUser ? "font-extrabold text-slate-950" : "font-extrabold text-emerald-300"}
                  >
                    {inner}
                  </strong>
                );
              }
              return part;
            })}
          </span>
        );
      })}
    </div>
  );
}

export default function KisanChatbot() {
  const router = useRouter();
  const { t, lang } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);
  const voiceReplyRef = useRef<boolean>(true);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [isAwaitingLoginPhone, setIsAwaitingLoginPhone] = useState(false);

  useEffect(() => {
    try {
      const storedVoice = localStorage.getItem("kisansetu_voice_reply");
      if (storedVoice !== null) {
        const val = storedVoice === "true";
        setVoiceReply(val);
        voiceReplyRef.current = val;
      }
    } catch {}
  }, []);

  useEffect(() => {
    voiceReplyRef.current = voiceReply;
  }, [voiceReply]);

  const loc = CHAT_I18N[lang] || CHAT_I18N.en;

  const triggerFarmerLogin = (phone?: string, autoSendOtp: boolean = true) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("kisansetu_open_login", {
          detail: { phone, autoSendOtp },
        })
      );
    }
  };

  // Restore open state across navigations
  useEffect(() => {
    try {
      const storedOpen = sessionStorage.getItem("kisansetu_chat_open");
      if (storedOpen === "true") {
        setIsOpen(true);
      }
    } catch {}
  }, []);

  const toggleOpenState = (open: boolean) => {
    if (!open) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setIsClosing(true);
      try {
        sessionStorage.setItem("kisansetu_chat_open", "false");
      } catch {}
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 260);
    } else {
      setIsClosing(false);
      setIsOpen(true);
      try {
        sessionStorage.setItem("kisansetu_chat_open", "true");
      } catch {}
    }
  };

  // Persistent reference to booking state
  const bookingDraftRef = useRef<BookingDraft>({
    center: "",
    centreId: "",
    crop: "",
    weight: 0,
    date: "",
    timeSlot: "",
    slotId: "",
  });

  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(bookingDraftRef.current);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initial welcome message or update on language change
  useEffect(() => {
    const welcomeMsg = getWelcomeMessage(lang);
    setMessages([welcomeMsg]);
  }, [lang]);

  // Web Speech Synthesis (Text to Speech)
  const speakText = (text: string) => {
    if (!voiceReplyRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
        .replace(/[*_#•]/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const langMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        pa: "pa-IN",
        bn: "bn-IN",
        or: "or-IN",
      };
      utterance.lang = langMap[lang] || "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Web Speech Recognition (Speech to Text)
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      const langMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        pa: "pa-IN",
        bn: "bn-IN",
        or: "or-IN",
      };
      recognition.lang = langMap[lang] || "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          const l = CHAT_I18N[lang] || CHAT_I18N.en;
          const micMsg: Message = {
            id: "mic-err-" + Date.now(),
            sender: "bot",
            text: l.mic_blocked,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, micMsg]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  function getWelcomeMessage(currentLang: string): Message {
    const l = CHAT_I18N[currentLang] || CHAT_I18N.en;

    return {
      id: "welcome-1",
      sender: "bot",
      text: l.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: [
        { label: l.btn_book_slot, action: () => startBookingFlow({}) },
        { label: l.btn_gate_pass || "🎫 Gate Pass & QR", action: () => showGatePassDetails() },
        { label: l.btn_queue || "⚡ Live Queue & Proceedings", action: () => showQueueProceedings() },
        { label: "🌤️ Live Weather", action: () => showLiveWeather() },
        { label: l.btn_my_profile || "👨‍🌾 Farmer Profile", action: () => handleNavigate("/profile", "Opening Farmer Profile Dashboard...") },
        { label: l.btn_login_otp, action: () => promptLogin() },
        { label: l.btn_centers, action: () => handleNavigate("/centers", "Navigating to Procurement Centers...") },
        { label: l.btn_msp, action: () => showMspRates() },
      ],
    };
  }

  const promptLogin = () => {
    const l = CHAT_I18N[lang] || CHAT_I18N.en;
    setIsAwaitingLoginPhone(true);
    const askPhoneMsg: Message = {
      id: "login-ask-" + Date.now(),
      sender: "bot",
      text: l.login_ask_phone,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: [
        { label: l.btn_view_login, action: () => triggerFarmerLogin() },
      ],
    };
    setMessages((prev) => [...prev, askPhoneMsg]);
    speakText(l.login_ask_phone.replace(/[*_#•]/g, ""));
  };

  // Real-time navigation sync
  const handleNavigate = (path: string, message: string) => {
    const botMsg: Message = {
      id: "nav-" + Date.now(),
      sender: "bot",
      text: `${message} 🚀`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      redirectUrl: path,
      redirectLabel: `Open ${path === "/centers" ? "Centers" : path === "/queue" ? "Live Queue" : path === "/pass" ? "Gate Pass" : "Portal"}`,
    };
    setMessages((prev) => [...prev, botMsg]);
    speakText(message);
    router.push(path);
  };

  // Show Gate Pass & QR Code Details
  const showGatePassDetails = () => {
    let storedBooking: any = null;
    let farmerProfile: any = null;

    if (typeof window !== "undefined") {
      try {
        const b = localStorage.getItem("kisanSetu_latest_booking");
        if (b) storedBooking = JSON.parse(b);
        const p = localStorage.getItem("kisanSetu_farmer_profile") || localStorage.getItem("farmer_profile");
        if (p) farmerProfile = JSON.parse(p);
      } catch {}
    }

    const token = storedBooking?.tokenId || "KS-781920";
    const name = storedBooking?.farmerName || farmerProfile?.name || "Ramesh Kumar";
    const center = storedBooking?.center || "Chandaka RMC Procurement Yard, Odisha";
    const crop = storedBooking?.crop || "Paddy (Common)";
    const weight = storedBooking?.weight || 35;
    const timeSlot = storedBooking?.timeSlot || "08:00 AM - 10:00 AM";
    const date = storedBooking?.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const isHi = lang === "hi";
    const isBn = lang === "bn";
    const isPa = lang === "pa";
    const isOr = lang === "or";

    const passText =
      isHi
        ? `🎫 **आपका डिजिटल गेट पास व QR कोड विवरण!**\n\n• **असाइन किया गया टोकन**: **${token}**\n• **किसान लाभार्थी**: **${name}**\n• **खरीद केंद्र**: 🏬 ${center}\n• **फसल व वजन**: 🌾 ${crop} (${weight} क्विंटल)\n• **आगमन समय**: ⏰ ${timeSlot} • 📅 ${date}\n• **पास स्थिति**: 🟢 वैध वन-टाइम गेट पास\n\nइस पास में हाई-रेज़ोल्यूशन QR कोड शामिल है जिसे मंडी गेट पर ऑपरेटर द्वारा स्कैन किया जाता है!`
        : isBn
        ? `🎫 **আপনার ডিজিটাল গেট পাস ও QR কোড বিবরণ!**\n\n• **টোকেন নম্বর**: **${token}**\n• **কৃষক নাম**: **${name}**\n• **ক্রয় কেন্দ্র**: 🏬 ${center}\n• **শস্য ও ওজন**: 🌾 ${crop} (${weight} কুইন্টাল)\n• **সময় উইন্ডো**: ⏰ ${timeSlot} • 📅 ${date}\n• **স্ট্যাটাস**: 🟢 বৈধ ওয়ান-টাইম গেট পাস`
        : isPa
        ? `🎫 **ਤੁਹਾਡਾ ਡਿਜੀਟਲ ਗੇਟ ਪਾਸ ਤੇ QR ਕੋਡ ਵੇਰਵਾ!**\n\n• **ਟੋਕਨ ਨੰਬਰ**: **${token}**\n• **ਕਿਸਾਨ ਦਾ ਨਾਮ**: **${name}**\n• **ਖਰੀਦ ਕੇਂਦਰ**: 🏬 ${center}\n• **ਫ਼ਸਲ ਤੇ ਵਜ਼ਨ**: 🌾 ${crop} (${weight} ਕੁਇੰਟਲ)\n• **ਸਮਾਂ ਸਲਾਟ**: ⏰ ${timeSlot} • 📅 ${date}`
        : isOr
        ? `🎫 **ଆପଣଙ୍କର ଡିଜିଟାଲ୍ ଗେଟ୍ ପାସ୍ ଓ QR କୋଡ୍ ବିବରଣୀ!**\n\n• **ଟୋକନ ନମ୍ବର**: **${token}**\n• **କୃଷକ ନାମ**: **${name}**\n• **କ୍ରୟ କେନ୍ଦ୍ର**: 🏬 ${center}\n• **ଫସଲ ଓ ଓଜନ**: 🌾 ${crop} (${weight} କ୍ୱିଣ୍ଟାଲ)\n• **ସମୟ**: ⏰ ${timeSlot} • 📅 ${date}`
        : `🎫 **Your Digital APMC Gate Pass & Scannable QR Code**\n\n• **Assigned Token ID**: **${token}**\n• **Farmer Beneficiary**: **${name}**\n• **Procurement Yard**: 🏬 ${center}\n• **Crop & Weight**: 🌾 ${crop} (${weight} Quintals)\n• **Arrival Window**: ⏰ ${timeSlot} • 📅 ${date}\n• **Pass Status**: 🟢 Active One-Time QR Pass\n\nPresent your scannable QR pass at the APMC gate for instant contactless check-in.`;

    const msg: Message = {
      id: "pass-" + Date.now(),
      sender: "bot",
      text: passText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      redirectUrl: `/pass?token=${token.replace(/\D/g, "")}`,
      redirectLabel: isHi ? "🎫 पूरा गेट पास व QR कोड खोलें" : "🎫 Open Full Gate Pass & QR Code",
      options: [
        {
          label: isHi ? "🎫 डिजिटल गेट पास खोलें" : isBn ? "🎫 গেট পাস খুলুন" : isPa ? "🎫 ਗੇਟ ਪਾਸ ਖੋਲ੍ਹੋ" : isOr ? "🎫 ଗେଟ୍ ପାସ୍ ଖୋଲନ୍ତୁ" : "🎫 Open Gate Pass & QR",
          primary: true,
          action: () => handleNavigate(`/pass?token=${token.replace(/\D/g, "")}`, "Opening your Official Gate Pass with high-res QR code..."),
        },
        {
          label: isHi ? "🚜 लाइव कतार स्थिति देखें" : isBn ? "🚜 লাইভ কাতার দেখুন" : isPa ? "🚜 ਲਾਈਵ ਲਾਈਨ ਵੇਖੋ" : isOr ? "🚜 ଲାଇଭ୍ ଧାଡ଼ି ଦେଖନ୍ତୁ" : "🚜 Track Live Yard Queue",
          action: () => handleNavigate(`/queue?token=${token.replace(/\D/g, "")}&center=${encodeURIComponent(center)}`, "Opening Live Yard Queue tracker..."),
        },
        {
          label: isHi ? "🌾 नया स्लॉट बुक करें" : "🌾 Book Another Slot",
          action: () => startBookingFlow({}),
        },
      ],
    };

    setMessages((prev) => [...prev, msg]);
    speakText(passText.replace(/[*_#•]/g, ""));
  };

  // Show Live Queue & Mandi Proceedings Timeline
  const showQueueProceedings = () => {
    let storedBooking: any = null;
    if (typeof window !== "undefined") {
      try {
        const b = localStorage.getItem("kisanSetu_latest_booking");
        if (b) storedBooking = JSON.parse(b);
      } catch {}
    }

    const token = storedBooking?.tokenId || "KS-781920";
    const numToken = storedBooking?.tokenNumber || Number(token.replace(/\D/g, "")) || 112;
    const center = storedBooking?.center || "Chandaka RMC Procurement Yard, Odisha";

    const isHi = lang === "hi";
    const isBn = lang === "bn";
    const isPa = lang === "pa";
    const isOr = lang === "or";

    const queueText =
      isHi
        ? `🚜 **लाइव मंडी कतार व यार्ड प्रगति स्थिति!**\n\n• **आपका टोकन नंबर**: **#${numToken}**\n• **खरीद मंडी**: 🏬 ${center}\n• **आगे की गाड़ियाँ**: 🚜 **2 ट्रैक्टर आगे हैं** (कन्वेयर लाइन में)\n• **अनुमानित प्रतीक्षा समय**: ⏱️ **~15 मिनट**\n\n📋 **मंडी कार्यवाही चरण (Proceedings)**:\n  1️⃣ **गेट एंट्री**: QR कोड स्कैन कर तुरंत चेक-इन करें।\n  2️⃣ **वेईब्रिज वजन तुला ⚖️**: ट्रैक्टर का सकल वजन दर्ज होता है।\n  3️⃣ **अनलोडिंग बे**: फसल की नमी व गुणवत्ता परीक्षण।\n  4️⃣ **त्वरित DBT भुगतान**: MSP दर अनुसार सीधे बैंक खाते में भुगतान!\n\nलाइव पेज हर 10 सेकंड में स्वतः रिफ्रेश होता है!`
        : isBn
        ? `🚜 **লাইভ মান্ডি কাতার ও ইয়ার্ড ট্র্যাকার!**\n\n• **আপনার টোকেন**: **#${numToken}**\n• **ক্রয় মান্ডি**: 🏬 ${center}\n• **সামনে ট্র্যাক্টর**: 🚜 **২টি ট্র্যাক্টর সামনে আছে**\n• **আনুমানিক সময়**: ⏱️ **~১৫ মিনিট**\n\n📋 **মান্ডি কার্যক্রম (Proceedings)**:\n  ১. গেট QR স্ক্যান ➔ ২. ওয়েইব্রিজ স্কেল ⚖️ ➔ ৩. আনলোডিং ➔ ৪. সরাসরি DBT পেমেন্ট!`
        : isPa
        ? `🚜 **ਲਾਈਵ ਮੰਡੀ ਲਾਈਨ ਤੇ ਯਾਰਡ ਸਥਿਤੀ!**\n\n• **ਤੁਹਾਡਾ ਟੋਕਨ**: **#${numToken}**\n• **ਮੰਡੀ ਕੇਂਦਰ**: 🏬 ${center}\n• **ਅੱਗੇ ਟਰੈਕਟਰ**: 🚜 **2 ਟਰੈਕਟਰ ਅੱਗੇ ਹਨ**\n• **ਉਡੀਕ ਸਮਾਂ**: ⏱️ **~15 ਮਿੰਟ**\n\n📋 **ਮੰਡੀ ਕਾਰਵਾਈ (Proceedings)**:\n  1. ਗੇਟ QR ➔ 2. ਵੇਈਬ੍ਰਿਜ ⚖️ ➔ 3. ਅਨਲੋਡਿੰਗ ➔ 4. DBT ਪੇਮੈਂਟ!`
        : isOr
        ? `🚜 **ଲାଇଭ୍ ମଣ୍ଡି ଧାଡ଼ି ଓ ଟ୍ରାକର୍ ବିବରଣୀ!**\n\n• **ଆପଣଙ୍କ ଟୋକନ**: **#${numToken}**\n• **କ୍ରୟ ମଣ୍ଡି**: 🏬 ${center}\n• **ଆଗରେ ଟ୍ରାକ୍ଟର**: 🚜 **୨ଟି ଟ୍ରାକ୍ଟର ଆଗରେ ଅଛି**\n• **ସମୟ**: ⏱️ **~୧୫ ମିନିଟ୍**\n\n📋 **ମଣ୍ଡି ପ୍ରଣାଳୀ (Proceedings)**:\n  ୧. ଗେଟ୍ QR ➔ ୨. ୱେଇବ୍ରିଜ୍ ⚖️ ➔ ୩. ଅନଲୋଡିଂ ➔ ୪. DBT ଦେୟ!`
        : `🚜 **Live Mandi Yard Progression & Queue Tracker**\n\n• **Your Assigned Token**: **#${numToken}**\n• **Procurement Hub**: 🏬 ${center}\n• **Tractors Ahead**: 🚜 **2 Tractors Ahead** in conveyor line\n• **Estimated Wait Time**: ⏱️ **~15 minutes**\n\n📋 **Mandi Proceedings Timeline**:\n  1️⃣ **Gate Entry**: Instant QR scan contactless check-in.\n  2️⃣ **Weighbridge Scale ⚖️**: Digital gross weight measurement.\n  3️⃣ **Unloading Bay**: Moisture & crop quality inspection.\n  4️⃣ **Direct DBT Payout**: Automatic payment transfer to your bank account!\n\nThe live yard automatically auto-refreshes every 10 seconds.`;

    const msg: Message = {
      id: "queue-" + Date.now(),
      sender: "bot",
      text: queueText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      redirectUrl: `/queue?token=${numToken}&center=${encodeURIComponent(center)}`,
      redirectLabel: isHi ? "🚜 लाइव कतार ट्रैकर खोलें" : "🚜 Open Live Queue Tracker",
      options: [
        {
          label: isHi ? "🚜 लाइव कतार ट्रैकर खोलें" : isBn ? "🚜 লাইভ কাতার খুলুন" : isPa ? "🚜 ਲਾਈਵ ਲਾਈਨ ਖੋਲ੍ਹੋ" : isOr ? "🚜 ଲାଇଭ୍ ଧାଡ଼ି ଖୋଲନ୍ତୁ" : "🚜 Track Live Yard Queue",
          primary: true,
          action: () => handleNavigate(`/queue?token=${numToken}&center=${encodeURIComponent(center)}`, "Opening Live Yard Queue Convoy Tracker..."),
        },
        {
          label: isHi ? "🎫 डिजिटल गेट पास देखें" : isBn ? "🎫 গেট পাস দেখুন" : isPa ? "🎫 ਗੇਟ ਪਾਸ ਵੇਖੋ" : isOr ? "🎫 ଗେଟ୍ ପାସ୍ ଦେଖନ୍ତୁ" : "🎫 View Gate Pass & QR",
          action: () => handleNavigate(`/pass?token=${token.replace(/\D/g, "")}`, "Opening your Official Gate Pass..."),
        },
        {
          label: isHi ? "📍 खरीद केंद्र सूची" : "📍 View Nearby Centers",
          action: () => handleNavigate("/centers", "Opening centers list..."),
        },
      ],
    };

    setMessages((prev) => [...prev, msg]);
    speakText(queueText.replace(/[*_#•]/g, ""));
  };

  const showMspRates = () => {
    const text =
      lang === "hi"
        ? `🌾 **वर्तमान न्यूनतम समर्थन मूल्य (MSP 2026)**:\n• **धान (Paddy)**: ₹2,300 / क्विंटल\n• **गेहूं (Wheat)**: ₹2,275 / क्विंटल\n• **मक्का (Maize)**: ₹2,090 / क्विंटल\n• **सरसों (Mustard)**: ₹5,650 / क्विंटल\n• **जौ (Barley)**: ₹1,850 / क्विंटल\n\nसभी भुगतान **DBT** के माध्यम से 48-72 घंटों में सीधे बैंक खाते में जमा होते हैं!`
        : lang === "bn"
        ? `🌾 **বর্তমান নূন্যতম সহায়ক মূল্য (MSP 2026)**:\n• **ধান (Paddy)**: ₹২,৩০০ / কুইন্টাল\n• **গম (Wheat)**: ₹২,২৭৫ / কুইন্টাল\n• **ভুট্টা (Maize)**: ₹২,০৯০ / কুইন্টাল\n• **সর্ষে (Mustard)**: ₹৫,৬৫০ / কুইন্টাল\n• **বার্লি (Barley)**: ₹১,৮৫০ / কুইন্টাল\n\nসমস্ত পেমেন্ট **DBT** এর মাধ্যমে ৪৮-৭২ ঘন্টার মধ্যে সরাসরি ব্যাংক অ্যাকাউন্টে দেওয়া হয়!`
        : lang === "pa"
        ? `🌾 **ਮੌਜੂਦਾ ਘੱਟੋ-ਘੱਟ ਸਮਰਥਨ ਮੁੱਲ (MSP 2026)**:\n• **ਝੋਨਾ (Paddy)**: ₹2,300 / ਕੁਇੰਟਲ\n• **ਕਣਕ (Wheat)**: ₹2,275 / ਕੁਇੰਟਲ\n• **ਮੱਕੀ (Maize)**: ₹2,090 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ (Mustard)**: ₹5,650 / ਕੁਇੰਟਲ\n• **ਜੌਂ (Barley)**: ₹1,850 / ਕੁਇੰਟਲ\n\nਸਾਰੀ ਰਕਮ **DBT** ਰਾਹੀਂ 48-72 ਘੰਟਿਆਂ ਵਿੱਚ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੁੰਦੀ ਹੈ!`
        : lang === "or"
        ? `🌾 **ବର୍ତ୍ତମାନର ସର୍ବନିମ୍ନ ସହାୟକ ମୂଲ୍ୟ (MSP 2026)**:\n• **ଧାନ (Paddy)**: ₹୨,୩୦୦ / କ୍ୱିଣ୍ଟାଲ\n• **ଗହମ (Wheat)**: ₹୨,୨୭୫ / କ୍ୱିଣ୍ଟାଲ\n• **ମକା (Maize)**: ₹୨,୦୯୦ / କ୍ୱିଣ୍ଟାଲ\n• **ସୋରିଷ (Mustard)**: ₹୫,୬୫୦ / କ୍ୱିଣ୍ଟାଲ\n• **ଯବ (Barley)**: ₹୧,୮୫୦ / କ୍ୱିଣ୍ଟାଲ\n\nସମସ୍ତ ଦେୟ **DBT** ମାଧ୍ୟମରେ ସିଧାସଳଖ ବ୍ୟାଙ୍କ ଖାତାରେ ଜମା ହୁଏ!`
        : `🌾 **Current MSP Procurement Rates (2026 Season)**:\n• **Paddy (Common)**: ₹2,300 / Quintal\n• **Wheat**: ₹2,275 / Quintal\n• **Maize**: ₹2,090 / Quintal\n• **Mustard**: ₹5,650 / Quintal\n• **Barley**: ₹1,850 / Quintal\n\nAll payments are transferred directly via **DBT** within 48-72 hours!`;

    const l = CHAT_I18N[lang] || CHAT_I18N.en;
    const botMsg: Message = {
      id: "msp-" + Date.now(),
      sender: "bot",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: [
        { label: l.btn_book_slot, action: () => startBookingFlow({}) },
        { label: l.btn_centers, action: () => handleNavigate("/centers", "Opening centers list...") },
      ],
    };
    setMessages((prev) => [...prev, botMsg]);
    speakText(text.replace(/[*_#•]/g, ""));
  };

  const showLiveWeather = async () => {
    const l = CHAT_I18N[lang] || CHAT_I18N.en;

    const loadId = "weather-load-" + Date.now();
    const loadingMsg: Message = {
      id: loadId,
      sender: "bot",
      text:
        lang === "hi"
          ? "🌤️ आपके लाइव स्थान का मौसम और कृषि सलाह खोजी जा रही है..."
          : lang === "bn"
          ? "🌤️ আপনার লাইভ অবস্থানের আবহাওয়া দেখা হচ্ছে..."
          : lang === "pa"
          ? "🌤️ ਤੁਹਾਡੇ ਲਾਈਵ ਸਥਾਨ ਦਾ ਮੌਸਮ ਵੇਖਿਆ ਜਾ ਰਿਹਾ ਹੈ..."
          : lang === "or"
          ? "🌤️ ପାଣିପାଗ ସୂଚନା ଯାଞ୍ଚ ହେଉଛି..."
          : "🌤️ Fetching live weather report for your current location...",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const weatherJson = await weatherRes.json();

        let resolvedArea = "Chandaka";
        let resolvedCity = "Bhubaneswar";
        let resolvedState = "Odisha";

        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const geoJson = await geoRes.json();
          if (geoJson) {
            const adminList = geoJson.localityInfo?.administrative || [];
            resolvedState = geoJson.principalSubdivision || "Odisha";

            const subdistrict =
              adminList.find((a: any) => a.order >= 4 || a.adminLevel >= 6)?.name ||
              geoJson.localityInfo?.informative?.[0]?.name;
            const mainCity = geoJson.city || geoJson.locality || "Bhubaneswar";
            const district = geoJson.principalSubdivisionDistrict || adminList.find((a: any) => a.order === 3)?.name || mainCity;

            if (subdistrict && subdistrict.toLowerCase() !== mainCity.toLowerCase()) {
              resolvedArea = subdistrict;
              resolvedCity = mainCity;
            } else if (district && district.toLowerCase() !== mainCity.toLowerCase()) {
              resolvedArea = district;
              resolvedCity = mainCity;
            } else {
              resolvedArea = geoJson.localityInfo?.informative?.[0]?.name || geoJson.locality || "Local Area";
              resolvedCity = mainCity;
            }

            const POPULAR_METROS = ["Bhubaneswar", "Cuttack", "Kolkata", "Delhi", "New Delhi", "Mumbai", "Pune", "Lucknow", "Kanpur", "Patna", "Ludhiana", "Amritsar", "Jaipur", "Ahmedabad", "Chandigarh", "Bengaluru", "Hyderabad", "Chennai"];
            if (POPULAR_METROS.includes(resolvedArea) && !POPULAR_METROS.includes(resolvedCity)) {
              const temp = resolvedArea;
              resolvedArea = resolvedCity;
              resolvedCity = temp;
            }
          }
        } catch {}

        const current = weatherJson?.current_weather || { temperature: 28, windspeed: 11, weathercode: 0 };
        const temp = Math.round(current.temperature);
        const wind = Math.round(current.windspeed);

        let icon = "☀️";
        let conditionText = "Clear Sky";
        let advisory = "Optimal conditions for crop harvesting, transit, and mandi delivery.";

        if (current.weathercode >= 51 && current.weathercode <= 99) {
          icon = "🌧️";
          conditionText = lang === "hi" ? "बारिश / बूंदाबांदी" : lang === "bn" ? "বৃষ্টিপাত" : lang === "pa" ? "ਮੀਂਹ" : lang === "or" ? "ବର୍ଷା" : "Rain / Drizzle";
          advisory =
            lang === "hi"
              ? `${resolvedCity} मंडी में फसल ले जाते समय तिरपाल से ढकें और कतार टोकन पहले से बुक करें।`
              : lang === "bn"
              ? `${resolvedCity} মান্ডিতে শস্য পরিবহনে ত্রিপল ব্যবহার করুন।`
              : lang === "pa"
              ? `${resolvedCity} ਮੰਡੀ ਜਾਣ ਸਮੇਂ ਫ਼ਸਲ ਨੂੰ ਤਰਪਾਲ ਨਾਲ ਢੱਕੋ।`
              : `Keep tarpaulins ready during ${resolvedCity} mandi transit and pre-book token.`;
        } else if (current.weathercode >= 1 && current.weathercode <= 3) {
          icon = "⛅";
          conditionText = lang === "hi" ? "आंशिक रूप से बादल" : lang === "bn" ? "আংশিক মেঘলা" : lang === "pa" ? "ਬੱਦਲਵਾਈ" : lang === "or" ? "ମେଘୁଆ" : "Partly Cloudy";
        }

        const weatherCardText =
          `🌤️ **Live Weather & Mandi Advisory**\n\n` +
          `• **Location**: 📍 ${resolvedArea}, ${resolvedCity}, ${resolvedState}\n` +
          `• **Temperature**: ${temp}°C ${icon} (${conditionText})\n` +
          `• **Wind Speed**: ${wind} km/h 💨\n\n` +
          `🌾 **Agro Advisory**: ${advisory}`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadId
              ? {
                  ...m,
                  text: weatherCardText,
                  options: [
                    { label: l.btn_book_slot, primary: true, action: () => startBookingFlow({}) },
                    { label: l.btn_msp, action: () => showMspRates() },
                    { label: l.btn_queue, action: () => showQueueProceedings() },
                  ],
                }
              : m
          )
        );

        speakText(
          lang === "hi"
            ? `${resolvedArea}, ${resolvedCity} में तापमान ${temp} डिग्री है। ${advisory}`
            : lang === "bn"
            ? `${resolvedArea}, ${resolvedCity} এলাকায় তাপমাত্রা ${temp} ডিগ্রি সেলসিয়াস।`
            : lang === "pa"
            ? `${resolvedArea}, ${resolvedCity} ਵਿੱਚ ਤਾਪਮਾਨ ${temp} ਡਿਗਰੀ ਹੈ।`
            : `Live weather in ${resolvedArea}, ${resolvedCity} is ${temp} degrees Celsius with ${conditionText}. ${advisory}`
        );
      } catch (err) {
        console.error("Chatbot weather error:", err);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(20.2961, 85.8245),
        { timeout: 8000 }
      );
    } else {
      fetchWeather(20.2961, 85.8245);
    }
  };

  // Sync scheduler URL with currently selected parameters
  const syncSchedulerUrl = (draft: BookingDraft, stepNum: number) => {
    const params = new URLSearchParams();
    if (draft.center) params.set("center", draft.center);
    if (draft.crop) params.set("crop", draft.crop);
    if (draft.weight) params.set("weight", draft.weight.toString());
    if (draft.date) params.set("date", draft.date);
    if (draft.timeSlot) params.set("slot", draft.timeSlot);
    params.set("step", stepNum.toString());

    router.push(`/scheduler?${params.toString()}`);
  };

  // Core Guided Booking Wizard
  const startBookingFlow = (updates: Partial<BookingDraft>) => {
    const current = { ...bookingDraftRef.current, ...updates };
    bookingDraftRef.current = current;
    setBookingDraft(current);

    const l = CHAT_I18N[lang] || CHAT_I18N.en;

    // Step 1: Center
    if (!current.center) {
      syncSchedulerUrl(current, 1);
      const msg: Message = {
        id: "step-center-" + Date.now(),
        sender: "bot",
        text: l.step_1_center,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        options: MOCK_CENTERS.map((c) => ({
          label: `📍 ${c.name} (${c.distance})`,
          action: () => selectCenter(c.name, c.id),
        })),
      };
      setMessages((prev) => [...prev, msg]);
      speakText(l.step_1_center.replace(/[*_#•]/g, ""));
      return;
    }

    // Step 2: Crop
    if (!current.crop) {
      syncSchedulerUrl(current, 2);
      const textCrop = l.step_2_crop.replace("{center}", current.center);
      const msg: Message = {
        id: "step-crop-" + Date.now(),
        sender: "bot",
        text: textCrop,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        options: CROPS.map((crop) => ({
          label: `🌾 ${CROP_LABELS[crop]?.[lang] || crop}`,
          action: () => selectCrop(crop),
        })),
      };
      setMessages((prev) => [...prev, msg]);
      speakText(textCrop.replace(/[*_#•]/g, ""));
      return;
    }

    // Step 3: Weight
    if (!current.weight || current.weight <= 0) {
      syncSchedulerUrl(current, 2);
      const cropDisplay = CROP_LABELS[current.crop]?.[lang] || current.crop;
      const textWeight = l.step_3_weight.replace("{crop}", cropDisplay);
      const msg: Message = {
        id: "step-weight-" + Date.now(),
        sender: "bot",
        text: textWeight,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        options: [
          { label: l.qtl_10, action: () => selectWeight(10) },
          { label: l.qtl_25, action: () => selectWeight(25) },
          { label: l.qtl_35, action: () => selectWeight(35) },
          { label: l.qtl_50, action: () => selectWeight(50) },
        ],
      };
      setMessages((prev) => [...prev, msg]);
      speakText(textWeight.replace(/[*_#•]/g, ""));
      return;
    }

    // Step 4: Date
    if (!current.date) {
      syncSchedulerUrl(current, 3);
      const today = new Date().toISOString().split("T")[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split("T")[0];

      const dayAfterDate = new Date();
      dayAfterDate.setDate(dayAfterDate.getDate() + 2);
      const dayAfter = dayAfterDate.toISOString().split("T")[0];

      const textDate = l.step_4_date.replace("{weight}", current.weight.toString());
      const msg: Message = {
        id: "step-date-" + Date.now(),
        sender: "bot",
        text: textDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        options: [
          { label: `📅 ${l.date_today} (${today})`, action: () => selectDate(today) },
          { label: `📅 ${l.date_tomorrow} (${tomorrow})`, action: () => selectDate(tomorrow) },
          { label: `📅 ${l.date_2days} (${dayAfter})`, action: () => selectDate(dayAfter) },
        ],
      };
      setMessages((prev) => [...prev, msg]);
      speakText(textDate.replace(/[*_#•]/g, ""));
      return;
    }

    // Step 5: Time Slot
    if (!current.timeSlot) {
      syncSchedulerUrl(current, 3);
      const textSlot = l.step_5_slot.replace("{date}", current.date);
      const msg: Message = {
        id: "step-slot-" + Date.now(),
        sender: "bot",
        text: textSlot,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        options: TIME_SLOTS.map((s) => ({
          label: `⏰ ${s.time}`,
          action: () => selectSlot(s.time, s.id),
        })),
      };
      setMessages((prev) => [...prev, msg]);
      speakText(textSlot.replace(/[*_#•]/g, ""));
      return;
    }

    // All details complete -> Show Confirmation Card
    showBookingConfirmation(current);
  };

  const selectCenter = (centerName: string, centreId: string) => {
    startBookingFlow({ center: centerName, centreId });
  };

  const selectCrop = (cropName: string) => {
    startBookingFlow({ crop: cropName });
  };

  const selectWeight = (weightVal: number) => {
    startBookingFlow({ weight: weightVal });
  };

  const selectDate = (dateStr: string) => {
    startBookingFlow({ date: dateStr });
  };

  const selectSlot = (slotStr: string, slotId: string) => {
    const current = { ...bookingDraftRef.current, timeSlot: slotStr, slotId };
    bookingDraftRef.current = current;
    setBookingDraft(current);
    showBookingConfirmation(current);
  };

  const showBookingConfirmation = (draft: BookingDraft) => {
    syncSchedulerUrl(draft, 3);

    const l = CHAT_I18N[lang] || CHAT_I18N.en;
    const cropDisplay = CROP_LABELS[draft.crop]?.[lang] || draft.crop;

    const summaryText = (l.confirm_title || "")
      .replace("{center}", draft.center)
      .replace("{crop}", cropDisplay)
      .replace("{weight}", draft.weight.toString())
      .replace("{kg}", (draft.weight * 100).toLocaleString())
      .replace("{date}", draft.date)
      .replace("{slot}", draft.timeSlot);

    const confirmMsg: Message = {
      id: "summary-" + Date.now(),
      sender: "bot",
      text: summaryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: [
        {
          label: l.btn_confirm_token,
          primary: true,
          action: () => executeBooking(draft),
        },
        {
          label: l.btn_modify,
          action: () => resetBookingDraft(),
        },
      ],
    };

    setMessages((prev) => [...prev, confirmMsg]);
    speakText(summaryText.replace(/[*_#•]/g, ""));
  };

  const resetBookingDraft = () => {
    bookingDraftRef.current = {
      center: "",
      centreId: "",
      crop: "",
      weight: 0,
      date: "",
      timeSlot: "",
      slotId: "",
    };
    setBookingDraft(bookingDraftRef.current);
    startBookingFlow({});
  };

  // Generate Digital Token & Execute Booking in Database
  const executeBooking = async (draft: BookingDraft) => {
    if (isProcessingBooking) return;
    setIsProcessingBooking(true);

    const l = CHAT_I18N[lang] || CHAT_I18N.en;

    const tokenNumber = Math.floor(100 + Math.random() * 900);
    const tokenId = `KS-${Math.floor(100000 + Math.random() * 900000)}`;

    let farmerName = "Ramesh Kumar";
    let farmerPhone = "+91 98765 43210";
    if (typeof window !== "undefined") {
      try {
        const storedProfile = localStorage.getItem("kisanSetu_farmer_profile");
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.name) farmerName = parsed.name;
          if (parsed.phone) farmerPhone = parsed.phone;
        }
      } catch {}
    }

    const payload = {
      tokenId,
      tokenNumber,
      farmerName,
      farmerPhone,
      center: draft.center,
      centreId: draft.centreId || "c-001",
      crop: draft.crop,
      weight: draft.weight,
      date: draft.date,
      timeSlot: draft.timeSlot,
      slotId: draft.slotId || "11111111-aaa1-1111-1111-111111111111",
      status: "CONFIRMED",
    };

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("kisanSetu_latest_booking", JSON.stringify(payload));
      }

      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("API booking push error:", err);
    } finally {
      setIsProcessingBooking(false);
    }

    const successText = (l.booking_success || "").replace("{token}", tokenNumber.toString());

    const ticketCard: Message = {
      id: "ticket-" + Date.now(),
      sender: "bot",
      text: successText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ticket: {
        tokenId,
        tokenNumber,
        center: draft.center,
        crop: draft.crop,
        weight: draft.weight,
        date: draft.date,
        timeSlot: draft.timeSlot,
      },
      options: [
        {
          label: "🎫 View Gate Pass & QR",
          primary: true,
          action: () => handleNavigate(`/pass?token=${tokenNumber}`, "Opening your Official Gate Pass..."),
        },
        {
          label: l.btn_track_queue,
          action: () => handleNavigate(`/queue?token=${tokenNumber}&center=${encodeURIComponent(draft.center)}`, "Opening Live Queue tracker..."),
        },
        {
          label: l.btn_book_another,
          action: () => resetBookingDraft(),
        },
      ],
    };

    setMessages((prev) => [...prev, ticketCard]);
    speakText(successText.replace(/[*_#•]/g, ""));
  };

  const handleSendMessage = (customText?: string) => {
    const userText = customText || input;
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      processUserInput(userText.toLowerCase());
    }, 200);
  };

  const processUserInput = (text: string) => {
    const l = CHAT_I18N[lang] || CHAT_I18N.en;

    // 1. Gate Pass & QR Code Intent
    if (
      text.includes("pass") ||
      text.includes("gate pass") ||
      text.includes("entry pass") ||
      text.includes("qr") ||
      text.includes("qr code") ||
      text.includes("slip") ||
      text.includes("ticket") ||
      text.includes("गेट पास") ||
      text.includes("पास") ||
      text.includes("পাস") ||
      text.includes("গেটপাস") ||
      text.includes("ਪਾਸ") ||
      text.includes("ਗੇਟ ਪਾਸ") ||
      text.includes("ପାସ୍") ||
      text.includes("ଗେଟ୍ ପାସ୍")
    ) {
      showGatePassDetails();
      return;
    }

    // 2. Live Queue & Proceedings Intent
    if (
      text.includes("queue") ||
      text.includes("live queue") ||
      text.includes("tractor") ||
      text.includes("line") ||
      text.includes("wait") ||
      text.includes("waiting") ||
      text.includes("proceeding") ||
      text.includes("status") ||
      text.includes("position") ||
      text.includes("weighbridge") ||
      text.includes("yard") ||
      text.includes("कतार") ||
      text.includes("लाइन") ||
      text.includes("ट्रैक्टर") ||
      text.includes("तुला") ||
      text.includes("कार्यवाही") ||
      text.includes("কাতার") ||
      text.includes("ট্র্যাক্টর") ||
      text.includes("ਲਾਈਨ") ||
      text.includes("ਟਰੈਕਟਰ") ||
      text.includes("ਕਾਰਵਾਈ") ||
      text.includes("ଧାଡ଼ି") ||
      text.includes("ଟ୍ରାକ୍ଟର")
    ) {
      showQueueProceedings();
      return;
    }

    // 3. Navigation Commands
    if (
      text.includes("center") ||
      text.includes("kendra") ||
      text.includes("मंडी") ||
      text.includes("केंद्र") ||
      text.includes("কেন্দ্র") ||
      text.includes("ਕੇਂਦਰ") ||
      text.includes("କେନ୍ଦ୍ର") ||
      text.includes("location") ||
      text.includes("place")
    ) {
      handleNavigate("/centers", lang === "hi" ? "खरीद केंद्रों की सूची पर ले जाया जा रहा है।" : lang === "bn" ? "ক্রয় কেন্দ্রের তালিকায় নিয়ে যাওয়া হচ্ছে।" : lang === "pa" ? "ਖਰੀਦ ਕੇਂਦਰਾਂ ਦੀ ਸੂਚੀ 'ਤੇ ਲਿਜਾਇਆ ਜਾ ਰਿਹਾ ਹੈ।" : "Taking you to the Procurement Centers list.");
      return;
    }

    if (text.includes("home") || text.includes("main page") || text.includes("होम") || text.includes("হোম") || text.includes("ਹੋਮ")) {
      handleNavigate("/", "Returning to home page.");
      return;
    }

    if (
      text.includes("weather") ||
      text.includes("मौसम") ||
      text.includes("आबोहवा") ||
      text.includes("আবহাওয়া") ||
      text.includes("ਮੌਸਮ") ||
      text.includes("ਪਾଣିପାਗ") ||
      text.includes("temperature") ||
      text.includes("तापमान") ||
      text.includes("बारिश") ||
      text.includes("rain") ||
      text.includes("বৃষ্টি") ||
      text.includes("ਮੀਂਹ") ||
      text.includes("ବର୍ଷା") ||
      text.includes("climate")
    ) {
      showLiveWeather();
      return;
    }

    if (
      text.includes("msp") ||
      text.includes("rate") ||
      text.includes("price") ||
      text.includes("कीमत") ||
      text.includes("दाम") ||
      text.includes("भाव") ||
      text.includes("দর") ||
      text.includes("ਮੁੱਲ") ||
      text.includes("ଦର")
    ) {
      showMspRates();
      return;
    }

    // 4. Farmer Profile Intent Handling
    const isProfileIntent =
      text.includes("profile") ||
      text.includes("प्रोफाइल") ||
      text.includes("প্রোফাইল") ||
      text.includes("ਪ੍ਰੋਫਾਈਲ") ||
      text.includes("ପ୍ରୋଫାଇଲ୍") ||
      text.includes("account") ||
      text.includes("details") ||
      text.includes("my account") ||
      text.includes("mera account") ||
      text.includes("update detail");

    if (isProfileIntent) {
      let storedProfile: any = null;
      try {
        const stored = localStorage.getItem("kisanSetu_farmer_profile");
        if (stored) storedProfile = JSON.parse(stored);
      } catch {}

      if (storedProfile?.name) {
        const summary = (l.profile_summary || "")
          .replace("{name}", storedProfile.name)
          .replace("{id}", storedProfile.farmerId || "KS-FARM-8291")
          .replace("{location}", storedProfile.location || "Kalyanpur")
          .replace("{district}", storedProfile.district || "Kanpur Nagar")
          .replace("{area}", (storedProfile.area || 5).toString())
          .replace("{crop}", storedProfile.primaryCrop || "Paddy")
          .replace("{bank}", storedProfile.bankAccount || "SBI ****4920");

        const profileMsg: Message = {
          id: "prof-" + Date.now(),
          sender: "bot",
          text: summary,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          redirectUrl: "/profile",
          redirectLabel: l.btn_open_profile || "🚀 Open Full Profile Dashboard",
          options: [
            {
              label: l.btn_open_profile || "🚀 Open Full Profile Dashboard",
              primary: true,
              action: () => handleNavigate("/profile", "Opening your full-screen farmer profile dashboard..."),
            },
            {
              label: l.btn_gate_pass || "🎫 Gate Pass & QR",
              action: () => showGatePassDetails(),
            },
            {
              label: l.btn_book_slot,
              action: () => startBookingFlow({}),
            },
          ],
        };
        setMessages((prev) => [...prev, profileMsg]);
        speakText(`Farmer profile found for ${storedProfile.name}. You can manage all details on your profile page.`);
        return;
      } else {
        promptLogin();
        return;
      }
    }

    // 5. Farmer Login Request Handling
    const isLoginIntent =
      text.includes("login") ||
      text.includes("लॉगिन") ||
      text.includes("লগইন") ||
      text.includes("ਲੌਗਇਨ") ||
      text.includes("ଲଗଇନ୍") ||
      text.includes("sign in") ||
      text.includes("signin") ||
      text.includes("portal") ||
      text.includes("खाता") ||
      text.includes("otp") ||
      text.includes("ओटीपी") ||
      text.includes("ওটিপি");

    const phoneDigits = text.replace(/\D/g, "");
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/) || (phoneDigits.length === 10 ? [phoneDigits, phoneDigits] : null);

    if (isLoginIntent || isAwaitingLoginPhone) {
      if (phoneMatch && phoneMatch[1]) {
        const mobile = phoneMatch[1];
        setIsAwaitingLoginPhone(false);
        triggerFarmerLogin(mobile, true);

        const loginSuccessText = l.login_otp_sent.replace("{mobile}", mobile);
        const loginSuccessMsg: Message = {
          id: "login-otp-" + Date.now(),
          sender: "bot",
          text: loginSuccessText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          options: [
            { label: l.btn_view_login, action: () => triggerFarmerLogin(mobile, false) },
            { label: l.btn_book_slot, action: () => startBookingFlow({}) },
          ],
        };
        setMessages((prev) => [...prev, loginSuccessMsg]);
        speakText(loginSuccessText.replace(/[*_#•]/g, ""));
        return;
      }

      if (isLoginIntent) {
        promptLogin();
        return;
      }
    }

    // 6. Direct Confirmation trigger
    if (
      (text.includes("yes") ||
        text.includes("confirm") ||
        text.includes("हाँ") ||
        text.includes("হ্যাঁ") ||
        text.includes("ਹਾਂ") ||
        text.includes("ହଁ") ||
        text.includes("बुक करो") ||
        text.includes("generate")) &&
      bookingDraftRef.current.center &&
      bookingDraftRef.current.crop &&
      bookingDraftRef.current.weight &&
      bookingDraftRef.current.date &&
      bookingDraftRef.current.timeSlot
    ) {
      executeBooking(bookingDraftRef.current);
      return;
    }

    // 7. Direct Booking Request / Multilingual Slot Parsing
    let detectedCrop: string | undefined;
    for (const crop of CROPS) {
      if (
        text.includes(crop.toLowerCase()) ||
        (crop === "Paddy" && (text.includes("धान") || text.includes("ধান") || text.includes("ਝੋਨਾ") || text.includes("ଧାନ") || text.includes("rice") || text.includes("dhan"))) ||
        (crop === "Wheat" && (text.includes("गेहूं") || text.includes("গম") || text.includes("ਕਣਕ") || text.includes("ଗହମ") || text.includes("gehu") || text.includes("atta"))) ||
        (crop === "Mustard" && (text.includes("सरसों") || text.includes("সর্ষে") || text.includes("ਸਰ੍ਹੋਂ") || text.includes("ସୋରିଷ") || text.includes("sarson") || text.includes("rai"))) ||
        (crop === "Maize" && (text.includes("मक्का") || text.includes("ভুট্টা") || text.includes("ਮੱਕੀ") || text.includes("ମକା") || text.includes("makka") || text.includes("corn"))) ||
        (crop === "Barley" && (text.includes("जौ") || text.includes("বার্লি") || text.includes("ਜੌਂ") || text.includes("ଯବ") || text.includes("jau")))
      ) {
        detectedCrop = crop;
        break;
      }
    }

    let detectedWeight: number | undefined;
    const weightMatch = text.match(/(\d+)\s*(quintal|qtl|kg|क्विंटल|কুইন্টাল|ਕੁਇੰਟਲ|କ୍ୱିଣ୍ଟାଲ|टन|kilo)?/i);
    if (weightMatch && weightMatch[1]) {
      const parsed = parseInt(weightMatch[1], 10);
      if (parsed > 0 && parsed <= 500) {
        detectedWeight = parsed;
      }
    }

    let detectedCenter: string | undefined;
    let detectedCentreId: string | undefined;
    for (const c of MOCK_CENTERS) {
      const shortName = c.name.toLowerCase().split(" ")[0];
      if (text.includes(shortName) || text.includes(c.name.toLowerCase()) || text.includes(c.location.toLowerCase().split(" ")[0])) {
        detectedCenter = c.name;
        detectedCentreId = c.id;
        break;
      }
    }

    let detectedDate: string | undefined;
    if (text.includes("today") || text.includes("आज") || text.includes("আজ") || text.includes("ਅੱਜ") || text.includes("ଆଜି")) {
      detectedDate = new Date().toISOString().split("T")[0];
    } else if (text.includes("tomorrow") || text.includes("कल") || text.includes("আগামীকাল") || text.includes("ਕੱਲ੍ਹ") || text.includes("ଆସନ୍ତାକାଲି")) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      detectedDate = tom.toISOString().split("T")[0];
    }

    if (detectedCrop || detectedWeight || detectedCenter || detectedDate) {
      startBookingFlow({
        center: detectedCenter,
        centreId: detectedCentreId,
        crop: detectedCrop,
        weight: detectedWeight,
        date: detectedDate,
      });
      return;
    }

    if (
      text.includes("book") ||
      text.includes("slot") ||
      text.includes("booking") ||
      text.includes("बुक") ||
      text.includes("स्लॉट") ||
      text.includes("বুক") ||
      text.includes("ਬੁੱਕ") ||
      text.includes("ବୁକ୍")
    ) {
      startBookingFlow({});
      return;
    }

    // 8. Platform Scope Guard
    const fallbackMsg: Message = {
      id: "fallback-" + Date.now(),
      sender: "bot",
      text: l.fallback_out_of_scope,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: [
        { label: l.btn_book_slot, primary: true, action: () => startBookingFlow({}) },
        { label: l.btn_gate_pass || "🎫 Gate Pass & QR", action: () => showGatePassDetails() },
        { label: l.btn_queue || "⚡ Live Queue Tracker", action: () => showQueueProceedings() },
        { label: "🌤️ Live Weather", action: () => showLiveWeather() },
        { label: l.btn_centers, action: () => handleNavigate("/centers", "Opening centers...") },
        { label: l.btn_msp, action: () => showMspRates() },
      ],
    };

    setMessages((prev) => [...prev, fallbackMsg]);
    speakText(
      lang === "hi"
        ? "मैं केवल किसानसेतु पोर्टल सेवाओं जैसे स्लॉट बुकिंग, गेट पास, लाइव कतार व MSP रेट्स में सहायता कर सकता हूँ।"
        : lang === "bn"
        ? "আমি কেবল কিষাণসেতু পোর্টালের বুকিং, গেট পাস ও লাইভ কাতারের তথ্য দিতে পারি।"
        : lang === "pa"
        ? "ਮੈਂ ਕੇਵਲ ਕਿਸਾਨਸੇਤੂ ਪੋਰਟਲ ਸੇਵਾਵਾਂ ਵਿੱਚ ਸਹਾਇਤਾ ਕਰ ਸਕਦਾ ਹਾਂ।"
        : "I am KisanMitra. I can assist with slot booking, gate pass QR, live queue and MSP rates on KisanSetu."
    );
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center print:hidden">
        <button
          onClick={() => toggleOpenState(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer relative ${
            isOpen
              ? "bg-rose-600 hover:bg-rose-500 text-white rotate-90"
              : "bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white hover:scale-110 animate-bounce shadow-emerald-500/30 ring-4 ring-emerald-500/20"
          }`}
          title={isOpen ? "Close Assistant" : "Open KisanMitra Voice AI"}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="flex items-center justify-center">
              <img src="/icon.svg" alt="KisanSetu Logo" className="w-9 h-9 object-contain rounded-xl drop-shadow-md" />
            </div>
          )}
        </button>
      </div>

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[82vh] bg-slate-950 border-2 border-emerald-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
            isClosing ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center p-1.5 shadow-inner shrink-0">
                <img src="/icon.svg" alt="KisanSetu Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-sm sm:text-base tracking-tight truncate">{loc.title}</h3>
                  <span className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase whitespace-nowrap shrink-0">
                    AI Voice & Booking
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-emerald-400/80 font-bold truncate">KisanSetu Virtual Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* TTS Voice Reply Toggle */}
              <button
                onClick={() => {
                  const next = !voiceReply;
                  setVoiceReply(next);
                  voiceReplyRef.current = next;
                  try {
                    localStorage.setItem("kisansetu_voice_reply", String(next));
                  } catch {}
                  if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  voiceReply
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-900 text-slate-500 border-slate-800"
                }`}
                title={voiceReply ? "Voice Speech Enabled (Click to Mute)" : "Voice Muted (Click to Enable)"}
              >
                {voiceReply ? "🔊" : "🔇"}
              </button>

              <button
                onClick={() => toggleOpenState(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center text-xs transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"} animate-fadeIn`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                    m.sender === "user"
                      ? "bg-emerald-400 text-slate-950 font-bold rounded-tr-none"
                      : "bg-slate-900/90 text-slate-100 border border-slate-800 rounded-tl-none"
                  }`}
                >
                  {renderFormattedText(m.text, m.sender === "user")}

                  {/* Booking Ticket Card */}
                  {m.ticket && (
                    <div className="mt-3 bg-slate-950 border border-emerald-500/30 rounded-2xl p-3 text-left space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] text-emerald-400 font-black uppercase">Official Queue Token</span>
                        <span className="text-base font-black text-emerald-400 font-mono">#{m.ticket.tokenNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p><span className="text-slate-500 font-bold">Center:</span> {m.ticket.center}</p>
                        <p><span className="text-slate-500 font-bold">Crop:</span> {m.ticket.crop} ({m.ticket.weight} Qtl)</p>
                        <p><span className="text-slate-500 font-bold">Date & Slot:</span> {m.ticket.date} • {m.ticket.timeSlot}</p>
                      </div>
                    </div>
                  )}

                  {/* Embedded Navigation Redirect Button */}
                  {m.redirectUrl && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => router.push(m.redirectUrl!)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>{m.redirectLabel || "Open Page"}</span>
                        <span>➔</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Options Pills */}
                {m.options && m.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {m.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => {
                          if (typeof opt.action === "function") {
                            opt.action();
                          }
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm ${
                          opt.primary
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black hover:bg-emerald-400 hover:scale-105 active:scale-95"
                            : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:border-emerald-500/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening Notification Banner */}
          {isListening && (
            <div className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 flex items-center justify-between shrink-0 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
                <span>{loc.listening_banner}</span>
              </div>
              <button
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsListening(false);
                }}
                className="bg-slate-950 text-white text-[10px] px-2.5 py-0.5 rounded-full cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {/* Drawer Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            {/* Microphone Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer shrink-0 ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
              title="Speak in English, Hindi, Bengali, Punjabi or Odia"
            >
              🎙️
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loc.input_placeholder}
              className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black flex items-center justify-center text-sm transition-all cursor-pointer shrink-0"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
}
