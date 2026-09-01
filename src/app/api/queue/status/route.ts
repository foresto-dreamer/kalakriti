import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenStr = searchParams.get("token");
    const centreId = searchParams.get("centreId");
    const date = searchParams.get("date");

    if (!tokenStr || !centreId || !date) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const tokenNumber = parseInt(tokenStr, 10);
    const supabase = await createClient();

    // Find the requested booking by token
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, token_number, booking_date, status, centre_id, assigned_counter")
      .eq("centre_id", centreId)
      .eq("booking_date", date)
      .eq("token_number", tokenNumber)
      .limit(1)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Get the centre's average processing time
    const { data: centre, error: centreError } = await supabase
      .from("procurement_centres")
      .select("average_processing_minutes")
      .eq("id", centreId)
      .single();

    if (centreError || !centre) {
      return NextResponse.json({ success: false, error: "Centre not found" }, { status: 404 });
    }

    // Find bookings ahead
    const { data: bookingsAhead, error: queueError } = await supabase
      .from("bookings")
      .select("id, token_number, status")
      .eq("centre_id", centreId)
      .eq("booking_date", date)
      .lt("token_number", tokenNumber)
      .in("status", ["booked", "arrived", "waiting", "processing"])
      .order("token_number", { ascending: true });

    if (queueError) {
      return NextResponse.json({ success: false, error: queueError.message }, { status: 500 });
    }

    const peopleAhead = bookingsAhead?.length ?? 0;
    const currentlyProcessing = bookingsAhead?.some((item: any) => item.status === "processing");
    const effectivePeopleAhead = currentlyProcessing ? Math.max(peopleAhead - 1, 0) : peopleAhead;
    const estimatedWaitMinutes = effectivePeopleAhead * centre.average_processing_minutes;
    const position = peopleAhead + 1;

    return NextResponse.json({
      success: true,
      queue: {
        token: `A${booking.token_number.toString().padStart(3, "0")}`,
        tokenNumber: booking.token_number,
        position,
        peopleAhead,
        estimatedWaitMinutes,
        status: booking.status,
        currentlyProcessing: currentlyProcessing ?? false,
        assignedCounter: booking.assigned_counter,
      },
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
