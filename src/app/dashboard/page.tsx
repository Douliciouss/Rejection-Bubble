import { getBubbleCompanies, getDashboardStats } from "@/lib/data";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [bubbleCompanies, stats] = await Promise.all([
    getBubbleCompanies(),
    getDashboardStats(),
  ]);

  return (
    <DashboardClient
      bubbleCompanies={bubbleCompanies}
      stats={stats}
    />
  );
}
