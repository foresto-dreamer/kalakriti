import { NextRequest, NextResponse } from "next/server";
import { findBookingByQrToken, getBookingStorageMode, isQrTokenAvailable } from "@/lib/booking-qr";

function getTokenFromRequest(request: NextRequest) {
  const rawToken = request.nextUrl.searchParams.get("token");
  return rawToken?.trim() || null;
}

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);

  // Diagnostic logging: show raw token received for debugging
  console.debug("/api/bookings/validate GET received token:", { token });

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "A booking token is required.",
      },
      { status: 400 }
    );
  }

  const storageMode = getBookingStorageMode();
  console.debug("validate storage", { storageMode, token });

  if (storageMode === "memory") {
    const isAvailable = isQrTokenAvailable(token);

    if (!isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: "QR already used",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking pass is valid and ready for check-in.",
      used: false,
      token,
    });
  }

  try {
    const booking = await findBookingByQrToken(token);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code",
        },
        { status: 404 }
      );
    }

    if (booking.qr_used_at || booking.status === "used" || booking.status === "checked_in") {
      return NextResponse.json(
        {
          success: false,
          error: "QR already used",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking pass is valid and ready for check-in.",
      used: false,
      bookingId: booking.id,
      tokenNumber: booking.token_number,
    });
  } catch (error) {
    console.error("Unexpected QR validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : null;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "A booking token is required.",
      },
      { status: 400 }
    );
  }

  const validationUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}?token=${encodeURIComponent(token)}`;
  const validationRequest = new NextRequest(validationUrl, {
    method: "GET",
    headers: request.headers,
  });

  return GET(validationRequest);
}
