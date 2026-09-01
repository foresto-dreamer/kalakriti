import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildQrPayload,
  createBookingTokenId,
  createQrCodeDataUrl,
  createQrCodeToken,
} from "@/lib/booking-qr";
import { registerGeneratedQrToken } from "@/lib/local-qr-store";

const bookingSchema = z
  .object({
    farmerName: z.string().min(1).optional(),
    centreName: z.string().min(1).optional(),
    crop: z.string().min(1).optional(),
    weight: z.coerce.number().positive().optional(),
    appointmentDate: z.string().min(1).optional(),
    bookingDate: z.string().min(1).optional(),
    appointmentTime: z.string().min(1).optional(),
    timeSlot: z.string().min(1).optional(),
    tokenId: z.string().min(1).optional(),
    farmerId: z.string().uuid().optional(),
    centreId: z.string().uuid().optional(),
    slotId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      Boolean(value.farmerId && value.centreId && value.slotId) ||
      Boolean(
        value.farmerName &&
          value.centreName &&
          value.crop &&
          value.appointmentDate &&
          value.appointmentTime
      ),
    {
      message: "Booking must include either legacy appointment IDs or the new booking details.",
      path: ["farmerName"],
    }
  );

const fallbackBooking = {
  id: crypto.randomUUID(),
  tokenId: createBookingTokenId(),
  tokenNumber: 0,
  status: "booked",
  confirmationStatus: "confirmed",
  farmerName: "Ramesh Kumar",
  centreName: "GreenValley Agriculture Hub",
  crop: "Paddy",
  weight: 30,
  appointmentDate: new Date().toISOString().slice(0, 10),
  appointmentTime: "08:00 AM - 10:00 AM",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = bookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const value = result.data;
    const bookingDate = value.appointmentDate ?? value.bookingDate ?? fallbackBooking.appointmentDate;
    const bookingTime = value.appointmentTime ?? value.timeSlot ?? fallbackBooking.appointmentTime;
    const bookingTokenId = value.tokenId ?? createBookingTokenId();
    const bookingToken = createQrCodeToken();
    const qrPayload = buildQrPayload(bookingToken);
    const qrCode = await createQrCodeDataUrl(qrPayload);

    const bookingRecord = {
      id: crypto.randomUUID(),
      tokenId: bookingTokenId,
      tokenNumber: Number(String(bookingTokenId).replace(/\D/g, "")) || 0,
      status: "booked",
      confirmationStatus: "confirmed",
      farmerName: value.farmerName ?? fallbackBooking.farmerName,
      centreName: value.centreName ?? fallbackBooking.centreName,
      crop: value.crop ?? fallbackBooking.crop,
      weight: value.weight ?? fallbackBooking.weight,
      appointmentDate: bookingDate,
      appointmentTime: bookingTime,
      qrCode,
      qrToken: bookingToken,
      qrPayload,
    };

    await registerGeneratedQrToken(bookingToken, bookingRecord);

    return NextResponse.json(
      {
        success: true,
        booking: bookingRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected booking error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}