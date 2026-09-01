import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOperatorQueue } from "@/lib/operator-queue";

export async function GET() {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseConfigured) {
    return NextResponse.json({
      success: true,
      queue: getOperatorQueue(),
    });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, token_number, farmer_name, centre_name, crop, weight_qtl, booking_date, appointment_time, checked_in_at, qr_used_at, status"
      )
      .or("status.eq.checked_in,status.eq.used,qr_used_at.not.is.null")
      .order("checked_in_at", { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const queue = (data ?? []).map((entry: any) => ({
      id: entry.id,
      tokenId: `KS-${String(entry.token_number ?? "").padStart(6, "0")}`,
      farmerName: entry.farmer_name ?? "Unknown farmer",
      centreName: entry.centre_name ?? "Unknown centre",
      crop: entry.crop ?? "Unknown crop",
      weight: Number(entry.weight_qtl ?? 0),
      appointmentDate: entry.booking_date ?? "",
      appointmentTime: entry.appointment_time ?? "",
      checkedInAt: entry.checked_in_at ?? entry.qr_used_at ?? new Date().toISOString(),
      status: entry.status ?? "checked_in",
    }));

    return NextResponse.json({ success: true, queue });
  } catch (error) {
    console.error("Queue fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
