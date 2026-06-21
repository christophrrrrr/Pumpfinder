import Dashboard from "@/components/Dashboard";
import { features } from "@/lib/env";

export default function DashboardPage() {
  return <Dashboard aiEnabled={features.ai()} />;
}
