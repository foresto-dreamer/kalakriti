"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import ScheduleBooking from "@/components/ScheduleBooking";

function SchedulerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCenter = searchParams.get("center") || "";
  const preselectedCrop = searchParams.get("crop") || "";
  const preselectedWeight = searchParams.get("weight") ? Number(searchParams.get("weight")) : undefined;
  const preselectedDate = searchParams.get("date") || "";
  const preselectedSlot = searchParams.get("slot") || "";
  const preselectedStep = searchParams.get("step") ? Number(searchParams.get("step")) : undefined;

  const handleBookingSuccess = (bookingDetails: any) => {
    if (bookingDetails?.tokenId) {
      console.info("Booking confirmed", bookingDetails);
    }
  };

  return (
    <ScheduleBooking
      preselectedCenter={preselectedCenter}
      preselectedCrop={preselectedCrop}
      preselectedWeight={preselectedWeight}
      preselectedDate={preselectedDate}
      preselectedSlot={preselectedSlot}
      preselectedStep={preselectedStep}
      onBookingSuccess={handleBookingSuccess}
    />
  );
}

export default function SchedulerPage() {
  return (
    <PageWrapper>
      <div className="pt-20">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-bold">
            Loading booking options...
          </div>
        }>
          <SchedulerContent />
        </Suspense>
      </div>
    </PageWrapper>
  );
}
