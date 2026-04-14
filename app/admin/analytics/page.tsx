import PlaceholderPage from "@/app/admin/components/PlaceholderPage";
import { BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <PlaceholderPage
      title="Analytiques"
      subtitle="Statistiques et performances"
      icon={<BarChart3 size={28} />}
    />
  );
}
