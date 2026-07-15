'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle, XCircle, ShieldAlert, Sparkles, Inbox, RefreshCcw, Landmark, UserCheck
} from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const [pendingPawns, setPendingPawns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // User info
  const [user, setUser] = useState<any>(null);

  const loadUserAndPending = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        
        // Fetch all pawns, then filter pending_approval
        const params = new URLSearchParams({
          branchId: u.branchId || '',
          role: u.role || 'TELLER',
          filterBranch: 'ALL'
        });
        const res = await fetch(`/api/pawns?${params}`);
        if (res.ok) {
          const data: any[] = await res.json();
          const pending = data.filter(p => p.status === 'PENDING_APPROVAL');
          setPendingPawns(pending);
        } else {
          toast.error("Failed to load approvals list");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred loading approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndPending();
  }, []);

  const handleApprove = async (id: string, description: string) => {
    setProcessingId(id);
    const toastId = toast.loading(`Approving pawn ticket and posting to GL...`);
    try {
      const res = await fetch(`/api/pawns/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: user ? `${user.firstName || user.name || 'System Admin'}` : 'Manager'
        })
      });

      if (res.ok) {
        toast.success(`Approved & Disbursed: ${description}`, {
          description: "Double-entry accounting lines posted to General Ledger.",
          id: toastId
        });
        // Reload list
        loadUserAndPending();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve pawn ticket');
      }
    } catch (err: any) {
      toast.error("Approval failed", { description: err.message, id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this pawn ticket? This will delete the pending request.")) return;
    const toastId = toast.loading("Rejecting pawn ticket...");
    try {
      const res = await fetch(`/api/pawns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Pawn ticket rejected & deleted", { id: toastId });
        loadUserAndPending();
      } else {
        throw new Error("Failed to delete pawn ticket");
      }
    } catch (err: any) {
      toast.error("Rejection failed", { description: err.message, id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCcw className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  // Maker-Checker Authorization Lock (Only Admin/Manager)
  if (user && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Maker-Checker rules require **Managerial or Administrative** privileges to authorize 
            disbursals and verify collateral appraisals. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-2xl border-white/40 shadow-2xl gap-6">
        <div>
          <Badge variant="secondary" className="bg-amber-100/50 text-amber-800 border-amber-200/50 mb-3 px-3 py-0.5 font-black uppercase tracking-widest text-[10px]">
            <Sparkles className="w-3 h-3 mr-1 text-amber-600" /> Maker-Checker Workflow
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">
            Disbursal <span className="text-gradient">Approvals</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Review pending pawns, verify asset appraisals, and approve general ledger postings.</p>
        </div>
        <Button onClick={loadUserAndPending} variant="outline" className="gap-2 font-bold bg-white/50 border-white/40 glass">
          <RefreshCcw className="h-4 w-4" /> Refresh Inbox
        </Button>
      </div>

      {/* Main Content */}
      {pendingPawns.length === 0 ? (
        <Card className="glass border-white/40 shadow-2xl rounded-[2rem] overflow-hidden py-24 text-center">
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-50/50 border border-emerald-100">
              <Inbox className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">Inbox Zero!</h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                All originated pawn tickets are fully processed, authorized, and reconciled in the general ledger.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="glass border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white/40">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Originator Details</TableHead>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer ID</TableHead>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Description</TableHead>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Appraisal</TableHead>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Requested Cash</TableHead>
                <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="px-8 py-5" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {pendingPawns.map(pawn => (
                <TableRow key={pawn.id} className="group hover:bg-amber-50/20 transition-all duration-300">
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Branch: {pawn.branch_id || 'Main'}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1">Originated: {new Date(pawn.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 font-black text-slate-900">
                    {pawn.client_id}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-semibold text-slate-700">
                    {pawn.description}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-black text-amber-700 text-right">
                    Rs. {(pawn.appraised_value || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-black text-blue-700 text-right text-lg tracking-tighter">
                    Rs. {(pawn.disbursed_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                      PENDING APPROVAL
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        disabled={processingId === pawn.id}
                        onClick={() => handleReject(pawn.id)}
                        className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl gap-1 transition-all border border-slate-200/50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingId === pawn.id}
                        onClick={() => handleApprove(pawn.id, pawn.description)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-9 px-5 rounded-xl gap-1 shadow-lg shadow-emerald-600/15"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Authorize
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
