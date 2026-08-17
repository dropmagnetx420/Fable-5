import { isAdminConfigured } from "@/lib/supabase/admin";
import { FoisalClient } from "@/components/admin/foisal-client";

export const dynamic = "force-dynamic";

export default function FoisalPage() {
  return <FoisalClient configured={isAdminConfigured} />;
}
