'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCcw, Filter, UserCheck, Clock, Layers } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [userRole, setUserRole] = useState('TELLER');

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches([{ id: 'ALL', name: 'All Branches' }, ...data]);
      }
    } catch (e) { console.error('Failed to load branches', e); }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user) setUserRole(user.role || 'TELLER');

      const params = new URLSearchParams({
        branchId: user?.role === 'ADMIN' ? filterBranch : (user?.branchId || 'HQ'),
        action: filterAction
      });

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        toast.error('Failed to load activity audit logs');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [filterBranch, filterAction]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-2xl border-white/40 shadow-2xl gap-6">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
              Security <span className="text-gradient">Audit Logs</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium tracking-tight mt-2">
            Real-time system activity tracking and operational audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {userRole === 'ADMIN' && (
            <Select value={filterBranch} onValueChange={(v) => v && setFilterBranch(v)}>
              <SelectTrigger className="h-12 w-44 bg-white/70 border-white/40 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">
                <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-white/40 rounded-2xl shadow-2xl">
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id} className="font-bold text-[11px] uppercase tracking-widest">
                    {b.name} ({b.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterAction} onValueChange={(v) => v && setFilterAction(v)}>
            <SelectTrigger className="h-12 w-48 bg-white/70 border-white/40 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">
              <Layers className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent className="glass border-white/40 rounded-2xl shadow-2xl">
              <SelectItem value="ALL" className="font-bold text-[11px] uppercase tracking-widest">All Actions</SelectItem>
              <SelectItem value="ORIGINATE_PAWN" className="font-bold text-[11px] uppercase tracking-widest">Originate Pawn</SelectItem>
              <SelectItem value="REDEEM_PAWN" className="font-bold text-[11px] uppercase tracking-widest">Redeem Pawn</SelectItem>
              <SelectItem value="APPROVE_PAWN" className="font-bold text-[11px] uppercase tracking-widest">Approve Pawn</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={loadAuditLogs}
            variant="outline"
            className="h-12 px-5 bg-white/70 border-white/40 text-slate-700 font-bold rounded-2xl shadow-lg"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="glass border-white/40 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Timestamp</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">User / Email</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Branch</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Action</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Resource Target</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-bold text-sm">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" /> Loading security audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-bold text-sm">
                    No activity audit logs found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—';
                  const actionColor = log.action?.includes('REDEEM') 
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : log.action?.includes('ORIGINATE')
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-xs text-slate-600 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {dateStr}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          {log.user_email || 'System'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-black text-xs text-indigo-700">
                        {log.branch_id || 'HQ'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${actionColor}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-700">
                        {log.resource || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] text-slate-500">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
