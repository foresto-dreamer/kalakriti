import LandingPage from "@/components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KisanSetu - Farmer's Portal",
  description: "Check nearby procurement centers, book delivery slots, and track queue positions in real-time.",
};

export default function Home() {
  return <LandingPage />;
}
