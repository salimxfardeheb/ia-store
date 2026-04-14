import PlaceholderPage from "@/app/admin/components/PlaceholderPage";
import { Wallet } from "lucide-react";

export default function Page() {
  return (
    <PlaceholderPage
      title="Finance"
      subtitle="Revenus et transactions"
      icon={<Wallet size={28} />}
    />
  );
}
