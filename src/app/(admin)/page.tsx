import FleetDashboard from '@/components/dashboard/FleetDashboard';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Stratum",
  description: "Stratum",
};

export default function MainPage() {
  return (
    <FleetDashboard/>
  )
}
