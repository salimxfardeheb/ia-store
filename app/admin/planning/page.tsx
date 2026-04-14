import PlaceholderPage from "@/app/admin/components/PlaceholderPage";
import { Calendar } from "lucide-react";

export default function Page() {
  return (
    <PlaceholderPage
      title="Planning"
      subtitle="Gestion du calendrier"
      icon={<Calendar size={28} />}
    />
  );
}
