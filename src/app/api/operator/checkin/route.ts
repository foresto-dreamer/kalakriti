import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertOperatorQueueEntry } from "@/lib/operator-queue";
import {
  getGeneratedBookingByToken,
  isQrUsed,
  markQrUsed,
} from "@/lib/local-qr-store";

const checkInSchema = z.object({
  tokenId: z.string().optional(),
  qrToken: z.string().optional(),
  farmerName: z.string().optional(),
});

function normalizeTokenId(tokenId?: string) {
  if (!tokenId) return null;
  const digits = tokenId.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

function extractQrToken(input?: string | null) {
  if (!input) return null;
  const trimmed = input.trim();

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      const t = u.searchParams.get("token");
      if (t) return t.trim();
    }
  } catch {
    // ignore URL parse errors
  }

  const tokenParamMatch = /[?&]token=([^&\s]+)/i.exec(trimmed);
  if (tokenParamMatch && tokenParamMatch[1]) {
    return decodeURIComponent(tokenParamMatch[1]).trim();
  }

  const tokenMatch = /(bk_[A-Za-z0-9_-]+)/i.exec(trimmed);
  if (tokenMatch && tokenMatch[1]) {
    return tokenMatch[1].trim();
  }

  const qIdx = trimmed.indexOf("?token=");
  if (qIdx !== -1) {
    const after = trimmed.slice(qIdx + "?token=".length);
    const amp = after.indexOf("&");
    return decodeURIComponent((amp === -1 ? after : after.slice(0, amp))).trim();
  }

  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = checkInSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid check-in request.",
        },
        { status: 400 }
      );
    }

    const { tokenId, qrToken: rawQrToken, farmerName } = result.data;
    const qrToken = extractQrToken(rawQrToken) || rawQrToken;
    const normalizedToken = normalizeTokenId(tokenId ?? qrToken ?? undefined);

    if ((!normalizedToken && !tokenId && !qrToken) || (!tokenId && !qrToken)) {
      return NextResponse.json(
        {
          success: false,
          error: "Token or QR is required.",
        },
        { status: 400 }
      );
    }

    const tokenToCheck = qrToken ?? (tokenId ? String(normalizedToken ?? "") : null);
    if (!tokenToCheck) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code",
        },
        { status: 404 }
      );
    }

    const booking = await getGeneratedBookingByToken(tokenToCheck);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code",
        },
        { status: 404 }
      );
    }

    if (await isQrUsed(tokenToCheck)) {
      return NextResponse.json(
        {
          success: false,
          error: "QR already used — this pass cannot be used again.",
        },
        { status: 409 }
      );
    }

    const queueEntry = {
      id: crypto.randomUUID(),
      tokenId: tokenToCheck,
      farmerName: typeof booking.farmerName === "string" ? booking.farmerName : farmerName || "Farmer",
      centreName: typeof booking.centreName === "string" ? booking.centreName : "Local centre",
      crop: typeof booking.crop === "string" ? booking.crop : "Paddy",
      weight: Number(typeof booking.weight === "number" ? booking.weight : 30),
      appointmentDate:
        typeof booking.appointmentDate === "string" ? booking.appointmentDate : new Date().toISOString().slice(0, 10),
      appointmentTime:
        typeof booking.appointmentTime === "string" ? booking.appointmentTime : "08:00 AM - 10:00 AM",
      checkedInAt: new Date().toISOString(),
      status: "checked_in",
    };

    upsertOperatorQueueEntry(queueEntry);
    await markQrUsed(tokenToCheck);

    return NextResponse.json({
      success: true,
      message: "Farmer checked in successfully.",
      queueEntry,
    });
  } catch (error) {
    console.error("Operator check-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
