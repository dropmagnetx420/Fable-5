import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware handles auth gating; land everyone on the dashboard.
  redirect("/dashboard");
}
