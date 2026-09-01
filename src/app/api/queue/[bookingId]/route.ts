import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { bookingId } = await params;

    const supabase = createAdminClient();

    // Get the requested booking.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        token_number,
        booking_date,
        status,
        centre_id,
        slot_id
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Get the centre's average processing time.
    const { data: centre, error: centreError } = await supabase
      .from("procurement_centres")
      .select("average_processing_minutes")
      .eq("id", booking.centre_id)
      .single();

    if (centreError || !centre) {
      return NextResponse.json(
        {
          success: false,
          error: "Centre not found",
        },
        { status: 404 }
      );
    }

    // Find bookings ahead of this booking.
    const { data: bookingsAhead, error: queueError } = await supabase
      .from("bookings")
      .select("id, token_number, status")
      .eq("centre_id", booking.centre_id)
      .eq("booking_date", booking.booking_date)
      .lt("token_number", booking.token_number)
      .in("status", ["booked", "arrived", "waiting", "processing"])
      .order("token_number", { ascending: true });

    if (queueError) {
      return NextResponse.json(
        {
          success: false,
          error: queueError.message,
        },
        { status: 500 }
      );
    }

    const peopleAhead = bookingsAhead?.length ?? 0;

    // A booking currently being processed should not count
    // as a full person ahead in the same way as waiting bookings.
    const currentlyProcessing = bookingsAhead?.some(
      (item: any) => item.status === "processing"
    );

    const effectivePeopleAhead = currentlyProcessing
      ? Math.max(peopleAhead - 1, 0)
      : peopleAhead;

    const estimatedWaitMinutes =
      effectivePeopleAhead *
      centre.average_processing_minutes;

    const position = peopleAhead + 1;

    return NextResponse.json({
      success: true,

      queue: {
        token: `A${booking.token_number
          .toString()
          .padStart(3, "0")}`,

        tokenNumber: booking.token_number,

        position,

        peopleAhead,

        estimatedWaitMinutes,

        status: booking.status,

        currentlyProcessing: currentlyProcessing ?? false,
      },
    });
  } catch (error) {
    console.error("Queue error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}