import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingQrState = {
  used: boolean;
  usedAt?: string;
  createdAt: string;
};

export type BookingLookupRecord = {
  id: string;
  token_number?: number | null;
  farmer_name?: string | null;
  centre_name?: string | null;
  crop?: string | null;
  weight_qtl?: number | null;
  booking_date?: string | null;
  appointment_time?: string | null;
  qr_code_token?: string | null;
  qr_used_at?: string | null;
  checked_in_at?: string | null;
  status?: string | null;
};

const bookingQrStore = new Map<string, BookingQrState>();

function getBookingQrStore(): Map<string, BookingQrState> {
  return bookingQrStore;
}

export function createBookingTokenId() {
  const randomCode = Math.floor(100000 + Math.random() * 900000);
  return `KS-${randomCode}`;
}

export function createQrCodeToken() {
  return `bk_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function buildQrPayload(token: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  return `${baseUrl.replace(/\/$/, "")}/api/bookings/validate?token=${encodeURIComponent(token)}`;
}

export async function createQrCodeDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: 220,
    errorCorrectionLevel: "M",
  });
}

export function registerBookingQrToken(token: string, extra: Partial<BookingQrState> = {}) {
  const store = getBookingQrStore();
  const existing = store.get(token);
  const state: BookingQrState = {
    used: false,
    createdAt: new Date().toISOString(),
    ...existing,
    ...extra,
  };

  store.set(token, state);
  return token;
}

export function consumeBookingQrToken(token: string) {
  const store = getBookingQrStore();
  const state = store.get(token);

  if (!state || state.used) {
    return false;
  }

  store.set(token, {
    ...state,
    used: true,
    usedAt: new Date().toISOString(),
  });

  return true;
}

export function getBookingStorageMode(): "supabase" | "memory" {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return supabaseConfigured ? "supabase" : "memory";
}

export function getBookingQrState(token: string) {
  const store = getBookingQrStore();
  return store.get(token);
}

export async function findBookingByQrToken(token: string): Promise<BookingLookupRecord | null> {
  if (getBookingStorageMode() === "supabase") {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, token_number, farmer_name, centre_name, crop, weight_qtl, booking_date, appointment_time, qr_code_token, qr_used_at, checked_in_at, status"
        )
        .eq("qr_code_token", token)
        .maybeSingle();

      if (error) {
        console.error("findBookingByQrToken failed:", error);
        throw error;
      }

      return (data as BookingLookupRecord | null) ?? null;
    } catch (error) {
      console.error("Supabase QR lookup failed:", error);
      return null;
    }
  }

  const state = getBookingQrState(token);
  if (!state) return null;

  return {
    id: token,
    token_number: null,
    farmer_name: null,
    centre_name: null,
    crop: null,
    weight_qtl: null,
    booking_date: null,
    appointment_time: null,
    qr_code_token: token,
    qr_used_at: state.used ? state.usedAt ?? null : null,
    checked_in_at: null,
    status: state.used ? "used" : "booked",
  };
}

export async function markBookingQrTokenUsed(token: string): Promise<BookingLookupRecord | null> {
  if (getBookingStorageMode() === "supabase") {
    try {
      const supabase = createAdminClient();
      const checkInTime = new Date().toISOString();
      const { data, error } = await supabase
        .from("bookings")
        .update({
          qr_used_at: checkInTime,
          checked_in_at: checkInTime,
          status: "checked_in",
          confirmation_status: "checked_in",
        })
        .eq("qr_code_token", token)
        .is("qr_used_at", null)
        .select("id, token_number, farmer_name, centre_name, crop, weight_qtl, booking_date, appointment_time, qr_code_token, qr_used_at, checked_in_at, status");

      if (error) {
        console.error("markBookingQrTokenUsed failed:", error);
        throw error;
      }

      return (data && data.length > 0 ? data[0] : null) as BookingLookupRecord | null;
    } catch (error) {
      console.error("Supabase QR consume failed:", error);
      return null;
    }
  }

  return consumeBookingQrToken(token)
    ? {
        id: token,
        token_number: null,
        farmer_name: null,
        centre_name: null,
        crop: null,
        weight_qtl: null,
        booking_date: null,
        appointment_time: null,
        qr_code_token: token,
        qr_used_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString(),
        status: "checked_in",
      }
    : null;
}

export function isQrTokenAvailable(token: string) {
  const state = getBookingQrState(token);
  // Token is available only if it exists and has not been used.
  return Boolean(state && !state.used);
}
