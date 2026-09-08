"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AgentDashboard() {
  const [activeClients, setActiveClients] = useState(0);
  const [consultationsToday, setConsultationsToday] = useState(0);
  const [propertiesManaged, setPropertiesManaged] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ name: user.user_metadata?.full_name || "Agent" });

        // Properties managed
        const { count: pCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", user.id);
        setPropertiesManaged(pCount || 0);

        // Active clients (using inquiries as proxy)
        const { count: iCount } = await supabase
          .from("inquiries")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", user.id);
        setActiveClients(iCount || 0);

        // Consultations (all time for now, as 'today' requires date filtering)
        const { count: cCount } = await supabase
          .from("consultation_requests")
          .select("*", { count: "exact", head: true })
          .eq("assigned_agent_id", user.id);
        setConsultationsToday(cCount || 0);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-heading">
        Welcome back, {user?.name?.split(" ")[0] ?? "Agent"} 👋
      </h1>
      <p className="text-muted-foreground">Your client management tools are here.</p>
      
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading data...</div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <p className="font-semibold text-foreground">Active Clients</p>
            <p className="text-3xl font-bold text-primary mt-1">{activeClients}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <p className="font-semibold text-foreground">Consultations</p>
            <p className="text-3xl font-bold text-primary mt-1">{consultationsToday}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <p className="font-semibold text-foreground">Properties Managed</p>
            <p className="text-3xl font-bold text-primary mt-1">{propertiesManaged}</p>
          </div>
        </div>
      )}
    </div>
  );
}