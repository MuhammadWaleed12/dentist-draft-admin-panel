import { ProviderAuthGuard } from "@/components/auth/provider-auth-guard";
import { ProviderDashboard } from "../../components/provider-dashboard";


export default function ProviderProfile() {
  return (
    <ProviderAuthGuard>
      <ProviderDashboard />
    </ProviderAuthGuard>
  );
}
