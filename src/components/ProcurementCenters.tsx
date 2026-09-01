"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export interface Center {
  id: string;
  name: string;
  location: string;
  distance: string;
  crops: string[];
  capacity: number; // percentage
  waitTime: string;
  status: "available" | "busy" | "full";
  phone: string;
}

export const MOCK_CENTERS: Center[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "GreenValley Agriculture Hub",
    location: "Kalyanpur Market Link Rd, Block A",
    distance: "1.2 km",
    crops: ["Paddy", "Wheat", "Maize"],
    capacity: 42,
    waitTime: "15 mins wait",
    status: "available",
    phone: "+91 98765 43210",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Kalyanpur Krishi Mandi",
    location: "Mandi Bypass Chowk, Sector 4",
    distance: "3.8 km",
    crops: ["Paddy", "Maize", "Mustard"],
    capacity: 78,
    waitTime: "45 mins wait",
    status: "busy",
    phone: "+91 98765 43211",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Jai Kisan Sangrah Kendra",
    location: "National Highway 2, Near Toll Plaza",
    distance: "5.5 km",
    crops: ["Wheat", "Mustard", "Barley"],
    capacity: 94,
    waitTime: "90 mins wait",
    status: "full",
    phone: "+91 98765 43212",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Setu Sahakari Samiti Kendra",
    location: "Rampur Village Panchayat Office",
    distance: "7.1 km",
    crops: ["Paddy", "Wheat", "Barley"],
    capacity: 18,
    waitTime: "5 mins wait",
    status: "available",
    phone: "+91 98765 43213",
  },
];

const REGIONAL_CENTERS_DB: Record<string, Center[]> = {
  Odisha: [
    {
      id: "od-1",
      name: "Chandaka RMC Procurement Yard",
      location: "Chandaka Main Market Link Rd, Block 2, Khordha",
      distance: "1.8 km",
      crops: ["Paddy", "Mustard", "Maize"],
      capacity: 38,
      waitTime: "15 mins wait",
      status: "available",
      phone: "+91 94370 12345",
    },
    {
      id: "od-2",
      name: "Bhubaneswar Central APMC Mandi",
      location: "Rasulgarh - Cuttack Highway Bypass, Bhubaneswar",
      distance: "5.4 km",
      crops: ["Paddy", "Wheat", "Maize"],
      capacity: 65,
      waitTime: "35 mins wait",
      status: "available",
      phone: "+91 94370 54321",
    },
    {
      id: "od-3",
      name: "Khordha Regional Krishi Sangrah Kendra",
      location: "Old NH-16 Agro Hub, Khordha Town",
      distance: "12.6 km",
      crops: ["Paddy", "Mustard", "Barley"],
      capacity: 88,
      waitTime: "60 mins wait",
      status: "busy",
      phone: "+91 94370 98765",
    },
    {
      id: "od-4",
      name: "Jatni Kisan Sahakari Depot",
      location: "Near Jatni Railway Goods Shed, Khordha",
      distance: "16.2 km",
      crops: ["Paddy", "Maize"],
      capacity: 22,
      waitTime: "10 mins wait",
      status: "available",
      phone: "+91 94370 67890",
    },
  ],
  "Uttar Pradesh": [
    {
      id: "up-1",
      name: "GreenValley Agriculture Hub",
      location: "Kalyanpur Market Link Rd, Block A, Kanpur",
      distance: "1.2 km",
      crops: ["Paddy", "Wheat", "Maize"],
      capacity: 42,
      waitTime: "15 mins wait",
      status: "available",
      phone: "+91 98765 43210",
    },
    {
      id: "up-2",
      name: "Kalyanpur Krishi Mandi",
      location: "Mandi Bypass Chowk, Sector 4, Kanpur",
      distance: "3.8 km",
      crops: ["Paddy", "Maize", "Mustard"],
      capacity: 78,
      waitTime: "45 mins wait",
      status: "busy",
      phone: "+91 98765 43211",
    },
    {
      id: "up-3",
      name: "Jai Kisan Sangrah Kendra",
      location: "National Highway 2, Near Toll Plaza, Kanpur",
      distance: "5.5 km",
      crops: ["Wheat", "Mustard", "Barley"],
      capacity: 94,
      waitTime: "90 mins wait",
      status: "full",
      phone: "+91 98765 43212",
    },
    {
      id: "up-4",
      name: "Setu Sahakari Samiti Kendra",
      location: "Rampur Village Panchayat Office, Kanpur Dehat",
      distance: "7.1 km",
      crops: ["Paddy", "Wheat", "Barley"],
      capacity: 18,
      waitTime: "5 mins wait",
      status: "available",
      phone: "+91 98765 43213",
    },
  ],
  Punjab: [
    {
      id: "pb-1",
      name: "Khanna Grain Market Main Yard",
      location: "Grand Trunk Rd, Khanna, Ludhiana",
      distance: "2.1 km",
      crops: ["Wheat", "Paddy", "Mustard"],
      capacity: 45,
      waitTime: "20 mins wait",
      status: "available",
      phone: "+91 98140 12345",
    },
    {
      id: "pb-2",
      name: "Ludhiana Central APMC Grain Terminal",
      location: "Gill Road Mandi Complex, Ludhiana",
      distance: "6.5 km",
      crops: ["Wheat", "Paddy", "Maize"],
      capacity: 82,
      waitTime: "50 mins wait",
      status: "busy",
      phone: "+91 98140 54321",
    },
    {
      id: "pb-3",
      name: "Samrala Kisan Procurement Center",
      location: "Samrala Bypass, Ludhiana District",
      distance: "11.8 km",
      crops: ["Wheat", "Barley", "Mustard"],
      capacity: 30,
      waitTime: "15 mins wait",
      status: "available",
      phone: "+91 98140 98765",
    },
  ],
  "West Bengal": [
    {
      id: "wb-1",
      name: "Singur RMC Krishi Mandi",
      location: "Singur Station Road, Hooghly",
      distance: "2.3 km",
      crops: ["Paddy", "Mustard", "Maize"],
      capacity: 40,
      waitTime: "15 mins wait",
      status: "available",
      phone: "+91 98300 12345",
    },
    {
      id: "wb-2",
      name: "Hooghly District Central Procurement Depot",
      location: "Chinsurah Bypass Link Road, Hooghly",
      distance: "7.8 km",
      crops: ["Paddy", "Mustard", "Wheat"],
      capacity: 70,
      waitTime: "40 mins wait",
      status: "busy",
      phone: "+91 98300 54321",
    },
  ],
};

interface ProcurementCentersProps {
  onSelectCenter: (centerName: string) => void;
}

export default function ProcurementCenters({ onSelectCenter }: ProcurementCentersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [displayLocation, setDisplayLocation] = useState("Bhubaneswar, Odisha");
  const [centers, setCenters] = useState<Center[]>(REGIONAL_CENTERS_DB.Odisha);
  const [isLocating, setIsLocating] = useState(false);
  const { t, lang } = useTranslation();

  const resolveCentersForLocation = (state: string, city: string, area?: string) => {
    setDisplayLocation(`${city}, ${state}`);
    if (REGIONAL_CENTERS_DB[state]) {
      setCenters(REGIONAL_CENTERS_DB[state]);
    } else {
      // Create dynamically tailored centers for the detected area
      const dynamicList: Center[] = [
        {
          id: `dyn-1`,
          name: `${area || city} Primary APMC Yard`,
          location: `${area || city} Main Mandi Link Road, ${state}`,
          distance: "2.1 km",
          crops: ["Paddy", "Wheat", "Maize", "Mustard"],
          capacity: 45,
          waitTime: "15 mins wait",
          status: "available",
          phone: "+91 98765 00001",
        },
        {
          id: `dyn-2`,
          name: `${city} Central Grain Procurement Hub`,
          location: `${city} Highway Bypass Depot, ${state}`,
          distance: "5.8 km",
          crops: ["Paddy", "Wheat", "Barley"],
          capacity: 72,
          waitTime: "40 mins wait",
          status: "busy",
          phone: "+91 98765 00002",
        },
        {
          id: `dyn-3`,
          name: `${city} Kisan Sahakari Samiti`,
          location: `Station Link Road, ${city}`,
          distance: "9.4 km",
          crops: ["Wheat", "Mustard", "Maize"],
          capacity: 25,
          waitTime: "10 mins wait",
          status: "available",
          phone: "+91 98765 00003",
        },
      ];
      setCenters(dynamicList);
    }
  };

  const detectDeviceLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const geoJson = await res.json();
          if (geoJson) {
            const adminList = geoJson.localityInfo?.administrative || [];
            const state = geoJson.principalSubdivision || "Odisha";
            const subdistrict =
              adminList.find((a: any) => a.order >= 4 || a.adminLevel >= 6)?.name ||
              geoJson.localityInfo?.informative?.[0]?.name;
            const mainCity = geoJson.city || geoJson.locality || "Bhubaneswar";
            const district = geoJson.principalSubdivisionDistrict || adminList.find((a: any) => a.order === 3)?.name || mainCity;

            let area = subdistrict && subdistrict.toLowerCase() !== mainCity.toLowerCase() ? subdistrict : district;
            let city = mainCity;

            const POPULAR_METROS = [
              "Bhubaneswar",
              "Cuttack",
              "Kolkata",
              "Delhi",
              "New Delhi",
              "Mumbai",
              "Pune",
              "Lucknow",
              "Kanpur",
              "Patna",
              "Ludhiana",
              "Amritsar",
              "Jaipur",
              "Ahmedabad",
              "Chandigarh",
              "Bengaluru",
              "Hyderabad",
              "Chennai",
            ];
            if (POPULAR_METROS.includes(area) && !POPULAR_METROS.includes(city)) {
              const temp = area;
              area = city;
              city = temp;
            }

            resolveCentersForLocation(state, city, area);
          }
        } catch (err) {
          console.error("Location resolution error:", err);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    // 1. Check if user configured a location in Quick Settings
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kisanSetu_active_location");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state && parsed.city) {
            resolveCentersForLocation(parsed.state, parsed.city, parsed.area);
            return;
          }
        } catch {}
      }
    }

    // 2. Otherwise auto-detect device location
    detectDeviceLocation();

    // 3. Listen to realtime location change from Quick Settings
    const handleLocationChange = (e: any) => {
      const loc = e.detail;
      if (loc?.state && loc?.city) {
        resolveCentersForLocation(loc.state, loc.city, loc.area);
      }
    };

    window.addEventListener("kisanSetu_location_changed", handleLocationChange);
    return () => window.removeEventListener("kisanSetu_location_changed", handleLocationChange);
  }, []);

  const filteredCenters = centers.filter((center) => {
    const matchesSearch =
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = selectedCrop === "All" || center.crops.includes(selectedCrop);
    return matchesSearch && matchesCrop;
  });

  return (
    <section id="centers" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t("centers_title")}
          </h2>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto my-4 rounded-full"></div>
          <p className="text-lg text-slate-600">
            {t("centers_desc")}
          </p>

          {/* Location Bar with Direct Refresh & Fetch */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-emerald-400 shrink-0"
              >
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                {displayLocation}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

            <button
              onClick={detectDeviceLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Detect live GPS location"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`}
              >
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
              <span>{isLocating ? "Locating..." : "Detect Live Location"}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-emerald-50/50 rounded-3xl p-6 sm:p-8 mb-10 border border-emerald-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full md:w-1/2">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder={t("centers_search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 text-sm shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <span className="text-slate-500 font-semibold text-sm whitespace-nowrap mr-2">{t("centers_filter")}</span>
            {["All", "Paddy", "Wheat", "Maize", "Mustard", "Barley"].map((crop) => {
              const filterAllLabels: Record<string, string> = {
                en: "All",
                hi: "सभी",
                or: "ସମସ୍ତ",
                pa: "ਸਾਰੇ",
                bn: "সব",
              };
              const label = crop === "All" ? filterAllLabels[lang] || "All" : t(`crop_${crop}`);

              return (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    selectedCrop === crop
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Grid */}
        {filteredCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCenters.map((center) => {
              const localizedName = center.name;
              const localizedLoc = center.location;

              const formatWaitTime = (rawWait: string) => {
                const minutes = rawWait.replace(/\D/g, "");
                return `${minutes} ${t("unit_mins_wait") || "mins wait"}`;
              };

              return (
                <div
                  key={center.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Stats */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {localizedName}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4 text-emerald-500 shrink-0"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z"
                            />
                          </svg>
                          {localizedLoc}
                        </p>
                      </div>

                      <span className="shrink-0 inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {center.distance} {t("centers_distance")}
                      </span>
                    </div>

                    {/* Accepted Crops tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {center.crops.map((crop) => (
                        <span
                          key={crop}
                          className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
                        >
                          🌾 {t(`crop_${crop}`)}
                        </span>
                      ))}
                    </div>

                    {/* Capacity Bar */}
                    <div className="mb-6 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">{t("centers_space")}</span>
                        <span
                          className={`font-bold ${
                            center.status === "available"
                              ? "text-emerald-600"
                              : center.status === "busy"
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        >
                          {center.capacity}%{" "}
                          {center.status === "available"
                            ? t("centers_available")
                            : center.status === "busy"
                            ? t("centers_busy")
                            : t("centers_full")}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            center.status === "available"
                              ? "bg-emerald-500"
                              : center.status === "busy"
                              ? "bg-amber-400"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${center.capacity}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100 justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      {formatWaitTime(center.waitTime)}
                    </div>

                    <button
                      onClick={() => onSelectCenter(localizedName)}
                      className="w-full sm:w-auto bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 group-hover:bg-slate-950 group-hover:hover:bg-emerald-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      {t("centers_select")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-slate-400 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <h3 className="text-lg font-bold text-slate-800">{t("centers_no_found")}</h3>
            <p className="text-sm text-slate-500 mt-1">{t("centers_no_desc")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
