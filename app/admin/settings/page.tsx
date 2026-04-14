import PlaceholderPage from "@/app/admin/components/PlaceholderPage";
import { Settings } from "lucide-react";

export default function Page() {
  return (
    <PlaceholderPage
      title="Paramètres"
      subtitle="Configuration de la boutique"
      icon={<Settings size={28} />}
    />
  );
}
