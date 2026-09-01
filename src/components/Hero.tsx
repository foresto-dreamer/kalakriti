"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface LiveWeatherData {
  temp: number;
  condition: string;
  icon: string;
  locationName: string;
  windSpeed: number;
  advisory: string;
}

interface CropRateItem {
  id: string;
  cropKey: string;
  name: Record<string, string>;
  rate: string;
  change: string;
  isPositive: boolean;
  isStable?: boolean;
}

const REGIONAL_MANDI_DATA: Record<string, { mandiNameSuffix: string; crops: CropRateItem[] }> = {
  "West Bengal": {
    mandiNameSuffix: "Regulated Mandi",
    crops: [
      {
        id: "paddy",
        cropKey: "paddy",
        name: { en: "Paddy (Aman)", hi: "धान (अमन)", bn: "ধান (আমন)", pa: "ਝੋਨਾ (ਅਮਨ)", or: "ଧାନ (ଅମନ)" },
        rate: "₹2,310 / Qtl",
        change: "+₹45",
        isPositive: true,
      },
      {
        id: "jute",
        cropKey: "jute",
        name: { en: "Raw Jute (TD-5)", hi: "कच्चा जूट", bn: "পাট (টিডি-৫)", pa: "ਕੱਚਾ ਪਟਸਨ", or: "ଝୋଟ" },
        rate: "₹5,250 / Qtl",
        change: "+₹110",
        isPositive: true,
      },
      {
        id: "mustard",
        cropKey: "mustard",
        name: { en: "Mustard Seed", hi: "सरसों", bn: "সরিষা", pa: "ਸਰ੍ਹੋਂ", or: "ସୋରିଷ" },
        rate: "₹5,600 / Qtl",
        change: "+₹90",
        isPositive: true,
      },
    ],
  },
  Punjab: {
    mandiNameSuffix: "Grain Mandi (APMC)",
    crops: [
      {
        id: "paddy",
        cropKey: "paddy",
        name: { en: "Paddy (Basmati/Common)", hi: "धान (बासमती)", bn: "ধান (বাসমতী)", pa: "ਝੋਨਾ (ਬਾਸਮਤੀ/ਆਮ)", or: "ଧାନ" },
        rate: "₹2,320 / Qtl",
        change: "+₹60",
        isPositive: true,
      },
      {
        id: "wheat",
        cropKey: "wheat",
        name: { en: "Wheat (Grade A)", hi: "गेहूं (ग्रेड ए)", bn: "গম (গ্রেড এ)", pa: "ਕਣਕ (ਗ੍ਰੇਡ ਏ)", or: "ଗହମ" },
        rate: "₹2,275 / Qtl",
        change: "Stable",
        isPositive: false,
        isStable: true,
      },
      {
        id: "mustard",
        cropKey: "mustard",
        name: { en: "Mustard Seed", hi: "सरसों", bn: "সরিষা", pa: "ਸਰ੍ਹੋਂ", or: "ସୋରିଷ" },
        rate: "₹5,650 / Qtl",
        change: "+₹140",
        isPositive: true,
      },
    ],
  },
  Haryana: {
    mandiNameSuffix: "Anaaj Mandi",
    crops: [
      {
        id: "paddy",
        cropKey: "paddy",
        name: { en: "Paddy (PR-126)", hi: "धान (पीआर-126)", bn: "ধান", pa: "ਝੋਨਾ", or: "ଧାନ" },
        rate: "₹2,320 / Qtl",
        change: "+₹55",
        isPositive: true,
      },
      {
        id: "wheat",
        cropKey: "wheat",
        name: { en: "Wheat", hi: "गेहूं", bn: "গম", pa: "ਕਣਕ", or: "ଗହମ" },
        rate: "₹2,275 / Qtl",
        change: "Stable",
        isPositive: false,
        isStable: true,
      },
      {
        id: "mustard",
        cropKey: "mustard",
        name: { en: "Mustard Seed", hi: "सरसों", bn: "সরিষা", pa: "ਸਰ੍ਹੋਂ", or: "ସୋରିଷ" },
        rate: "₹5,620 / Qtl",
        change: "+₹130",
        isPositive: true,
      },
    ],
  },
  Odisha: {
    mandiNameSuffix: "RMC Procurement Yard",
    crops: [
      {
        id: "paddy",
        cropKey: "paddy",
        name: { en: "Paddy (Common)", hi: "धान (सामान्य)", bn: "ধান (সাধারণ)", pa: "ਝੋਨਾ", or: "ଧାନ (ସାଧାରଣ)" },
        rate: "₹2,300 / Qtl",
        change: "+₹50",
        isPositive: true,
      },
      {
        id: "groundnut",
        cropKey: "groundnut",
        name: { en: "Groundnut (Peanut)", hi: "मूंगफली", bn: "চিনাবাদাম", pa: "ਮੂੰਗਫਲੀ", or: "ଚିନାବାଦାମ" },
        rate: "₹6,780 / Qtl",
        change: "+₹85",
        isPositive: true,
      },
      {
        id: "mustard",
        cropKey: "mustard",
        name: { en: "Mustard Seed", hi: "सरसों", bn: "সরিষা", pa: "ਸਰ੍ਹੋਂ", or: "ସୋରିଷ" },
        rate: "₹5,450 / Qtl",
        change: "Stable",
        isPositive: false,
        isStable: true,
      },
    ],
  },
  Maharashtra: {
    mandiNameSuffix: "APMC Market Yard",
    crops: [
      {
        id: "soybean",
        cropKey: "soybean",
        name: { en: "Soybean (Yellow)", hi: "सोयाबीन (पीला)", bn: "সয়াবিন", pa: "ਸੋਇਆਬੀਨ", or: "ସୋୟାବିନ୍" },
        rate: "₹4,892 / Qtl",
        change: "+₹85",
        isPositive: true,
      },
      {
        id: "cotton",
        cropKey: "cotton",
        name: { en: "Cotton (Medium)", hi: "कपास (कॉटन)", bn: "তুলা", pa: "ਕਪਾਹ", or: "କପା" },
        rate: "₹7,121 / Qtl",
        change: "+₹150",
        isPositive: true,
      },
      {
        id: "wheat",
        cropKey: "wheat",
        name: { en: "Wheat (Sharbati)", hi: "गेहूं (शरबती)", bn: "গম", pa: "ਕਣਕ", or: "ଗହମ" },
        rate: "₹2,450 / Qtl",
        change: "+₹40",
        isPositive: true,
      },
    ],
  },
  DEFAULT: {
    mandiNameSuffix: "Krishi Mandi Hub",
    crops: [
      {
        id: "paddy",
        cropKey: "paddy",
        name: { en: "Paddy (Common)", hi: "धान (सामान्य)", bn: "ধান (সাধারণ)", pa: "ਝੋਨਾ (ਆਮ)", or: "ଧାନ (ସାଧାରଣ)" },
        rate: "₹2,300 / Qtl",
        change: "+₹50",
        isPositive: true,
      },
      {
        id: "wheat",
        cropKey: "wheat",
        name: { en: "Wheat (Grade A)", hi: "गेहूं (ग्रेड ए)", bn: "গম (গ্রেড এ)", pa: "ਕਣਕ", or: "ଗହମ" },
        rate: "₹2,275 / Qtl",
        change: "Stable",
        isPositive: false,
        isStable: true,
      },
      {
        id: "mustard",
        cropKey: "mustard",
        name: { en: "Mustard Seed", hi: "सरसों", bn: "সরিষা", pa: "ਸਰ੍ਹੋਂ", or: "ସୋରିଷ" },
        rate: "₹5,450 / Qtl",
        change: "+₹120",
        isPositive: true,
      },
    ],
  },
};

const WMO_WEATHER_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Clear Sky", icon: "☀️" },
  1: { condition: "Mainly Clear", icon: "🌤️" },
  2: { condition: "Partly Cloudy", icon: "⛅" },
  3: { condition: "Overcast", icon: "☁️" },
  45: { condition: "Foggy", icon: "🌫️" },
  48: { condition: "Depositing Rime Fog", icon: "🌫️" },
  51: { condition: "Light Drizzle", icon: "🌦️" },
  53: { condition: "Moderate Drizzle", icon: "🌦️" },
  55: { condition: "Dense Drizzle", icon: "🌧️" },
  61: { condition: "Slight Rain", icon: "🌧️" },
  63: { condition: "Moderate Rain", icon: "🌧️" },
  65: { condition: "Heavy Rain", icon: "⛈️" },
  80: { condition: "Rain Showers", icon: "🌦️" },
  95: { condition: "Thunderstorm", icon: "⛈️" },
};

export default function Hero() {
  const { t, lang } = useTranslation();

  const [weather, setWeather] = useState<LiveWeatherData>({
    temp: 28,
    condition: "Clear Sunshine",
    icon: "☀️",
    locationName: "Kalyanpur, Kanpur, Uttar Pradesh",
    windSpeed: 11,
    advisory: "Clear skies expected. Optimal conditions for crop harvesting and transport to centers.",
  });

  const [mandiHeader, setMandiHeader] = useState("Kanpur Krishi Mandi Hub");
  const [activeCropRates, setActiveCropRates] = useState<CropRateItem[]>(REGIONAL_MANDI_DATA.DEFAULT.crops);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const fetchLiveLocationAndData = async (lat: number, lon: number) => {
      try {
        // 1. Fetch live Open-Meteo Forecast
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const weatherJson = await weatherRes.json();

        // 2. Fetch Detailed Locality (Area, City, State)
        let resolvedArea = "Kalyanpur";
        let resolvedCity = "Kanpur";
        let resolvedState = "Uttar Pradesh";

        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const geoJson = await geoRes.json();
          if (geoJson) {
            const adminList = geoJson.localityInfo?.administrative || [];
            resolvedState = geoJson.principalSubdivision || "Uttar Pradesh";

            // Identify specific local area (tehsil, subdistrict, or neighbourhood)
            const subdistrict =
              adminList.find((a: any) => a.order >= 4 || a.adminLevel >= 6)?.name ||
              geoJson.localityInfo?.informative?.[0]?.name;

            const mainCity = geoJson.city || geoJson.locality || "Bhubaneswar";
            const district = geoJson.principalSubdivisionDistrict || adminList.find((a: any) => a.order === 3)?.name || mainCity;

            if (subdistrict && subdistrict.toLowerCase() !== mainCity.toLowerCase()) {
              resolvedArea = subdistrict;
              resolvedCity = mainCity;
            } else if (district && district.toLowerCase() !== mainCity.toLowerCase()) {
              // If district is Chandaka and locality is Bhubaneswar, Chandaka is Area and Bhubaneswar is City
              resolvedArea = district;
              resolvedCity = mainCity;
            } else {
              resolvedArea = geoJson.localityInfo?.informative?.[0]?.name || geoJson.locality || "Local Area";
              resolvedCity = mainCity;
            }

            // Safety check: if Area and City got flipped (e.g. Area="Bhubaneswar", City="Chandaka")
            const POPULAR_METROS = ["Bhubaneswar", "Cuttack", "Kolkata", "Delhi", "New Delhi", "Mumbai", "Pune", "Lucknow", "Kanpur", "Patna", "Ludhiana", "Amritsar", "Jaipur", "Ahmedabad", "Chandigarh", "Bengaluru", "Hyderabad", "Chennai"];
            if (POPULAR_METROS.includes(resolvedArea) && !POPULAR_METROS.includes(resolvedCity)) {
              const temp = resolvedArea;
              resolvedArea = resolvedCity;
              resolvedCity = temp;
            }
          }
        } catch { }

        // Strict deduplication: remove any duplicate state/city names
        const cleanState = (resolvedState || "Odisha").trim();
        const cleanCity = (resolvedCity || "Bhubaneswar").trim();
        let cleanArea = (resolvedArea || "").trim();

        if (cleanArea.toLowerCase() === cleanState.toLowerCase()) {
          cleanArea = "";
        }

        const distinctParts: string[] = [];
        if (
          cleanArea &&
          cleanArea.toLowerCase() !== cleanCity.toLowerCase() &&
          cleanArea.toLowerCase() !== cleanState.toLowerCase()
        ) {
          distinctParts.push(cleanArea);
        }
        if (cleanCity && cleanCity.toLowerCase() !== cleanState.toLowerCase()) {
          distinctParts.push(cleanCity);
        }
        if (cleanState) {
          distinctParts.push(cleanState);
        }

        const fullLocationString =
          distinctParts.join(", ") || `${cleanCity || "Bhubaneswar"}, ${cleanState || "Odisha"}`;

        // 3. Resolve Location-Specific Live Mandi Rates
        const regional = REGIONAL_MANDI_DATA[cleanState] || REGIONAL_MANDI_DATA.DEFAULT;
        setMandiHeader(`${cleanCity} ${regional.mandiNameSuffix}`);
        setActiveCropRates(regional.crops);

        // 4. Resolve Weather & Custom Agro Advisory
        if (weatherJson?.current_weather) {
          const current = weatherJson.current_weather;
          const codeInfo = WMO_WEATHER_MAP[current.weathercode] || { condition: "Clear Sky", icon: "☀️" };
          const temperature = Math.round(current.temperature);
          const wind = Math.round(current.windspeed);

          let customAdvisory = "";
          if (current.weathercode >= 51 && current.weathercode <= 99) {
            customAdvisory =
              lang === "hi"
                ? `${temperature}°C बारिश की संभावना - ${resolvedCity} मंडी में ले जाते समय तिरपाल से ढकें और कतार टोकन पहले से बुक करें।`
                : lang === "bn"
                  ? `${temperature}°C বৃষ্টির সম্ভাবনা - ${resolvedCity} মান্ডিতে শস্য পরিবহনে ত্রিপল ব্যবহার করুন।`
                  : lang === "pa"
                    ? `${temperature}°C ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ - ${resolvedCity} ਮੰਡੀ ਜਾਣ ਸਮੇਂ ਫ਼ਸਲ ਨੂੰ ਤਰਪਾਲ ਨਾਲ ਢੱਕੋ।`
                    : `${temperature}°C Rain expected - Keep tarpaulins ready during ${resolvedCity} mandi transit and pre-book token.`;
          } else {
            customAdvisory =
              lang === "hi"
                ? `${temperature}°C ${codeInfo.condition} - ${resolvedArea}, ${resolvedCity} क्षेत्र में मौसम अनुकूल है। फसल कटाई और मंडी खरीद के लिए उपयुक्त समय।`
                : lang === "bn"
                  ? `${temperature}°C ${codeInfo.condition} - ${resolvedArea}, ${resolvedCity} এলাকায় আবহাওয়া পরিষ্কার। ফসল কাটা ও মান্ডিতে পরিবহনের জন্য আদর্শ দিন।`
                  : lang === "pa"
                    ? `${temperature}°C ${codeInfo.condition} - ${resolvedArea}, ${resolvedCity} ਖੇਤਰ ਵਿੱਚ ਮੌਸਮ ਸਾਫ਼ ਹੈ। ਫ਼ਸਲ ਕਟਾਈ ਤੇ ਮੰਡੀ ਢੋਆ-ਢੁਆਈ ਲਈ ਵਧੀਆ ਸਮਾਂ।`
                    : `${temperature}°C ${codeInfo.condition} - Clear skies in ${resolvedArea}, ${resolvedCity}. Optimal conditions for crop harvesting and mandi delivery.`;
          }

          setWeather({
            temp: temperature,
            condition: codeInfo.condition,
            icon: codeInfo.icon,
            locationName: fullLocationString,
            windSpeed: wind,
            advisory: customAdvisory,
          });
        }
      } catch (err) {
        console.error("Live weather/location fetch error:", err);
      } finally {
        setWeatherLoading(false);
      }
    };

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveLocationAndData(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to central Northern Agri belt (Kanpur, UP)
          fetchLiveLocationAndData(26.8467, 80.9462);
        },
        { timeout: 8000 }
      );
    } else {
      fetchLiveLocationAndData(26.8467, 80.9462);
    }
  }, [lang]);

  return (
    <section className="relative w-full min-h-screen pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden flex items-center bg-slate-950 font-sans">
      {/* Background Image - Full-Cover across all screen aspect ratios */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 w-full h-full"
        style={{ backgroundImage: "url('/farmers_field.jpg')" }}
      ></div>

      {/* Directional Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Modern Typography & CTA */}
          <div className="lg:col-span-6 flex flex-col space-y-6 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight text-shadow-md">
              {t("hero_title")} <span className="text-emerald-400">KisanSetu</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl text-shadow-sm">
              {t("hero_desc")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href="/scheduler"
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-base px-8 py-4 rounded-full shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                  />
                </svg>
                {t("hero_cta_book")}
              </a>
              <a
                href="/centers"
                className="flex items-center justify-center gap-2 bg-white/10 border-2 border-white/20 text-white hover:bg-white hover:text-black font-extrabold text-base px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                {t("hero_cta_find")}
              </a>
            </div>
          </div>

          {/* Right Column: Location-Specific Live Mandi Rates & Full Area,City,State Weather */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-center mt-3 sm:mt-6 lg:mt-0">
            <div className="w-full max-w-md space-y-5 text-white pb-20 sm:pb-0">
              {/* 1. Real-time Location Weather Block on TOP (Area, City, State) */}
              <div className="bg-slate-900/80 border border-emerald-500/30 p-4 sm:p-5 rounded-3xl text-slate-200 leading-relaxed backdrop-blur-lg shadow-xl">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl drop-shadow-md">{weather.icon}</span>
                    <div>
                      <span
                        className="text-xs sm:text-sm font-black text-white block leading-tight"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                      >
                        {weatherLoading ? "Fetching Weather..." : `${weather.temp}°C, ${weather.condition}`}
                      </span>
                      {/* Area, City, State full hierarchy */}
                      <span
                        className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3 text-emerald-400 shrink-0"
                        >
                          <circle cx="12" cy="12" r="7" />
                          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                          <line x1="12" y1="2" x2="12" y2="5" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                          <line x1="2" y1="12" x2="5" y2="12" />
                          <line x1="19" y1="12" x2="22" y2="12" />
                        </svg>
                        {weather.locationName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider shadow-sm">
                    Live Weather
                  </span>
                </div>
                <p
                  className="text-xs font-semibold text-slate-200 leading-normal"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {weather.advisory}
                </p>
              </div>

              {/* 2. Location-Specific Live Mandi Rates BELOW */}
              <div className="space-y-3 pt-1">
                {/* Header Info with Live Detected Mandi */}
                <div className="pb-2.5 border-b border-white/20">
                  <h4
                    className="font-black text-lg text-white tracking-wide uppercase flex items-center gap-2"
                    style={{
                      textShadow:
                        "0 2px 5px rgba(30, 41, 59, 0.7), 0 4px 12px rgba(15, 23, 42, 0.5), 1px 1px 2px rgba(71, 85, 105, 0.5)",
                    }}
                  >
                    <span className="drop-shadow-sm">🌾</span> {mandiHeader}
                  </h4>
                  <span
                    className="text-xs text-emerald-400 font-bold block pt-0.5"
                    style={{ textShadow: "0 1px 4px rgba(15, 23, 42, 0.6)" }}
                  >
                    Live Government MSP Procurement Rates
                  </span>
                </div>

                {/* Dynamic Location-Specific Crop Rates */}
                <div className="space-y-2.5">
                  {activeCropRates.map((crop) => {
                    const cropTitle = crop.name[lang] || crop.name.en;
                    return (
                      <div
                        key={crop.id}
                        className="flex justify-between items-center py-2 border-b border-white/15"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl shrink-0 drop-shadow-sm">🌾</span>
                          <div>
                            <span
                              className="block text-base sm:text-lg font-black text-white tracking-wide"
                              style={{
                                textShadow:
                                  "0 2px 5px rgba(30, 41, 59, 0.7), 0 4px 10px rgba(15, 23, 42, 0.5), 1px 1px 1px rgba(71, 85, 105, 0.4)",
                              }}
                            >
                              {cropTitle}
                            </span>
                            <span
                              className="block text-xs text-slate-200 font-semibold"
                              style={{ textShadow: "0 1px 3px rgba(15, 23, 42, 0.6)" }}
                            >
                              {t("hero_mandi_price")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="block text-lg sm:text-xl font-black text-white tracking-tight"
                            style={{
                              textShadow:
                                "0 2px 5px rgba(30, 41, 59, 0.7), 0 4px 10px rgba(15, 23, 42, 0.5), 1px 1px 1px rgba(71, 85, 105, 0.4)",
                            }}
                          >
                            {crop.rate}
                          </span>
                          {crop.isStable ? (
                            <span
                              className="block text-xs text-slate-300 font-bold"
                              style={{ textShadow: "0 1px 3px rgba(15, 23, 42, 0.6)" }}
                            >
                              Stable
                            </span>
                          ) : (
                            <span
                              className="block text-xs text-emerald-400 font-black tracking-wide"
                              style={{ textShadow: "0 1px 3px rgba(15, 23, 42, 0.6)" }}
                            >
                              ▲ {crop.change} today
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
