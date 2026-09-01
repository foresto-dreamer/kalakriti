import FarmerProfilePage from "@/components/FarmerProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farmer Profile Dashboard | KisanSetu",
  description: "Manage your registered agriculture profile, land details, active delivery tokens, and DBT MSP payment records.",
};

export default function ProfilePage() {
  return <FarmerProfilePage />;
}
