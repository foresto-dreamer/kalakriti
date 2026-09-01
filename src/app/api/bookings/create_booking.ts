import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bookingSchema = z.object({
  farmerId: z.string().uuid(),
  centreId: z.string().uuid(),
  slotId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    const { farmerId, centreId, slotId } = result.data;

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("create_booking", {
      p_farmer_id: farmerId,
      p_centre_id: centreId,
      p_slot_id: slotId,
    });

    if (error) {
      console.error("Booking error:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: data,
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