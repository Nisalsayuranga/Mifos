'use client';

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, Search, FileText, Package, TrendingUp, AlertTriangle,
  Pencil, Trash2, RefreshCcw, Printer, Filter, UserCheck, Calculator, Coins
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function PawnesPage() {
  const [isOpen, setIsOpen]       = useState(false);
  const [pawns, setPawns]         = useState<any[]>([]);
  const [branches, setBranches]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [search, setSearch]       = useState('');
  const [editingPawn, setEditingPawn] = useState<any>(null);

  // Pawn Redemption Dialog State
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemingPawn, setRedeemingPawn] = useState<any>(null);
  const [redeemDays, setRedeemDays] = useState(15);
  const [redeemInsurance, setRedeemInsurance] = useState('50');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Pawn Details & Print Dialog State
  const [detailsPawn, setDetailsPawn] = useState<any>(null);
  const [detailsDays, setDetailsDays] = useState<number>(30);
  const [detailsInsurance, setDetailsInsurance] = useState<string>('50');

  // User context
  const [branchId, setBranchId]       = useState('');
  const [userId, setUserId]           = useState('');
  const [userRole, setUserRole]       = useState('TELLER');

  // Admin branch filter
  const [filterBranch, setFilterBranch] = useState('ALL');

  // Form state
  const [clientId, setClientId]         = useState('');
  const [description, setDescription]   = useState('');
  const [appraisal, setAppraisal]       = useState('');
  const [amount, setAmount]             = useState('');

  // Gold Calculator State
  const [showGoldCalc, setShowGoldCalc] = useState(false);
  const [goldPurity, setGoldPurity]     = useState('22K');
  const [goldWeight, setGoldWeight]     = useState('');
  const [goldRate, setGoldRate]         = useState('23500'); // Default market price per gram LKR
  const [goldLtv, setGoldLtv]           = useState('80'); // Default LTV %

  // Client lookup map: { nationalId/id -> "First Last" }
  const [clientsMap, setClientsMap]     = useState<Record<string, string>>({});
  const [resolvedName, setResolvedName] = useState('');
  const [clientsList, setClientsList]   = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const loadUser = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setBranchId(u.branchId || '');
      setUserId(u.id || '');
      setUserRole(u.role || 'TELLER');
      return u;
    }
    return null;
  };

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches([{ id: 'ALL', name: 'All Branches' }, ...data]);
      }
    } catch (e) { console.error('Failed to load branches', e); }
  };

  // Build a map of { nationalId -> "First Last", id -> "First Last" } for fast lookups
  const loadClients = async (u?: any) => {
    try {
      const user = u || JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/clients?branchId=${user?.branchId || ''}&role=${user?.role || ''}`);
      if (res.ok) {
        const data: any[] = await res.json();
        setClientsList(data);
        const map: Record<string, string> = {};
        data.forEach(c => {
          const name = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim();
          if (c.nationalId || c.national_id) map[(c.nationalId || c.national_id).toLowerCase()] = name;
          if (c.id) map[c.id.toLowerCase()] = name;
        });
        setClientsMap(map);
      }
    } catch (e) { console.error('Failed to load clients map', e); }
  };

  const loadPawns = async (u?: any) => {
    try {
      const user = u || loadUser();
      const params = new URLSearchParams({
        branchId: user?.branchId || branchId,
        role: user?.role || userRole,
        filterBranch,
      });
      const res = await fetch(`/api/pawns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPawns(data);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to load pawn tickets');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = loadUser();
    loadPawns(u);
    loadClients(u);
    loadBranches();
  }, []);

  // Reload when admin changes branch filter
  useEffect(() => {
    if (userRole === 'ADMIN') loadPawns();
  }, [filterBranch]);

  // Resolve customer name when NIC/ID is typed
  const handleClientIdChange = (val: string) => {
    setClientId(val);
    const name = clientsMap[val.toLowerCase().trim()];
    setResolvedName(name || '');
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const selectClient = (c: any) => {
    const nic = c.nationalId || c.national_id || c.id || '';
    setClientId(nic);
    const name = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim();
    setResolvedName(name);
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setClientId(''); setDescription(''); setAppraisal(''); setAmount('');
    setEditingPawn(null); setResolvedName('');
  };

  const openAdd = () => { resetForm(); setIsOpen(true); };

  const openEdit = (pawn: any) => {
    setEditingPawn(pawn);
    const cid = pawn.client_id || '';
    setClientId(cid);
    setResolvedName(clientsMap[cid.toLowerCase()] || '');
    setDescription(pawn.description || '');
    setAppraisal(String(pawn.appraised_value || ''));
    setAmount(String(pawn.disbursed_amount || ''));
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!clientId || !description || !amount) {
      toast.error('Missing required fields', { description: 'Please fill in Customer ID, Description, and Disbursed Amount.' });
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading(editingPawn ? 'Updating pawn ticket...' : 'Creating pawn ticket...');

    try {
      const url    = editingPawn ? `/api/pawns/${editingPawn.id}` : '/api/pawns';
      const method = editingPawn ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          description,
          appraisedValue: appraisal,
          disbursedAmount: amount,
          branchId,
          createdByUserId: userId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(editingPawn ? 'Pawn ticket updated!' : 'Pawn ticket created!', { id: toastId });
      setIsOpen(false);
      resetForm();
      loadPawns();
    } catch (err: any) {
      toast.error('Error saving ticket', { description: err.message, id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pawn: any) => {
    if (!confirm(`Delete pawn ticket for "${pawn.description}"?`)) return;
    const toastId = toast.loading('Deleting pawn ticket...');
    try {
      const res = await fetch(`/api/pawns/${pawn.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Pawn ticket deleted', { id: toastId });
      loadPawns();
    } catch (err) {
      toast.error('Could not delete ticket', { id: toastId });
    }
  };

  const getGoldFactor = (purity: string) => {
    if (purity === '24K') return 1.0;
    if (purity === '22K') return 0.916;
    if (purity === '20K') return 0.833;
    return 0.75; // 18K
  };

  const applyGoldCalculation = () => {
    const weight = parseFloat(goldWeight) || 0;
    const rate = parseFloat(goldRate) || 0;
    const factor = getGoldFactor(goldPurity);
    const appraisedVal = Math.round(weight * rate * factor);
    const ltvPercent = parseFloat(goldLtv) || 80;
    const loanAmount = Math.round(appraisedVal * (ltvPercent / 100));

    setAppraisal(String(appraisedVal));
    setAmount(String(loanAmount));
    
    // Auto-update description if empty
    setDescription(prev => prev === '' ? `${goldPurity} Gold Collateral, ${weight}g` : prev);

    toast.success('Gold valuation applied!', {
      description: `Appraisal: Rs. ${appraisedVal.toLocaleString()} | Loan Amount: Rs. ${loanAmount.toLocaleString()}`
    });
    setShowGoldCalc(false);
  };

  // Rupasinghe Interest Redemption Calculator
  const calculateRedemption = (principal: number, days: number, insuranceStr: string) => {
    const insurance = parseFloat(insuranceStr) || 0;
    const tier = principal < 50000 ? 'A' : 'B';
    let interestRate = 0.0250; // Tier A: 2.50%
    let discountRate = 0.0100; // Tier A: 1.00%
    if (tier === 'B') {
      interestRate = 0.0275; // Tier B: 2.75%
      discountRate = 0.0050; // Tier B: 0.50%
    }

    const interestOne = principal * interestRate;
    const totalAmount = principal + interestOne;
    const finalTotalInterest = interestOne + insurance;

    let settlement = 0;
    let accrualExpr = '';
    let accrualDesc = '';
    let activeNodeIndex = 0;

    if (days <= 10) {
      const discount = totalAmount * discountRate;
      settlement = totalAmount - discount;
      accrualExpr = `Total Amount (Rs. ${totalAmount.toLocaleString()}) - Discount (Rs. ${discount.toLocaleString()})`;
      accrualDesc = `Day 1-10: Early Discount of ${(discountRate * 100).toFixed(1)}% applied to Total Amount.`;
      activeNodeIndex = 0;
    } else if (days <= 30) {
      settlement = totalAmount;
      accrualExpr = `Flat Total Amount (T)`;
      accrualDesc = `Day 11-30: Standard grace period. Flat redemption amount of Total Amount.`;
      activeNodeIndex = 1;
    } else if (days <= 38) {
      const extraInt = (totalAmount * interestRate) * 0.25;
      settlement = principal + extraInt + finalTotalInterest;
      accrualExpr = `P + ((T × r_int) × 0.25) + I_final`;
      accrualDesc = `Month 2 (Days 1-8): Principal + 25% extra interest increment + Final Total Interest.`;
      activeNodeIndex = 2;
    } else if (days <= 45) {
      const extraInt = (totalAmount * interestRate) * 0.50;
      settlement = principal + extraInt + finalTotalInterest;
      accrualExpr = `P + ((T × r_int) × 0.50) + I_final`;
      accrualDesc = `Month 2 (Days 9-15): Principal + 50% extra interest increment + Final Total Interest.`;
      activeNodeIndex = 3;
    } else if (days <= 60) {
      const extraInt = totalAmount * interestRate;
      settlement = principal + extraInt + finalTotalInterest;
      accrualExpr = `P + (T × r_int) + I_final`;
      accrualDesc = `Month 2 (Full): Principal + 100% extra interest increment + Final Total Interest.`;
      activeNodeIndex = 4;
    } else {
      const months = Math.ceil(days / 30);
      const extraInt = (totalAmount * interestRate) * (months - 1);
      settlement = principal + extraInt + finalTotalInterest;
      accrualExpr = `P + ((T × r_int) × (${months} - 1)) + I_final`;
      accrualDesc = `Month 3+ (Month ${months}): Principal + accrued monthly interest + Final Total Interest.`;
      activeNodeIndex = 5;
    }

    const accruedCharges = Math.max(0, settlement - principal);
    return {
      interestRate,
      interestOne,
      totalAmount,
      finalTotalInterest,
      settlement,
      accrualExpr,
      accrualDesc,
      activeNodeIndex,
      accruedCharges
    };
  };

  const openRedeem = (pawn: any) => {
    setRedeemingPawn(pawn);
    // Calculate days elapsed between created_at and now
    const createdDate = pawn.created_at ? new Date(pawn.created_at) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    setRedeemDays(diffDays);
    setRedeemInsurance('50');
    setIsRedeemOpen(true);
  };

  const handleRedeemSubmit = async () => {
    if (!redeemingPawn) return;
    setIsRedeeming(true);
    const toastId = toast.loading('Processing pawn redemption...');
    try {
      const res = await fetch(`/api/pawns/${redeemingPawn.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurance: redeemInsurance,
          days: redeemDays,
          approvedBy: 'Teller / Cashier'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to redeem');
      }

      const data = await res.json();
      toast.success(`Pawn redeemed! Posted GL Journal Entry: ${data.journalEntryId}`, { id: toastId });
      setIsRedeemOpen(false);
      setRedeemingPawn(null);
      loadPawns();
    } catch (err: any) {
      toast.error('Redemption failed', { description: err.message, id: toastId });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleApprove = async (pawn: any) => {
    if (!confirm(`Are you sure you want to approve Pawn Ticket #${pawn.id?.substring(0, 8).toUpperCase()} for Rs. ${pawn.disbursed_amount?.toLocaleString()}?`)) return;
    const toastId = toast.loading('Approving pawn ticket...');
    try {
      const res = await fetch(`/api/pawns/${pawn.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: `Branch Office / ${userRole}` })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }
      toast.success('Pawn ticket approved successfully!', { id: toastId });
      loadPawns();
    } catch (err: any) {
      toast.error('Approval failed', { description: err.message, id: toastId });
    }
  };

  const openDetails = (pawn: any) => {
    setDetailsPawn(pawn);
    const createdDate = pawn.created_at ? new Date(pawn.created_at) : new Date();
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setDetailsDays(diffDays);
    setDetailsInsurance('50');
  };

  const totalDisbursed = pawns.reduce((s, p) => s + (p.disbursed_amount || 0), 0);
  const filtered = pawns.filter(p =>
    p.client_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-2xl border-white/40 shadow-2xl gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">
            Active <span className="text-gradient">Pawnes</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Record pawned collateral and assign capital to registered clients.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Admin Branch Filter */}
          {userRole === 'ADMIN' && (
            <Select value={filterBranch} onValueChange={(v) => v && setFilterBranch(v)}>
              <SelectTrigger className="h-14 w-48 bg-white/70 border-white/40 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg">
                <Filter className="w-3 h-3 mr-2 text-slate-400" />
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
          <Button
            onClick={openAdd}
            className="gap-2 bg-primary hover:bg-primary/90 h-14 px-8 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 card-hover w-full md:w-auto shrink-0 rounded-2xl"
          >
            <Plus className="h-4 w-4" /> Originate Pawn
          </Button>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[95vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="h-2 bg-primary" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                {editingPawn ? 'Edit Pawn Ticket' : 'Originate New Pawn'}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                {editingPawn ? 'Update the pawn ticket details below.' : 'Record a new pawned item and process the principal disbursement.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="grid gap-2 relative">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Customer ID or NIC</Label>
                <Input
                  value={clientId}
                  onChange={e => handleClientIdChange(e.target.value)}
                  placeholder="Search customer database..."
                  className="h-12 bg-white/50 rounded-xl font-mono font-bold"
                  onKeyDown={e => {
                    const typed = clientId.toLowerCase().trim();
                    const suggestions = clientsList.filter(c => {
                      if (!typed) return false;
                      const nic = (c.nationalId || c.national_id || c.id || '').toLowerCase();
                      const name = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.toLowerCase();
                      return nic.includes(typed) || name.includes(typed);
                    });

                    if (showSuggestions && suggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestion(p => Math.min(p + 1, suggestions.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestion(p => Math.max(p - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (suggestions[activeSuggestion]) {
                          selectClient(suggestions[activeSuggestion]);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }
                  }}
                />
                
                {/* Autocomplete Dropdown list */}
                {(() => {
                  const typed = clientId.toLowerCase().trim();
                  const suggestions = clientsList.filter(c => {
                    if (!typed) return false;
                    const nic = (c.nationalId || c.national_id || c.id || '').toLowerCase();
                    const name = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.toLowerCase();
                    return nic.includes(typed) || name.includes(typed);
                  });

                  return (
                    <>
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-20 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                          {suggestions.map((c, i) => {
                            const nicStr = c.nationalId || c.national_id || c.id || '';
                            const nameStr = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim();
                            const isSelected = i === activeSuggestion;
                            return (
                              <button
                                key={c.id || i}
                                type="button"
                                onClick={() => selectClient(c)}
                                onMouseEnter={() => setActiveSuggestion(i)}
                                className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex flex-col gap-0.5 border-b border-slate-100 last:border-0 ${
                                  isSelected ? 'bg-primary text-white' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className={`${isSelected ? 'text-white' : 'text-slate-900'} font-black text-sm`}>{nameStr}</span>
                                <span className={`${isSelected ? 'text-slate-200' : 'text-slate-400'} font-mono`}>{nicStr}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fallback "Add Customer" redirection button when NIC not found */}
                      {clientId && !resolvedName && suggestions.length === 0 && (
                        <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2">
                          <span className="text-amber-800 text-[11px] font-black tracking-tight">This Customer NIC is not registered in the system.</span>
                          <Button
                            type="button"
                            onClick={() => {
                              window.location.href = `/clients?register=true&nic=${encodeURIComponent(clientId)}`;
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-xl flex items-center justify-center gap-1.5 h-9 w-full"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Customer
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}

                {resolvedName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl mt-1">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-black text-sm">{resolvedName}</span>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pawn Item Description</Label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g., 22k Gold Chain, 18g"
                  className="h-12 bg-white/50 rounded-xl"
                />
              </div>

              {/* Gold Calculator Collapsible Helper */}
              <div className="border border-amber-100 bg-amber-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-800">
                    <Calculator className="w-3.5 h-3.5 text-amber-600" /> Gold Valuation Helper
                  </span>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setShowGoldCalc(!showGoldCalc)}
                    className="h-auto p-0 font-black text-[10px] uppercase tracking-wider text-amber-600 hover:text-amber-700"
                  >
                    {showGoldCalc ? "Hide Helper" : "Show Helper"}
                  </Button>
                </div>

                {showGoldCalc && (
                  <div className="grid gap-3 pt-2 border-t border-amber-100/50 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Purity</Label>
                        <Select value={goldPurity} onValueChange={(val) => setGoldPurity(val || '22K')}>
                          <SelectTrigger className="h-10 bg-white border-slate-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="24K" className="text-xs">24K (99.9%)</SelectItem>
                            <SelectItem value="22K" className="text-xs">22K (91.6%)</SelectItem>
                            <SelectItem value="20K" className="text-xs">20K (83.3%)</SelectItem>
                            <SelectItem value="18K" className="text-xs">18K (75.0%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight (g)</Label>
                        <Input 
                          type="number" 
                          placeholder="10" 
                          value={goldWeight} 
                          onChange={e => setGoldWeight(e.target.value)} 
                          className="h-10 bg-white border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gold Rate per g (Rs.)</Label>
                        <Input 
                          type="number" 
                          value={goldRate} 
                          onChange={e => setGoldRate(e.target.value)} 
                          className="h-10 bg-white border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LTV Max Ratio (%)</Label>
                        <Input 
                          type="number" 
                          value={goldLtv} 
                          onChange={e => setGoldLtv(e.target.value)} 
                          className="h-10 bg-white border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={applyGoldCalculation} 
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest h-10 rounded-xl mt-1 gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" /> Apply Appraisal & Disbursal
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Appraised Value (Rs.)</Label>
                  <Input
                    value={appraisal}
                    onChange={e => setAppraisal(e.target.value)}
                    type="number"
                    placeholder="100000"
                    className="h-12 bg-white/50 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Disbursed Amount (Rs.)</Label>
                  <Input
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    type="number"
                    placeholder="85000"
                    className="h-12 bg-blue-50 border-blue-300 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" className="font-bold text-slate-500 h-12 rounded-xl" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button
                disabled={isSaving}
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? 'Saving...' : (editingPawn ? 'Update Ticket' : 'Finalize & Disburse')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Active Pawn Items',  value: loading ? '—' : pawns.length.toString(),                       icon: Package,       color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { label: 'Capital Disbursed',  value: loading ? '—' : `Rs. ${totalDisbursed.toLocaleString()}`,      icon: TrendingUp,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Items in Arrears',   value: '0',                                                            icon: AlertTriangle, color: 'text-rose-600',    bg: 'bg-rose-50' },
        ].map(s => (
          <Card key={s.label} className="glass border-white/50 shadow-xl rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <CardContent className="p-8 flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} shrink-0`}>
                <s.icon className={`h-7 w-7 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-3xl font-black tracking-tighter leading-none ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by Ticket ID, Client, or Description..."
          className="pl-12 h-14 bg-white/50 border-white/40 glass focus:ring-primary shadow-lg rounded-2xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto glass border-white/40 rounded-[2.5rem] shadow-2xl bg-white/40">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Ticket #</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer ID</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Description</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Appraised</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Disbursed</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</TableHead>
              <TableHead className="px-8 py-5" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-64 text-center font-black text-slate-300 animate-pulse tracking-widest uppercase">Loading pawn registry...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <FileText className="h-12 w-12 text-slate-200" />
                    <p className="text-slate-400 font-bold">{search ? 'No matching pawn items found.' : "No active pawn items. Click 'Originate Pawn' to begin."}</p>
                    {!search && (
                      <Button variant="outline" onClick={openAdd} className="border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest h-12 rounded-xl hover:bg-primary hover:text-white transition-all px-8">
                        Create First Ticket
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(pawn => (
                <TableRow key={pawn.id} className="group hover:bg-primary/5 transition-all duration-300">
                  <TableCell className="px-8 py-5 font-black text-slate-500 text-[11px] tracking-widest">
                    #{pawn.id?.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 group-hover:text-primary transition-colors text-sm">
                        {pawn.client_id || '—'}
                      </span>
                      {clientsMap[pawn.client_id?.toLowerCase()] && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3" />
                          {clientsMap[pawn.client_id?.toLowerCase()]}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 font-bold text-slate-700 max-w-[200px] truncate">
                    {pawn.description}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-bold text-amber-700">
                    Rs. {(pawn.appraised_value || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-8 py-5 font-black text-blue-700 text-lg tracking-tighter">
                    Rs. {(pawn.disbursed_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 border ${
                      pawn.status === 'PENDING_APPROVAL' 
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : pawn.status === 'ACTIVE'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : pawn.status === 'REDEEMED'
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}>
                      {pawn.status || 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {pawn.created_at ? new Date(pawn.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {pawn.status === 'PENDING_APPROVAL' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(pawn)}
                          className="h-9 px-3 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 font-bold text-xs"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(pawn)}
                        className="h-9 px-3 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1 font-bold text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Print / Details
                      </Button>
                      {pawn.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRedeem(pawn)}
                          className="h-9 px-3 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1 font-bold text-xs"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          Settle
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(pawn)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pawn)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pawn Redemption & Settlement Dialog */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent className="w-[95vw] md:w-full md:max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl rounded-3xl p-8 bg-slate-950 text-slate-100">
          <DialogHeader className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2 text-purple-400">
              <Coins className="w-6 h-6 animate-bounce" />
              <DialogTitle className="text-2xl font-black tracking-tight text-white">
                Pawn Redemption & Settlement Engine
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-wider text-xs">
              Rupasinghe Core Settlement System
            </DialogDescription>
          </DialogHeader>

          {redeemingPawn && (() => {
            const principal = redeemingPawn.disbursed_amount || 0;
            const {
              interestRate,
              interestOne,
              totalAmount,
              finalTotalInterest,
              settlement,
              accrualExpr,
              accrualDesc,
              activeNodeIndex,
              accruedCharges
            } = calculateRedemption(principal, redeemDays, redeemInsurance);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Controls & Presets */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Transaction Details</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Ticket ID:</span>
                        <span className="font-mono text-sm font-bold text-white">#{redeemingPawn.id?.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Customer:</span>
                        <span className="text-sm font-bold text-emerald-400">{clientsMap[redeemingPawn.client_id?.toLowerCase()] || redeemingPawn.client_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Description:</span>
                        <span className="text-sm font-bold text-slate-200">{redeemingPawn.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Principal (Read Only) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-300 font-bold">Principal Amount (LKR)</Label>
                      <span className="bg-purple-900/50 text-purple-300 border border-purple-700/50 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Tier {principal < 50000 ? 'A' : 'B'}</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono text-slate-500 font-bold">Rs.</span>
                      <Input
                        type="text"
                        readOnly
                        value={principal.toLocaleString()}
                        className="bg-white/5 border-white/10 text-white font-mono text-lg font-bold pl-12 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Days Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-300 font-bold">Days Elapsed</Label>
                      <span className="font-mono text-sm font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-0.5 rounded-xl">{redeemDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="365"
                      value={redeemDays}
                      onChange={e => setRedeemDays(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                    />
                    {/* Milestones */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[5, 15, 35, 42, 55, 95].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setRedeemDays(d)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                            redeemDays === d
                              ? 'bg-purple-500 border-purple-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          Day {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Insurance Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-300 font-bold">Insurance Amount (LKR) [Manual]</Label>
                      <span className="bg-purple-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Manual</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono text-slate-500 font-bold">Rs.</span>
                      <Input
                        type="number"
                        value={redeemInsurance}
                        onChange={e => setRedeemInsurance(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-mono text-lg font-bold pl-12 rounded-xl"
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex gap-2">
                      {['10', '50', '100', '250', '500'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setRedeemInsurance(p)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            redeemInsurance === p
                              ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p} Rs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Output, Timeline Map & Mathematical Audit */}
                <div className="space-y-6">
                  {/* Total Settlement Amount Output */}
                  <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/20 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden shadow-2xl shadow-purple-950/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Redemption Amount</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xl font-bold text-slate-400">Rs.</span>
                      <span className="text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(191,85,236,0.3)]">{settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-4 text-xs font-bold text-slate-400">
                      <div className="text-left">
                        <span>Principal:</span>
                        <p className="font-mono text-white text-sm">Rs. {principal.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span>Accrued Charges:</span>
                        <p className="font-mono text-purple-400 text-sm">Rs. {accruedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mathematical Audit */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Real-Time Mathematical Audit</h3>
                    <div className="space-y-2 text-xs text-slate-300">
                      {/* Interest One */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <span className="text-slate-400">Base Interest (I₁):</span>
                          <p className="text-[10px] font-mono text-slate-500">{principal.toLocaleString()} × {(interestRate*100).toFixed(2)}%</p>
                        </div>
                        <span className="font-mono font-bold text-slate-200">Rs. {interestOne.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {/* Total Amount */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <span className="text-slate-400">Total Amount (T):</span>
                          <p className="text-[10px] font-mono text-slate-500">Principal + I₁</p>
                        </div>
                        <span className="font-mono font-bold text-slate-200">Rs. {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {/* Manual Insurance */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <span className="text-slate-400">Manual Insurance Fee:</span>
                          <p className="text-[10px] font-mono text-slate-500">Overridden Cashier input</p>
                        </div>
                        <span className="font-mono font-bold text-slate-200">Rs. {parseFloat(redeemInsurance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {/* Segment Accrual */}
                      <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-300 font-bold">Segment Accrual Mode:</span>
                          <span className="font-mono font-bold text-purple-200">Rs. {settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-purple-500/10 border-l-2 border-purple-500 rounded p-2 text-[11px] text-purple-300 font-mono">
                          <p className="font-bold">{accrualExpr}</p>
                          <p className="text-[10px] opacity-75 mt-0.5">{accrualDesc}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settle Action Button */}
                  <Button
                    onClick={handleRedeemSubmit}
                    disabled={isRedeeming}
                    type="button"
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all"
                  >
                    {isRedeeming ? (
                      <RefreshCcw className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Coins className="w-5 h-5 mr-2" />
                    )}
                    Process Settlement & Post GL
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Pawn Details & Printable Receipt Dialog */}
      <Dialog open={!!detailsPawn} onOpenChange={(v) => { if (!v) setDetailsPawn(null); }}>
        <DialogContent className="w-[95vw] md:w-full md:max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl rounded-3xl p-8 bg-slate-900 text-slate-100">
          <DialogHeader className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <FileText className="w-6 h-6" />
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  Pawn Ticket Details & Bill Generator
                </DialogTitle>
              </div>
              <Button
                onClick={() => {
                  const receiptEl = document.getElementById('printable-pawn-receipt');
                  if (!receiptEl) return;
                  const printWindow = window.open('', '_blank', 'width=400,height=700');
                  if (!printWindow) return;
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8"/>
                      <title>Rupasinghe Pawning - Receipt</title>
                      <style>
                        @page { margin: 0; size: 80mm auto; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                          width: 80mm;
                          font-family: 'Courier New', Courier, monospace;
                          font-size: 11px;
                          color: #000;
                          background: #fff;
                          padding: 4mm;
                        }
                        h2 { font-size: 14px; font-weight: 900; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 3px 2px; font-size: 10px; }
                        .border-b-2 { border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
                        .border-t { border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; }
                        .border-t-2 { border-top: 2px dashed #000; padding-top: 6px; margin-top: 6px; }
                      <head>
                        <title>Pawn Ticket - ${detailsPawn.id}</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; }
                          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                          .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.05em; }
                          .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; color: #64748b; }
                          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                          .label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
                          .val { font-size: 16px; font-weight: 700; margin-top: 4px; }
                          .amount-box { bg-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-top: 30px; }
                          .amount-title { font-size: 14px; font-weight: 800; color: #475569; }
                          .amount-val { font-size: 32px; font-weight: 900; color: #059669; letter-spacing: -0.05em; margin-top: 8px; }
                          .footer-note { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-t: 1px solid #e2e8f0; pt-20; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="logo">RUPASINGHE PAWNING</div>
                          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-top: 5px;">Official Receipt / Vault Voucher</div>
                        </div>
                        <div class="meta">
                          <div><strong>Ticket ID:</strong> ${detailsPawn.id}</div>
                          <div><strong>Date:</strong> ${new Date(detailsPawn.created_at).toLocaleString('en-GB')}</div>
                        </div>
                        <div class="grid">
                          <div>
                            <div class="label">Customer Name</div>
                            <div class="val">${clientsMap[detailsPawn.client_id?.toLowerCase()] || detailsPawn.client_id || '—'}</div>
                          </div>
                          <div>
                            <div class="label">Branch Office</div>
                            <div class="val">${detailsPawn.branch_id || 'HQ'}</div>
                          </div>
                        </div>
                        <div class="grid">
                          <div>
                            <div class="label">Collateral Description</div>
                            <div class="val">${detailsPawn.description}</div>
                          </div>
                          <div>
                            <div class="label">Appraised Valuation</div>
                            <div class="val">Rs. ${parseFloat(detailsPawn.appraised_value || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        <div class="amount-box">
                          <div class="amount-title">Total Disbursed Capital</div>
                          <div class="amount-val">Rs. ${parseFloat(detailsPawn.disbursed_amount || 0).toLocaleString()}</div>
                        </div>
                        <div class="footer-note">
                          This is a computer-generated transaction record. Central Vault copy. Thank you for your business.
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Customer Bill
              </Button>
            </div>
          </DialogHeader>

          {detailsPawn && (() => {
            const principal = detailsPawn.disbursed_amount || 0;
            const {
              interestRate,
              interestOne,
              totalAmount,
              finalTotalInterest,
              settlement,
              accrualExpr,
              accrualDesc,
              accruedCharges
            } = calculateRedemption(principal, detailsDays, detailsInsurance);

            return (
              <div className="space-y-8">
                {/* Real-time Calculator Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/10 pb-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Live Interest Simulator</h3>
                    
                    {/* Days Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-slate-300 font-bold">Simulate Days Elapsed</Label>
                        <span className="font-mono text-sm font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-0.5 rounded-xl">{detailsDays} Days</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="365"
                        value={detailsDays}
                        onChange={e => setDetailsDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[5, 15, 35, 42, 55, 95].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDetailsDays(d)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                              detailsDays === d
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            Day {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Insurance Override */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 font-bold">Insurance Cost (Rs.)</Label>
                      <Input
                        type="number"
                        value={detailsInsurance}
                        onChange={e => setDetailsInsurance(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-mono text-sm font-bold rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Settlement for {detailsDays} Days</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xl font-bold text-slate-400">Rs.</span>
                        <span className="text-4xl font-black text-white tracking-tight">{settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                      <div>
                        <span>Accrued Interest + Ins:</span>
                        <p className="font-mono text-blue-400 text-sm">Rs. {accruedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <span>Interest Rate Mode:</span>
                        <p className="text-white text-sm">{(interestRate*100).toFixed(2)}% (Tier {principal < 50000 ? 'A' : 'B'})</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Printable Invoice Block */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4">Print Preview (Exact Thermal Receipt Structure)</h3>
                  
                  {/* Outer Wrapper for Print isolation */}
                  <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-inner max-w-2xl mx-auto border border-slate-200" id="printable-pawn-receipt">
                    <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-6">
                      <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900">RUPASINGHE PAWNING</h2>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Core Management Hub | Branch Office</p>
                      <p className="text-[10px] font-medium text-slate-400">Authorized Pawning & Financial Services</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ticket Details</p>
                        <p className="font-mono font-bold mt-1">Ticket #: <span className="font-black text-sm">#{detailsPawn.id?.substring(0, 8).toUpperCase()}</span></p>
                        <p className="mt-1">Date: <b>{detailsPawn.created_at ? new Date(detailsPawn.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</b></p>
                        <p className="mt-1">Status: <span className="font-bold text-emerald-600 uppercase text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{detailsPawn.status || 'ACTIVE'}</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customer Details</p>
                        <p className="font-bold mt-1">NIC: {detailsPawn.client_id || '—'}</p>
                        <p className="mt-1">Name: <b>{clientsMap[detailsPawn.client_id?.toLowerCase()] || '—'}</b></p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Collateral & Gold Assessment</p>
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                            <th className="py-2">Item Description</th>
                            <th className="py-2 text-right">Appraised Value</th>
                            <th className="py-2 text-right">Disbursed Capital</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-3 font-bold text-slate-800">{detailsPawn.description}</td>
                            <td className="py-3 text-right font-semibold text-slate-700">Rs. {detailsPawn.appraised_value?.toLocaleString()}</td>
                            <td className="py-3 text-right font-black text-slate-900 text-sm">Rs. {detailsPawn.disbursed_amount?.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 border-t border-slate-200 pt-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pawn Capital Loan:</span>
                        <span className="font-bold">Rs. {detailsPawn.disbursed_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Interest rate:</span>
                        <span className="font-semibold">{(interestRate * 100).toFixed(2)}% per month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standard Base Monthly Interest:</span>
                        <span className="font-semibold text-slate-700">Rs. {interestOne.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Accrued Days:</span>
                        <span className="font-semibold">{detailsDays} Days</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black">
                        <span className="text-slate-800">Total Settlement Value:</span>
                        <span className="text-slate-900 text-base">Rs. {settlement.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Terms and Signatures */}
                    <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-300 text-[9px] text-slate-400 leading-relaxed">
                      <p className="font-bold uppercase text-slate-600 mb-1">Terms & Conditions</p>
                      <p>1. Interest is accrued progressively in slabs as per the Rupasinghe pawning scheme guidelines.</p>
                      <p>2. A discount rate is applied for early settlements within the first 10 days.</p>
                      <p className="mt-4 text-center font-bold text-slate-500">Thank you for banking with Rupasinghe Pawning!</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mt-12 pt-8 text-center text-xs text-slate-500">
                      <div>
                        <div className="border-t border-slate-300 pt-2 font-medium">Customer Signature</div>
                      </div>
                      <div>
                        <div className="border-t border-slate-300 pt-2 font-medium">Authorized Officer</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print handled via popup window - no CSS injection needed */}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
