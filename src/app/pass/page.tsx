"use client";

import React, { Suspense } from "react";
import PageWrapper from "@/components/PageWrapper";
import FarmerPassView from "@/components/FarmerPassView";
import { useTranslation } from "@/hooks/useTranslation";

export default function FarmerPassPage() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      <div className="pt-20">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">
              {t("pass_loading") || "Loading Official Gate Pass & QR..."}
            </div>
          }
        >
          <FarmerPassView />
        </Suspense>
      </div>
    </PageWrapper>
  );
}
