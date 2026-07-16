'use client';

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  Sparkles,
  Layers,
  Zap,
  LineChart as LineChartIcon,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  Power
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statsTemplate = [
  { label: "Total Pawn Value", value: "Rs. 0", change: "+0.0%", trend: "up", icon: DollarSign, color: "emerald" },
  { label: "Active Pawnes", value: "0", change: "+0.0%", trend: "up", icon: CreditCard, color: "blue" },
  { label: "Total Customers", value: "0", change: "+0.0%", trend: "up", icon: Users, color: "primary" },
  { label: "System Health", value: "Online", change: "99.9%", trend: "up", icon: Zap, color: "indigo" },
];

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 38000 },
  { month: "May", revenue: 55000, expenses: 36000 },
  { month: "Jun", revenue: 67000, expenses: 40000 },
];

const loanDistribution = [
  { name: "Personal", value: 35, color: "var(--color-primary)" },
  { name: "Business", value: 28, color: "#10b981" },
  { name: "Mortgage", value: 22, color: "#7c3aed" },
  { name: "Bridge", value: 15, color: "#f59e0b" },
];

export default function Home() {
  const [stats, setStats] = useState(statsTemplate);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [status, setStatus] = useState('CLOSED');
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setBranchId(user.branchId || '');
      setBranchName(user.branchName || '');
      fetchStatus(user.branchId);
    }
  }, []);

  const fetchStatus = async (bid: string) => {
    try {
      const res = await fetch('/api/branch-status');
      if (res.ok) {
        const data = await res.json();
        if (data[bid]) setStatus(data[bid]);
      }
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async () => {
    if (!branchId) return;
    const newStatus = status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setIsStatusLoading(true);
    const toastId = toast.loading(`Setting branch as ${newStatus}...`);

    try {
      const res = await fetch('/api/branch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, status: newStatus })
      });
      if (res.ok) {
        setStatus(newStatus);
        toast.success(`Branch is now ${newStatus}`, { id: toastId });
      } else throw new Error();
    } catch (err) {
      toast.error("Failed to update status", { id: toastId });
    } finally {
      setIsStatusLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // 1. Get Customers Count
      const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
      
      // 2. Get Pawnes Data (Sum and Count)
      const { data: pawnsData } = await supabase.from('pawns').select('disbursed_amount');
      const totalPawnSum = (pawnsData || []).reduce((acc, p) => acc + (p.disbursed_amount || 0), 0);
      const activePawns = (pawnsData || []).length;

      // 3. Get Recent Transactions
      const { data: txs } = await supabase.from('transaction').select('*').order('timestamp', { ascending: false }).limit(6);

      setStats([
        { label: "Total Pawn Value", value: `Rs. ${totalPawnSum.toLocaleString()}`, change: "+0.0%", trend: "up", icon: DollarSign, color: "emerald" },
        { label: "Active Pawnes", value: activePawns.toString(), change: "+0.0%", trend: "up", icon: CreditCard, color: "blue" },
        { label: "Total Customers", value: (clientCount || 0).toString(), change: "+0.0%", trend: "up", icon: Users, color: "primary" },
        { label: "System Health", value: "Online", change: "100%", trend: "up", icon: Zap, color: "indigo" },
      ]);
      
      if (txs) setRecentTransactions(txs);
    } catch (err) {
      console.error('Dashboard Load Error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000 w-full max-w-[96%] xl:max-w-[1400px] mx-auto pb-10">
      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
            </div>
            <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] py-0.5 px-3 rounded-full bg-primary/5">
              System: Online
            </Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none">
            {branchName || 'Branch'} <span className="text-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">Overview</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm max-w-2xl">
            Manage operations for {branchName || 'your branch'} in real-time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Button 
            onClick={toggleStatus}
            disabled={isStatusLoading || !branchId}
            className={cn(
              "h-10 font-black text-xs uppercase tracking-wider px-6 rounded-xl shadow-md transition-all duration-300 gap-1.5 cursor-pointer",
              status === 'OPEN' 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" 
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
            )}
          >
            <Power className="w-3.5 h-3.5" />
            {status === 'OPEN' ? "Branch Open" : "Branch Closed"}
          </Button>
          <Button variant="outline" className="h-10 font-black text-xs uppercase tracking-wider px-6 rounded-xl border-slate-200 glass hover:bg-white shadow-xs cursor-pointer">
            History
          </Button>
          <Button className="h-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider px-6 rounded-xl shadow-md shadow-primary/20 card-hover cursor-pointer" onClick={() => window.location.href='/loans'}>
            New Pawn <ArrowUpRight className="ml-1 w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="glass group overflow-hidden border-white/50 shadow-md hover:shadow-lg transition-all duration-350 rounded-2xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:rotate-6",
                        stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                        stat.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                        stat.color === 'indigo' ? "bg-indigo-500/10 text-indigo-600" :
                        "bg-primary/10 text-primary"
                    )}>
                        <Icon className="w-5 h-5" />
                   </div>
                   <div className={cn(
                       "flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                       stat.trend === "up" ? "bg-emerald-100/50 text-emerald-700" : "bg-rose-100/50 text-rose-700"
                   )}>
                       {stat.trend === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                       {stat.change}
                   </div>
                </div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Primary Analytics Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Card */}
        <Card className="lg:col-span-8 glass border-white/50 shadow-md rounded-2xl overflow-hidden p-6 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-0">
             <div>
                <CardTitle className="text-xl font-black tracking-tighter">Money Growth</CardTitle>
                <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5">
                   <LineChartIcon className="w-3.5 h-3.5" /> Sales and Expenses
                </p>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded bg-primary shadow-sm shadow-primary/20" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Income</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded bg-indigo-255 bg-indigo-200" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expenses</span>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  tick={{fontSize: 9, fontWeight: 900}} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fontSize: 9, fontWeight: 900}} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => `Rs.${v/1000}k`}
                />
                <Tooltip 
                  cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(0,0,0,0.05)', 
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 900,
                    fontSize: '12px',
                    padding: '10px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-primary)" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio Distribution Bento */}
        <div className="lg:col-span-4 flex">
          <Card className="glass border-white/50 shadow-md rounded-2xl p-6 w-full flex flex-col items-center justify-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
             <div className="relative z-10 w-full">
                <CardHeader className="p-0 mb-4">
                   <CardTitle className="text-lg font-black tracking-tighter text-center italic">Loan Types</CardTitle>
                </CardHeader>
                <div className="relative h-[180px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={loanDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                          {loanDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="card-hover drop-shadow-md" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Layers className="w-5 h-5 text-primary/30 mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Loans</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tighter italic">92%</span>
                   </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {loanDistribution.map((item) => (
                    <div key={item.name} className="flex flex-col items-center p-2.5 rounded-xl bg-white/40 border border-white/50 transition-all hover:bg-white hover:shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full mb-1.5" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-0.5">{item.name}</span>
                      <span className="text-sm font-black text-slate-900 tracking-tighter">{item.value}%</span>
                    </div>
                  ))}
                </div>
             </div>
          </Card>
        </div>
      </div>

      {/* Ledger Records - Large Bento Card */}
      <Card className="glass border-white/50 shadow-md rounded-2xl overflow-hidden mb-8">
        <CardHeader className="bg-white/40 border-b border-slate-100 p-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black tracking-tighter uppercase italic">Recent Transactions</CardTitle>
                <p className="text-slate-500 font-bold text-xs flex items-center gap-1.5">
                   <Activity className="w-3.5 h-3.5 text-emerald-500" /> Latest activity logs
                </p>
              </div>
              <Button variant="outline" className="h-9 border-slate-200 glass font-black text-[10px] uppercase tracking-wider px-6 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xs cursor-pointer">View All History</Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center font-black text-slate-300 italic animate-pulse">Synchronizing with central vault...</td></tr>
                ) : recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-primary/3 transition-all duration-300 group cursor-default">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                         {tx.client_id}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Badge className="bg-white text-slate-600 border border-slate-200 font-black text-[9px] uppercase tracking-widest shadow-xs px-3 py-1 rounded-lg">
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <div className="text-sm font-black text-emerald-600 tracking-tighter italic">Rs. {tx.amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{new Date(tx.timestamp).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
