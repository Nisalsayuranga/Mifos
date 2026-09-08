"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone, Shield } from "lucide-react";

const roleColors: Record<string, string> = {
  seller: "bg-blue-100 text-blue-700",
  buyer: "bg-green-100 text-green-700",
  admin: "bg-purple-100 text-purple-700",
  agent: "bg-amber-100 text-amber-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          phone: u.phone || "No phone",
          role: u.role,
          joinedAt: new Date(u.created_at).toLocaleDateString()
        })));
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div><h1 className="text-2xl font-bold text-foreground font-heading">User Management</h1><p className="text-muted-foreground mt-1">{users.length} registered users</p></div>
      <div className="bg-white rounded-xl border border-border shadow-sm divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">{u.name?.charAt(0) || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{u.name}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3"/>{u.email}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3"/>{u.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span>
              <span className="text-xs text-muted-foreground">Since {u.joinedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}