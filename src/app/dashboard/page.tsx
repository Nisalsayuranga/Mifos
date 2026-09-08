import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = (user.user_metadata?.role as string) ?? "buyer";
  const validRoles = ["buyer", "seller", "agent", "admin"];
  const target = validRoles.includes(role) ? role : "buyer";

  redirect(`/dashboard/${target}`);
}
