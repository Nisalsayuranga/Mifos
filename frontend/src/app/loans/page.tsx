'use client';

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, Search, FileText, Package, TrendingUp, AlertTriangle,
  Pencil, Trash2, RefreshCcw, Printer, Filter, UserCheck, Calculator, Coins, Scale, Download
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

  // Pawn Details & Print Dialog State (Fully Editable Override Support)
  const [detailsPawn, setDetailsPawn]                         = useState<any>(null);
  const [detailsDays, setDetailsDays]                         = useState<number>(1);
  const [detailsInsurance, setDetailsInsurance]               = useState<string>('50');
  const [detailsCustomRate, setDetailsCustomRate]             = useState<string>('');
  const [detailsCustomInterest, setDetailsCustomInterest]     = useState<string>('');
  const [detailsCustomSettlement, setDetailsCustomSettlement] = useState<string>('');
  const [detailsCustomAppraised, setDetailsCustomAppraised]   = useState<string>('');
  const [detailsCustomDisbursed, setDetailsCustomDisbursed]   = useState<string>('');

  // User context
  const [branchId, setBranchId]       = useState('');
  const [userId, setUserId]           = useState('');
  const [userRole, setUserRole]       = useState('TELLER');

  // Admin branch filter
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [redemptionReceiptData, setRedemptionReceiptData] = useState<any>(null);

  // Form state
  const BILL_PREFIXES = ['1R', '3M', '3R', '6R', '12R', '6M', 'A'];
  const ITEM_TYPES = ['PP', 'PR', 'NL', 'EAR', 'CH', 'BRC', 'BKT'];

  const [billPrefix, setBillPrefix]     = useState('1R');
  const [billNo, setBillNo]             = useState('');
  const [itemType, setItemType]         = useState('CH');
  const [clientId, setClientId]         = useState('');
  const [description, setDescription]   = useState('');
  const [appraisal, setAppraisal]       = useState('');
  const [amount, setAmount]             = useState('');

  // Client Extended Details
  const [clientPhone, setClientPhone]     = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Dedicated Grams & Milligrams Weight & Period State
  const [weightGrams, setWeightGrams]   = useState('');
  const [weightMg, setWeightMg]         = useState('');
  const [periodMonths, setPeriodMonths] = useState('3');

  // Multi-Item Pawn State
  const [itemsList, setItemsList] = useState<any[]>([
    { itemType: 'CH', description: '', weightGrams: '', weightMg: '', appraisedValue: '' }
  ]);

  const handleAddItem = () => {
    setItemsList(prev => [
      ...prev,
      { itemType: 'CH', description: '', weightGrams: '', weightMg: '', appraisedValue: '' }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (itemsList.length <= 1) return;
    setItemsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, field: string, val: string) => {
    setItemsList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };

      // Auto-recalculate aggregate appraisal & weight if items changed
      const totAppraised = copy.reduce((s, item) => s + (parseFloat(item.appraisedValue) || 0), 0);
      if (totAppraised > 0) setAppraisal(String(totAppraised));

      return copy;
    });
  };

  // Gold Calculator State
  const [showGoldCalc, setShowGoldCalc] = useState(false);
  const [goldPurity, setGoldPurity]     = useState('22K');
  const [goldWeight, setGoldWeight]     = useState('');
  const [goldRate, setGoldRate]         = useState('23500'); // Default market price per gram LKR
  const [goldLtv, setGoldLtv]           = useState('80'); // Default LTV %

  const handleWeightChange = (gVal: string, mgVal: string) => {
    setWeightGrams(gVal);
    setWeightMg(mgVal);

    const g = parseFloat(gVal) || 0;
    const mg = parseFloat(mgVal) || 0;
    
    const totalGrams = g + (mg / 1000);
    const formattedWeight = totalGrams > 0 ? (totalGrams % 1 === 0 ? String(totalGrams) : totalGrams.toFixed(3).replace(/\.?0+$/, '')) : '';
    
    setGoldWeight(formattedWeight);
  };

  // Client lookup maps: { nationalId/id -> "First Last" } and { id -> NIC }
  const [clientsMap, setClientsMap]     = useState<Record<string, string>>({});
  const [clientsNicMap, setClientsNicMap] = useState<Record<string, string>>({});
  const [resolvedName, setResolvedName] = useState('');
  const [clientsList, setClientsList]   = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const getClientNic = (pawn: any) => {
    if (!pawn) return '—';
    const cid = String(pawn.client_id || '').toLowerCase();
    return clientsNicMap[cid] || String(pawn.client_id || '—');
  };

  const getBillNo = (pawn: any) => {
    if (!pawn) return '—';
    const desc = String(pawn.description || '');
    const match = desc.match(/^([A-Za-z0-9]+\s+[0-9A-Za-z]+)\s*\|?\s*(.*)/);
    if (match && match[1]) return match[1].trim();
    const pid = String(pawn.id || '');
    return `#${pid.substring(0, 8).toUpperCase()}`;
  };

  const getCleanDescription = (pawn: any) => {
    if (!pawn) return '—';
    const desc = String(pawn.description || '');
    const match = desc.match(/^([A-Za-z0-9]+\s+[0-9A-Za-z]+)\s*\|\s*(.*)/);
    if (match && match[2]) return match[2].trim();
    return desc;
  };

  const isNicFormat = (str: string): boolean => {
    if (!str) return true;
    const clean = str.trim();
    if (/^\d{9,12}[vVxX]?$/.test(clean)) return true;
    return false;
  };

  const getCustomerName = (pawn: any): string => {
    if (!pawn) return '';

    const pawnCidStr = String(pawn.client_id || '').toLowerCase().trim();

    const directName = pawn.client_name || pawn.customer_name || pawn.customerName || pawn.clientName;
    if (directName && !isNicFormat(directName)) return directName;

    if (pawn.clients) {
      const cName = `${pawn.clients.firstName || pawn.clients.first_name || ''} ${pawn.clients.lastName || pawn.clients.last_name || ''}`.trim() || pawn.clients.name || pawn.clients.full_name;
      if (cName && !isNicFormat(cName)) return cName;
    }
    if (pawn.client) {
      const cName = `${pawn.client.firstName || pawn.client.first_name || ''} ${pawn.client.lastName || pawn.client.last_name || ''}`.trim() || pawn.client.name || pawn.client.full_name;
      if (cName && !isNicFormat(cName)) return cName;
    }

    if (pawnCidStr && clientsMap[pawnCidStr]) {
      const mappedName = clientsMap[pawnCidStr];
      if (mappedName && !isNicFormat(mappedName)) return mappedName;
    }

    if (clientsList && clientsList.length > 0 && pawnCidStr) {
      const matchedClient = clientsList.find((c: any) => {
        const cId = String(c.id || '').toLowerCase().trim();
        const cNic = String(c.nationalId || c.national_id || c.nic || '').toLowerCase().trim();
        return cId === pawnCidStr || cNic === pawnCidStr;
      });
      if (matchedClient) {
        const matchedName = `${matchedClient.firstName || matchedClient.first_name || ''} ${matchedClient.lastName || matchedClient.last_name || ''}`.trim() || matchedClient.name || matchedClient.full_name;
        if (matchedName && !isNicFormat(matchedName)) return matchedName;
      }
    }

    return '';
  };

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
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/clients?branchId=${user?.branchId || ''}`, { headers });
      if (res.ok) {
        const data: any[] = await res.json();
        setClientsList(data);
        const map: Record<string, string> = {};
        const nMap: Record<string, string> = {};
        data.forEach(c => {
          const rawName = `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim();
          const name = rawName || c.name || c.full_name || c.customer_name || c.client_name || 'Client';
          const nic = String(c.nationalId || c.national_id || c.nic || c.id || '').trim();
          if (nic) {
            map[nic.toLowerCase()] = name;
            nMap[nic.toLowerCase()] = nic;
          }
          if (c.id != null) {
            const cidStr = String(c.id).toLowerCase().trim();
            map[cidStr] = name;
            nMap[cidStr] = nic;
          }
        });
        setClientsMap(map);
        setClientsNicMap(nMap);
      }
    } catch (e) { console.error('Failed to load clients map', e); }
  };

  const loadPawns = async (u?: any) => {
    try {
      const user = u || loadUser();
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        branchId: user?.branchId || branchId,
        role: user?.role || userRole,
        filterBranch,
      });
      const res = await fetch(`/api/pawns?${params}`, { headers });
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
    const cleanVal = val.toLowerCase().trim();
    let matchedName = clientsMap[cleanVal] || '';

    if (!matchedName && clientsList.length > 0) {
      const matchedClient = clientsList.find(c => {
        const nic = String(c.nationalId || c.national_id || c.nic || c.id || '').toLowerCase().trim();
        return nic === cleanVal;
      });
      if (matchedClient) {
        matchedName = `${matchedClient.firstName || matchedClient.first_name || ''} ${matchedClient.lastName || matchedClient.last_name || ''}`.trim();
      }
    }

    setResolvedName(matchedName || '');
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
    setBillPrefix('1R'); setBillNo(''); setItemType('CH'); setGoldWeight('');
    setWeightGrams(''); setWeightMg('');
    setClientPhone(''); setClientAddress('');
    setItemsList([{ itemType: 'CH', description: '', weightGrams: '', weightMg: '', appraisedValue: '' }]);
    setEditingPawn(null); setResolvedName(''); setShowSuggestions(false);
  };

  const openAdd = () => { resetForm(); loadClients(); setIsOpen(true); };

  const openEdit = (pawn: any) => {
    setEditingPawn(pawn);
    const cid = pawn.client_id || '';
    setClientId(cid);
    
    let resolved = clientsMap[cid.toLowerCase()] || '';
    let cPhone = '';
    let cAddress = '';

    if (pawn.clients) {
      resolved = `${pawn.clients.firstName || ''} ${pawn.clients.lastName || ''}`.trim() || resolved;
      cPhone = pawn.clients.phone || '';
      cAddress = pawn.clients.address || pawn.clients.address_line1 || '';
    } else {
      const matchedClient = clientsList.find(c => String(c.id).toLowerCase() === cid.toLowerCase() || String(c.nationalId || c.national_id || '').toLowerCase() === cid.toLowerCase());
      if (matchedClient) {
        cPhone = matchedClient.phone || '';
        cAddress = matchedClient.address || matchedClient.address_line1 || '';
      }
    }
    
    setResolvedName(resolved);
    setClientPhone(cPhone);
    setClientAddress(cAddress);
    
    // Parse description for bill prefix and bill no if present
    const desc = pawn.description || '';
    const match = desc.match(/^([A-Za-z0-9]+)\s+([0-9]+)\s*\|?\s*(.*)/);
    if (match) {
      if (BILL_PREFIXES.includes(match[1])) setBillPrefix(match[1]);
      setBillNo(match[2]);
      setDescription(match[3] || desc);
    } else {
      setDescription(desc);
    }

    // Extract Grams & mg from pawn weight_grams/weight_mg or weight or items
    let gVal = pawn.weight_grams !== undefined && pawn.weight_grams !== null ? String(pawn.weight_grams) : '';
    let mgVal = pawn.weight_mg !== undefined && pawn.weight_mg !== null ? String(pawn.weight_mg) : '';

    let wNum = (parseFloat(gVal) || 0) + ((parseFloat(mgVal) || 0) / 1000);
    if (wNum <= 0) {
      wNum = parseFloat(String(pawn.weight || '').replace(/[^0-9.]/g, '')) || 0;
    }
    if (wNum <= 0 && Array.isArray(pawn.items) && pawn.items.length > 0) {
      wNum = pawn.items.reduce((s: number, it: any) => s + (parseFloat(it.weight_grams) || 0) + ((parseFloat(it.weight_mg) || 0) / 1000), 0);
    }

    if (!gVal && !mgVal && wNum > 0) {
      const g = Math.floor(wNum);
      const mg = Math.round((wNum - g) * 1000);
      gVal = String(g || '');
      mgVal = mg > 0 ? String(mg) : '';
    }

    setWeightGrams(gVal);
    setWeightMg(mgVal);
    setGoldWeight(wNum > 0 ? String(wNum) : '');
    setPeriodMonths(String(pawn.period_months || '3'));

    setAppraisal(String(pawn.appraised_value || ''));
    setAmount(String(pawn.disbursed_amount || ''));
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!clientId || !amount) {
      toast.error('Missing required fields', { description: 'Please select a Customer and enter Disbursed Amount.' });
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading(editingPawn ? 'Updating pawn ticket...' : 'Creating pawn ticket...');

    try {
      const cleanBill = billNo.trim();
      let finalBillNo = '';
      if (cleanBill) {
        // If user already typed prefix inside billNo, format cleanly
        const prefixUpper = billPrefix.toUpperCase();
        if (cleanBill.toUpperCase().startsWith(prefixUpper + ' ')) {
          finalBillNo = cleanBill;
        } else if (cleanBill.toUpperCase().startsWith(prefixUpper)) {
          finalBillNo = `${billPrefix} ${cleanBill.substring(prefixUpper.length).trim()}`;
        } else {
          finalBillNo = `${billPrefix} ${cleanBill}`;
        }
      }

      const itemDesc = description.trim() || `${goldPurity} Gold Collateral (${itemType})`;
      const fullDescription = finalBillNo ? `${finalBillNo} | ${itemDesc}` : itemDesc;

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url    = editingPawn ? `/api/pawns/${editingPawn.id}` : '/api/pawns';
      const method = editingPawn ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          clientId,
          clientName: resolvedName,
          phone: clientPhone,
          address: clientAddress,
          description: fullDescription,
          appraisedValue: appraisal,
          disbursedAmount: amount,
          branchId,
          createdByUserId: userId,
          billNo: finalBillNo,
          weight: goldWeight,
          weightGrams,
          weightMg,
          periodMonths,
          itemType,
          items: itemsList
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      const savedData = await res.json();

      toast.success(editingPawn ? 'Pawn ticket updated!' : 'Pawn ticket created & synced to vault stock!', { id: toastId });
      setIsOpen(false);
      resetForm();
      loadPawns();

      // Automatically open official Printable Pawn Agreement Receipt Modal
      if (!editingPawn && savedData) {
        openDetails(savedData);
      }
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

      const calc = calculateRedemption(
        redeemingPawn.disbursed_amount || 0,
        redeemDays,
        redeemInsurance
      );

      const receiptObj = {
        pawn: redeemingPawn,
        journalEntryId: data.journalEntryId,
        days: redeemDays,
        insurance: redeemInsurance,
        principal: redeemingPawn.disbursed_amount || 0,
        interest: calc.accruedCharges,
        settlement: calc.settlement,
        redeemedAt: new Date().toLocaleDateString('en-GB')
      };

      setIsRedeemOpen(false);
      setRedeemingPawn(null);
      setRedemptionReceiptData(receiptObj);
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

    const p = pawn.disbursed_amount || 0;
    const calc = calculateRedemption(p, diffDays, '50');
    setDetailsCustomRate((calc.interestRate * 100).toFixed(2));
    setDetailsCustomInterest(calc.accruedCharges.toString());
    setDetailsCustomSettlement(calc.settlement.toString());
    setDetailsCustomAppraised(String(pawn.appraised_value || 0));
    setDetailsCustomDisbursed(String(pawn.disbursed_amount || 0));
  };

  const totalDisbursed = pawns.reduce((s, p) => s + (p.disbursed_amount || 0), 0);
  const searchLower = (search || '').toLowerCase();
  const filtered = pawns.filter(p =>
    String(p.client_id || '').toLowerCase().includes(searchLower) ||
    String(p.description || '').toLowerCase().includes(searchLower) ||
    String(p.id || '').toLowerCase().includes(searchLower)
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
        <DialogContent className="w-[95vw] sm:max-w-[480px] max-h-[95vh] overflow-y-auto overflow-x-hidden bg-white border border-slate-200 shadow-2xl p-0 rounded-[2rem]">
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

              {/* Extended Customer Contact Info (Phone & Address) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Phone Number</Label>
                  <Input
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="07X XXX XXXX"
                    className="h-10 bg-white/50 rounded-xl text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Address</Label>
                  <Input
                    value={clientAddress}
                    onChange={e => setClientAddress(e.target.value)}
                    placeholder="Customer Address"
                    className="h-10 bg-white/50 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Bill Prefix & Bill Number Input Block */}
              <div className="grid gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-col gap-1.5">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500">Bill Type / Prefix</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BILL_PREFIXES.map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setBillPrefix(pref)}
                        className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all border ${
                          billPrefix === pref
                            ? 'bg-primary text-white border-primary shadow-md scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500">Bill Number</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-primary px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                      {billPrefix || '1R'}
                    </span>
                    <Input
                      value={billNo}
                      onChange={e => setBillNo(e.target.value)}
                      placeholder="E.g., 20743"
                      className="h-11 bg-white rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Item Category Shortcuts & Description */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pawn Item Category & Description</Label>
                  <div className="flex gap-1">
                    {ITEM_TYPES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setItemType(cat);
                          setDescription(prev => prev ? `${prev} (${cat})` : `Gold Collateral (${cat})`);
                        }}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                          itemType === cat ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="E.g., 22k Gold Chain"
                  className="h-12 bg-white/50 rounded-xl"
                />
              </div>

              {/* Dedicated Grams & Milligrams (mg) Weight & Tenor Period Fields */}
              <div className="grid gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Item Gold Weight & Pawn Tenor
                  </Label>
                  {goldWeight && (
                    <span className="px-3 py-1 bg-amber-600 text-white font-black text-[10px] rounded-xl tracking-wider shadow-sm">
                      Total: {goldWeight} g {weightMg ? `(${weightGrams || 0}g ${weightMg}mg)` : ''}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Weight (Grams - g)</Label>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        step="any"
                        placeholder="E.g., 12"
                        value={weightGrams}
                        onChange={e => handleWeightChange(e.target.value, weightMg)}
                        className="h-11 bg-white border-2 border-amber-400/60 focus:border-amber-600 rounded-xl font-mono font-bold text-slate-900 pr-7 text-xs"
                      />
                      <span className="absolute right-2.5 text-xs font-black text-slate-400 pointer-events-none">g</span>
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Weight (Milligrams - mg)</Label>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        step="any"
                        placeholder="E.g., 500"
                        value={weightMg}
                        onChange={e => handleWeightChange(weightGrams, e.target.value)}
                        className="h-11 bg-white border-2 border-amber-400/60 focus:border-amber-600 rounded-xl font-mono font-bold text-slate-900 pr-9 text-xs"
                      />
                      <span className="absolute right-2.5 text-xs font-black text-slate-400 pointer-events-none">mg</span>
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <Label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Tenor Period</Label>
                    <Select value={periodMonths} onValueChange={(v) => setPeriodMonths(v || '3')}>
                      <SelectTrigger className="h-11 bg-white border-2 border-amber-400/60 focus:border-amber-600 text-xs font-bold font-mono">
                        <SelectValue placeholder="3 Months" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="1" className="text-xs font-mono font-bold">1 Month (1R)</SelectItem>
                        <SelectItem value="3" className="text-xs font-mono font-bold">3 Months (3M / 3R)</SelectItem>
                        <SelectItem value="6" className="text-xs font-mono font-bold">6 Months (6M / 6R)</SelectItem>
                        <SelectItem value="12" className="text-xs font-mono font-bold">12 Months (12R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                          onChange={e => {
                            const val = e.target.value;
                            setGoldWeight(val);
                            const wNum = parseFloat(val) || 0;
                            if (wNum > 0) {
                              const g = Math.floor(wNum);
                              const mg = Math.round((wNum - g) * 1000);
                              setWeightGrams(String(g || ''));
                              setWeightMg(mg > 0 ? String(mg) : '');
                            }
                          }} 
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
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Bill #</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Customer NIC & Name</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Description</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Appraised</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Disbursed</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</TableHead>
              <TableHead className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Actions</TableHead>
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
                  <TableCell className="px-4 py-3 font-black text-primary text-xs tracking-widest whitespace-nowrap">
                    {getBillNo(pawn)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-slate-900 group-hover:text-primary transition-colors text-xs whitespace-nowrap">
                        {getClientNic(pawn)}
                      </span>
                      {(() => {
                        const custName = getCustomerName(pawn);
                        return custName ? (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-0.5 whitespace-nowrap">
                            <UserCheck className="w-3 h-3" />
                            {custName}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-bold text-slate-700 max-w-[180px] truncate">
                    {getCleanDescription(pawn)}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-bold text-amber-700 whitespace-nowrap">
                    Rs. {(pawn.appraised_value || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-black text-blue-700 text-base tracking-tighter whitespace-nowrap">
                    Rs. {(pawn.disbursed_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 border ${
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
                  <TableCell className="px-4 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap">
                    {pawn.created_at ? new Date(pawn.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      {pawn.status === 'PENDING_APPROVAL' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(pawn)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-bold text-xs shrink-0 shadow-md cursor-pointer transition-all"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openDetails(pawn)}
                        className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 font-bold text-xs shrink-0 shadow-md cursor-pointer transition-all"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Print / Details
                      </Button>
                      {pawn.status === 'ACTIVE' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openRedeem(pawn)}
                          className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 font-bold text-xs shrink-0 shadow-md cursor-pointer transition-all"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          Settle
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(pawn)}
                        className="h-8 w-8 p-0 rounded-lg border border-slate-200 bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-700 flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-all"
                        title="Edit Pawn"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pawn)}
                        className="h-8 w-8 p-0 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 text-slate-700 hover:text-rose-600 flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-all"
                        title="Delete Pawn"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

      {/* Pawn Details & Printable Receipt Dialog (Fast Isolated Sub-Component) */}
      <PawnDetailsModal
        pawn={detailsPawn}
        onClose={() => setDetailsPawn(null)}
        clientsMap={clientsMap}
        clientsNicMap={clientsNicMap}
        clientsList={clientsList}
        branchesList={branches}
        getBillNo={getBillNo}
        getClientNic={getClientNic}
        getCleanDescription={getCleanDescription}
        calculateRedemption={calculateRedemption}
      />

      {/* Pawn Redemption / Settlement Receipt Modal */}
      <RedemptionReceiptModal
        data={redemptionReceiptData}
        onClose={() => setRedemptionReceiptData(null)}
        clientsList={clientsList}
        clientsMap={clientsMap}
        branchesList={branches}
        getBillNo={getBillNo}
        getClientNic={getClientNic}
        getCleanDescription={getCleanDescription}
      />
    </div>
  );
}

const BRANCH_ADDRESSES: Record<string, string> = {
  HQ: 'Head Office, No. 3/B/1, Station Road, Dehiwala.',
  DHW: 'No. 3/B/1, Station Road, Dehiwala.',
  DEHIWALA: 'No. 3/B/1, Station Road, Dehiwala.',
  BRL: 'Borella Branch, Colombo 08.',
  BORELLA: 'Borella Branch, Colombo 08.',
  KOT: 'Kotikawatta Branch, Angoda.',
  KOTIKAWATTA: 'Kotikawatta Branch, Angoda.',
  DMT: 'Dematagoda Branch, Colombo 09.',
  DEMATAGODA: 'Dematagoda Branch, Colombo 09.',
  W2: 'Wattala Branch No. 2, Negombo Road, Wattala.',
  W3: 'Wattala Branch No. 3, Negombo Road, Wattala.',
  W4: 'Wattala Branch No. 4, Negombo Road, Wattala.',
  WATTALA: 'Negombo Road, Wattala.',
  KIR: 'Kiribathgoda Branch, Kandy Road, Kiribathgoda.',
  KIRIBATHGODA: 'Kiribathgoda Branch, Kandy Road, Kiribathgoda.',
  KDW: 'Kadawatha Branch, Kandy Road, Kadawatha.',
  KADAWATHA: 'Kadawatha Branch, Kandy Road, Kadawatha.',
  PND: 'Panadura Branch, Galle Road, Panadura.',
  PANADURA: 'Panadura Branch, Galle Road, Panadura.',
  KTW: 'Kottawa Branch, High Level Road, Kottawa.',
  KOTTAWA: 'Kottawa Branch, High Level Road, Kottawa.',
  HMG: 'Homagama Branch, High Level Road, Homagama.',
  HOMAGAMA: 'Homagama Branch, High Level Road, Homagama.',
  KHT: 'Kahathuduwa Branch, Main Street, Kahathuduwa.',
  KAHATHUDUWA: 'Kahathuduwa Branch, Main Street, Kahathuduwa.',
};

const getBranchAddress = (pawn: any, branchesList?: any[]): string => {
  if (!pawn) return 'No. 3/B/1, Station Road, Dehiwala.';

  if (pawn.branch_address) return pawn.branch_address;
  if (pawn.branchAddress) return pawn.branchAddress;

  const bId = String(pawn.branch_id || pawn.branchId || '').toUpperCase().trim();
  if (bId && BRANCH_ADDRESSES[bId]) return BRANCH_ADDRESSES[bId];

  const bName = String(pawn.branch_name || pawn.branchName || pawn.branch || '').toUpperCase().trim();
  if (bName && BRANCH_ADDRESSES[bName]) return BRANCH_ADDRESSES[bName];

  if (branchesList && branchesList.length > 0) {
    const matchedBranch = branchesList.find((b: any) =>
      String(b.id || '').toUpperCase() === bId ||
      String(b.name || '').toUpperCase() === bName
    );
    if (matchedBranch?.address) return matchedBranch.address;
    if (matchedBranch?.name) return `${matchedBranch.name} Branch.`;
  }

  if (pawn.branch_name || pawn.branch) {
    return `${pawn.branch_name || pawn.branch} Branch.`;
  }

  return 'No. 3/B/1, Station Road, Dehiwala.';
};

// Ultra-Fast Isolated Sub-Component for Pawn Details & Interactive Bill Receipt (100% Editable Fields)
function PawnDetailsModal({
  pawn,
  onClose,
  clientsMap,
  clientsNicMap,
  clientsList,
  branchesList,
  getBillNo,
  getClientNic,
  getCleanDescription,
  calculateRedemption
}: {
  pawn: any;
  onClose: () => void;
  clientsMap: Record<string, string>;
  clientsNicMap: Record<string, string>;
  clientsList: any[];
  branchesList?: any[];
  getBillNo: (p: any) => string;
  getClientNic: (p: any) => string;
  getCleanDescription: (p: any) => string;
  calculateRedemption: (p: number, d: number, ins: string) => any;
}) {
  // Inline Editable States directly inside the Bill
  const [billNo, setBillNo]               = useState<string>('');
  const [billMonths, setBillMonths]       = useState<string>('3');
  const [billDate, setBillDate]           = useState<string>('');
  const [billBranchAddress, setBillBranchAddress] = useState<string>('');
  const [billName, setBillName]           = useState<string>('');
  const [billAddress, setBillAddress]     = useState<string>('');
  const [billNic, setBillNic]             = useState<string>('');
  const [billPhone, setBillPhone]         = useState<string>('');
  const [billAmount, setBillAmount]       = useState<string>('0');
  const [billDesc, setBillDesc]           = useState<string>('');
  const [billAppraised, setBillAppraised] = useState<string>('0');
  const [billWeight, setBillWeight]       = useState<string>('');
  const [billLastDate, setBillLastDate]   = useState<string>('');

  const resolveClientDetails = (p: any) => {
    if (!p) return { name: '', address: '', nic: '', phone: '' };

    const pawnCidStr = String(p.client_id || '').toLowerCase().trim();

    const clientObj = clientsList?.find((c: any) => {
      const cId  = String(c.id || '').toLowerCase().trim();
      const cNic = String(c.nationalId || c.national_id || c.nic || '').toLowerCase().trim();
      const cNum = String(c.clientNumber || c.client_number || '').toLowerCase().trim();
      return (cId && cId === pawnCidStr) || (cNic && cNic === pawnCidStr) || (cNum && cNum === pawnCidStr);
    });

    const cObjName = clientObj
      ? (`${clientObj.firstName || clientObj.first_name || ''} ${clientObj.lastName || clientObj.last_name || ''}`.trim() || clientObj.name || clientObj.full_name || clientObj.customer_name)
      : '';

    const pName = p.client_name || p.customer_name || p.customerName || p.clientName ||
      (p.clients ? (`${p.clients.firstName || p.clients.first_name || ''} ${p.clients.lastName || p.clients.last_name || ''}`.trim() || p.clients.name || p.clients.full_name) : '') ||
      (p.client ? (`${p.client.firstName || p.client.first_name || ''} ${p.client.lastName || p.client.last_name || ''}`.trim() || p.client.name || p.client.full_name) : '');

    const name = pName || (pawnCidStr && clientsMap[pawnCidStr]) || cObjName || '';

    const address = p.client_address || p.address || clientObj?.address || clientObj?.address_line1 || p.clients?.address || p.client?.address || '';

    const rawNic = p.client_nic || p.nic || p.national_id || p.client?.nationalId || p.client?.national_id || p.clients?.nationalId || p.clients?.national_id || clientObj?.nationalId || clientObj?.national_id || getClientNic(p);
    const nic = (rawNic && rawNic !== '—' && rawNic !== 'undefined') ? rawNic : '';

    const phone = p.client_phone || p.phone || clientObj?.phone || clientObj?.mobile || p.clients?.phone || p.client?.phone || '';

    return { name, address, nic, phone };
  };

  // Auto-print flag: trigger once when pawn first opens
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  useEffect(() => {
    if (pawn) {
      const bNo = getBillNo(pawn);
      const createdDate = pawn.created_at ? new Date(pawn.created_at) : new Date();
      const formattedDate = createdDate.toLocaleDateString('en-GB');

      const pawnTenorMonths = parseInt(pawn.period_months, 10) || 3;
      const lastD = new Date(createdDate);
      lastD.setMonth(lastD.getMonth() + pawnTenorMonths);
      const formattedLastDate = lastD.toLocaleDateString('en-GB');

      const cDetails = resolveClientDetails(pawn);
      const bAddress = getBranchAddress(pawn, branchesList);
      const computedWeight = pawn.weight_grams || pawn.weight || (Array.isArray(pawn.pawn_items) && pawn.pawn_items.length > 0 ? pawn.pawn_items.reduce((s: number, i: any) => s + (Number(i.weight_grams) || 0), 0) : '0.0');

      let wVal = parseFloat(pawn.weight || 0);
      if (wVal <= 0 && Array.isArray(pawn.items) && pawn.items.length > 0) {
        wVal = pawn.items.reduce((s: number, it: any) => s + (parseFloat(it.weight_grams) || 0) + ((parseFloat(it.weight_mg) || 0) / 1000), 0);
      }

      let formattedWeightStr = '';
      if (wVal > 0) {
        const g = Math.floor(wVal);
        const mg = Math.round((wVal - g) * 1000);
        formattedWeightStr = mg > 0 ? `${g}g ${mg}mg` : `${g}g`;
      } else if (pawn.weight_grams !== undefined) {
        const g = Math.floor(pawn.weight_grams);
        const mg = Math.round((parseFloat(pawn.weight_mg) || 0));
        formattedWeightStr = mg > 0 ? `${g}g ${mg}mg` : `${g}g`;
      }

      setBillNo(bNo);
      setBillMonths(String(pawnTenorMonths));
      setBillDate(formattedDate);
      setBillBranchAddress(bAddress);
      setBillName(cDetails.name);
      setBillAddress(cDetails.address);
      setBillNic(cDetails.nic);
      setBillPhone(cDetails.phone);
      setBillAmount(String(pawn.disbursed_amount || 0));
      setBillDesc(getCleanDescription(pawn));
      setBillAppraised(String(pawn.appraised_value || 0));
      setBillWeight(formattedWeightStr || String(computedWeight));
      setBillLastDate(formattedLastDate);
      setHasAutoPrinted(false); // reset for new pawn
    }
  }, [pawn]);

  // Auto-trigger print dialog ~800ms after bill opens (so fields are populated)
  useEffect(() => {
    if (pawn && !hasAutoPrinted) {
      const timer = setTimeout(() => {
        setHasAutoPrinted(true);
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pawn, hasAutoPrinted]);

  if (!pawn) return null;

  const resetDefaults = () => {
    if (pawn) {
      const bNo = getBillNo(pawn);
      const createdDate = pawn.created_at ? new Date(pawn.created_at) : new Date();
      const formattedDate = createdDate.toLocaleDateString('en-GB');

      const pTenor = parseInt(pawn.period_months, 10) || 3;
      const lastD = new Date(createdDate);
      lastD.setMonth(lastD.getMonth() + pTenor);
      const formattedLastDate = lastD.toLocaleDateString('en-GB');

      const cDetails = resolveClientDetails(pawn);
      const bAddress = getBranchAddress(pawn, branchesList);

      let wVal = parseFloat(pawn.weight || 0);
      if (wVal <= 0 && Array.isArray(pawn.items) && pawn.items.length > 0) {
        wVal = pawn.items.reduce((s: number, it: any) => s + (parseFloat(it.weight_grams) || 0) + ((parseFloat(it.weight_mg) || 0) / 1000), 0);
      }
      let formattedWeightStr = '';
      if (wVal > 0) {
        const g = Math.floor(wVal);
        const mg = Math.round((wVal - g) * 1000);
        formattedWeightStr = mg > 0 ? `${g}g ${mg}mg` : `${g}g`;
      } else if (pawn.weight_grams !== undefined) {
        const g = Math.floor(pawn.weight_grams);
        const mg = Math.round((parseFloat(pawn.weight_mg) || 0));
        formattedWeightStr = mg > 0 ? `${g}g ${mg}mg` : `${g}g`;
      }

      setBillNo(bNo);
      setBillMonths(String(pTenor));
      setBillDate(formattedDate);
      setBillBranchAddress(bAddress);
      setBillName(cDetails.name);
      setBillAddress(cDetails.address);
      setBillNic(cDetails.nic);
      setBillPhone(cDetails.phone);
      setBillAmount(String(pawn.disbursed_amount || 0));
      setBillDesc(getCleanDescription(pawn));
      setBillAppraised(String(pawn.appraised_value || 0));
      setBillWeight(formattedWeightStr || String(pawn.weight || ''));
      setBillLastDate(formattedLastDate);
    }
  };

  const getPrintableBillHtml = (targetPawn: any, state: any) => {
    const p = targetPawn || {};

    const finalBillNo = state.billNo || getBillNo(p) || '—';
    const createdDate = p.created_at ? new Date(p.created_at) : new Date();
    const finalDate = state.billDate || createdDate.toLocaleDateString('en-GB');

    const pTenor = parseInt(state.billMonths || p.period_months, 10) || 3;
    const finalMonths = String(pTenor);

    const lastD = new Date(createdDate);
    lastD.setMonth(lastD.getMonth() + pTenor);
    const finalLastDate = state.billLastDate || lastD.toLocaleDateString('en-GB');

    const cDetails = resolveClientDetails(p);
    const finalName = state.billName || cDetails.name || 'Valued Customer';
    const finalAddress = state.billAddress || cDetails.address || '—';
    const finalNic = state.billNic || cDetails.nic || '—';
    const finalPhone = state.billPhone || cDetails.phone || '—';

    const finalAmount = parseFloat(state.billAmount) || parseFloat(p.disbursed_amount) || 0;
    const finalAppraised = parseFloat(state.billAppraised) || parseFloat(p.appraised_value) || finalAmount;
    const finalDesc = state.billDesc || getCleanDescription(p) || 'Gold Collateral';
    const finalBranchAddress = state.billBranchAddress || getBranchAddress(p, branchesList) || 'Branch Office';

    let wVal = (parseFloat(p.weight_grams) || 0) + ((parseFloat(p.weight_mg) || 0) / 1000);
    if (wVal <= 0) {
      wVal = parseFloat(String(p.weight || '').replace(/[^0-9.]/g, '')) || 0;
    }
    let finalWeight = state.billWeight;
    if (!finalWeight || finalWeight === 'g' || finalWeight === '0 g' || finalWeight === '0') {
      if (wVal > 0) {
        const g = Math.floor(wVal);
        const mg = Math.round((wVal - g) * 1000);
        finalWeight = mg > 0 ? `${g}g ${mg}mg` : `${g}g`;
      } else {
        finalWeight = '—';
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Pawn Bill - ${finalBillNo}</title>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 10mm 15mm; }
            html, body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              background: white !important; 
              margin: 0 !important; padding: 0 !important; 
            }
            .no-print { display: none !important; }
          }
          body { 
            font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; 
            padding: 20px; 
            background: white; 
            color: #0f172a; 
          }
          .bill-card {
            max-width: 650px; 
            margin: 0 auto; 
            background: white; 
            color: #0f172a; 
            padding: 20px; 
            border: 1px solid #cbd5e1; 
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="bill-card">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;">
            <h2 style="font-size: 20px; font-weight: 900; text-transform: uppercase; color: #1e3a8a; margin: 0;">RUPASINGHE TRUST INVESTMENTS LTD.</h2>
            <p style="font-size: 10px; font-weight: 700; font-style: italic; color: #334155; margin: 2px 0;">(PREVIOUSLY L. S. RUPASINGHE PAWN BROKERS)</p>
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 600; color: #1e293b; margin-top: 4px;">
              <span>Phone: 011 7006588</span>
              <span style="font-weight: 700;">${finalBranchAddress}</span>
            </div>
          </div>

          <!-- Top Row: Months & Date -->
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; margin-bottom: 10px;">
            <div>
              <span>මාස / Months: </span> <span style="border-bottom: 1px solid #0f172a; padding: 0 10px; font-family: monospace;">${finalMonths}</span>
            </div>
            <div>
              <span>Date: </span> <span style="border-bottom: 1px solid #0f172a; padding: 0 10px; font-family: monospace;">${finalDate}</span>
            </div>
          </div>

          <!-- Customer Declaration -->
          <div style="font-size: 11.5px; margin-bottom: 12px; line-height: 1.7;">
            <div>
              I the undersigned <span style="border-bottom: 1px solid #0f172a; font-weight: bold; padding: 0 8px;">${finalName}</span>
            </div>
            <div>
              of <span style="border-bottom: 1px solid #0f172a; padding: 0 8px;">${finalAddress}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <div>N.I.C. No. <span style="border-bottom: 1px solid #0f172a; font-weight: bold; font-family: monospace; padding: 0 8px;">${finalNic}</span></div>
              <div>Phone No. <span style="border-bottom: 1px solid #0f172a; font-family: monospace; padding: 0 8px;">${finalPhone}</span></div>
            </div>
            <div style="margin-top: 4px;">
              being the lawful owner of the articles mentioned below has sold out right for
            </div>
            <div style="margin-top: 4px;">
              Rs. <span style="border-bottom: 1px solid #0f172a; font-weight: bold; font-family: monospace; font-size: 15px; padding: 0 8px;">Rs. ${finalAmount.toLocaleString()}</span>
            </div>
          </div>

          <!-- Articles Description & Weight -->
          <div style="border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; margin-bottom: 12px; background: #f8fafc;">
            <div style="font-weight: bold; font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Articles Description:</div>
            <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 6px;">${finalDesc}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 600; border-top: 1px solid #cbd5e1; padding-top: 6px; color: #1e293b;">
              <span>Appraised Valuation: <b>Rs. ${finalAppraised.toLocaleString()}</b></span>
              <span>Total Weight: <b style="font-family: monospace;">${finalWeight}</b></span>
            </div>
          </div>

          <!-- Legal Terms -->
          <div style="font-size: 10px; color: #1e293b; margin-bottom: 12px; line-height: 1.4;">
            <p style="margin: 2px 0;">I hold responsible and liable or any claims that may arise on the sale of the articles.</p>
            <p style="font-weight: bold; color: #0f172a; margin: 2px 0;">මෙය මට කියවා තේරුම් කරදුන් පසු අත්සන් කළෙමි.</p>
            <p style="font-size: 9.5px; margin: 2px 0;">රසිට්පතේ යට සඳහන් අවසාන දිනට ප්‍රථම නිදහස් කිරීම හෝ පොළී මුදල් ගෙවීම කළයුතුයි. එසේ නොවුනහොත් එදිනට පසු බඩු විකුණනු ලැබේ.</p>
          </div>

          <!-- Boxed Amount, Last Date, Signature & Stamp -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 10px 0; margin-bottom: 12px;">
            <div style="width: 58%;">
              <div style="border: 2px solid #0f172a; border-radius: 6px; padding: 6px; text-align: center; background: #f8fafc; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: #475569; display: block;">Rs.</span>
                <span style="font-size: 22px; font-weight: 900; font-family: monospace; color: #0f172a;">Rs. ${finalAmount.toLocaleString()}</span>
              </div>
              <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                <span>අවසාන දිනය / Last Date: </span>
                <span style="border-bottom: 1px solid #0f172a; font-family: monospace;">${finalLastDate}</span>
              </div>
              <div style="font-size: 11px; margin-bottom: 4px;">
                <span>ගනුදෙනු බාරගත් අයගේ අත්සන: </span>
                <span style="border-bottom: 1px solid #0f172a;">............................</span>
              </div>
              <div style="font-size: 11px;">
                <span>නම: </span>
                <span style="border-bottom: 1px solid #0f172a; font-weight: 600;">${finalName}</span>
              </div>
            </div>

            <div style="width: 38%; text-align: center;">
              <div style="width: 90px; height: 90px; border: 2px dashed #94a3b8; border-radius: 6px; margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #94a3b8;">
                STAMP
              </div>
              <div style="font-size: 15px; font-weight: 900; font-family: monospace; color: #0f172a;">
                R No. <span style="color: #1e3a8a;">${finalBillNo}</span>
              </div>
            </div>
          </div>

          <!-- Perforated Stub Line -->
          <div style="border-top: 2px dashed #94a3b8; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-family: monospace; font-weight: bold;">
            <div>R No. <span style="color: #1e3a8a;">${finalBillNo}</span></div>
            <div style="font-weight: normal; font-size: 11px; font-family: sans-serif; color: #475569;">......................................... Signature</div>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
      </html>
    `;
  };

  const handlePrint = (targetPawn?: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const html = getPrintableBillHtml(targetPawn || pawn, {
      billNo, billMonths, billDate, billBranchAddress, billName, billAddress, billNic, billPhone, billAmount, billDesc, billAppraised, billWeight, billLastDate
    });
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadPdf = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      toast.error('Popup blocked. Please allow popups and try again.');
      return;
    }
    const html = getPrintableBillHtml(pawn, {
      billNo, billMonths, billDate, billBranchAddress, billName, billAddress, billNic, billPhone, billAmount, billDesc, billAppraised, billWeight, billLastDate
    });
    printWin.document.write(html);
    printWin.document.close();
    toast.success('Print dialog opened — select "Save as PDF" to download.');
  };

  return (
    <Dialog open={!!pawn} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] max-h-[94vh] border border-slate-700 shadow-2xl rounded-3xl p-5 bg-slate-950 text-slate-100 flex flex-col overflow-y-auto">
        {/* Modal Header */}
        <DialogHeader className="border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-blue-400">
              <FileText className="w-5 h-5" />
              <DialogTitle className="text-xl font-black tracking-tight text-white">
                Pawn Bill Generator & Interactive Editor
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={resetDefaults}
                type="button"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                Reset Defaults
              </Button>
              <Button
                onClick={handleDownloadPdf}
                type="button"
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button
                onClick={handlePrint}
                type="button"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Customer Bill
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Interactive Bill Editor Container */}
        <div className="py-4 flex justify-center bg-slate-900/80 rounded-2xl border border-slate-800 my-2">
          <div className="bg-white text-slate-900 p-6 md:p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 text-xs font-serif leading-relaxed" id="printable-pawn-receipt">
            
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h2 className="text-2xl font-black tracking-tight uppercase text-blue-900 font-sans">RUPASINGHE TRUST INVESTMENTS LTD.</h2>
              <p className="text-xs font-bold tracking-wide italic text-slate-700 font-sans">(PREVIOUSLY L. S. RUPASINGHE PAWN BROKERS)</p>
              <div className="flex justify-between items-center text-xs font-sans font-bold text-slate-800 mt-2 px-1">
                <span>Phone: 011 7006588</span>
                <input
                  type="text"
                  value={billBranchAddress}
                  onChange={(e) => setBillBranchAddress(e.target.value)}
                  className="border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-blue-900 text-right font-sans font-bold px-2 py-0.5 rounded outline-none text-xs transition-all w-72"
                  placeholder="Branch Address"
                />
              </div>
            </div>

            {/* Top Row: Months & Date */}
            <div className="flex justify-between items-center text-xs mb-3 font-sans font-bold">
              <div className="flex items-center gap-1">
                <span>මාස / Months &#125;</span>
                <input
                  type="text"
                  value={billMonths}
                  onChange={(e) => {
                    const mVal = e.target.value;
                    setBillMonths(mVal);
                    const parsedM = parseInt(mVal, 10);
                    if (!isNaN(parsedM) && parsedM > 0 && billDate) {
                      const parts = billDate.split('/');
                      if (parts.length === 3) {
                        const d = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10) - 1;
                        const y = parseInt(parts[2], 10);
                        const dt = new Date(y, m, d);
                        dt.setMonth(dt.getMonth() + parsedM);
                        setBillLastDate(dt.toLocaleDateString('en-GB'));
                      }
                    }
                  }}
                  className="w-16 border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-blue-900 text-center font-mono font-bold px-1 py-0.5 rounded outline-none text-sm transition-all"
                  placeholder="3"
                />
              </div>
              <div className="flex items-center gap-1">
                <span>Date:</span>
                <input
                  type="text"
                  value={billDate}
                  onChange={(e) => {
                    const dVal = e.target.value;
                    setBillDate(dVal);
                    const parsedM = parseInt(billMonths, 10) || 3;
                    const parts = dVal.split('/');
                    if (parts.length === 3) {
                      const d = parseInt(parts[0], 10);
                      const m = parseInt(parts[1], 10) - 1;
                      const y = parseInt(parts[2], 10);
                      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                        const dt = new Date(y, m, d);
                        dt.setMonth(dt.getMonth() + parsedM);
                        setBillLastDate(dt.toLocaleDateString('en-GB'));
                      }
                    }
                  }}
                  className="w-32 border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-blue-900 text-center font-mono font-bold px-1 py-0.5 rounded outline-none text-xs transition-all"
                  placeholder="12/08/2026"
                />
              </div>
            </div>

            {/* Customer Declaration */}
            <div className="space-y-2 text-xs mb-4 leading-relaxed font-sans">
              <div className="flex flex-wrap items-center gap-1">
                <span>I the undersigned</span>
                <input
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="flex-1 min-w-[200px] border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded outline-none text-xs transition-all"
                  placeholder="Customer Name"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span>of</span>
                <input
                  type="text"
                  value={billAddress}
                  onChange={(e) => setBillAddress(e.target.value)}
                  className="flex-1 min-w-[250px] border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-slate-900 font-medium px-2 py-0.5 rounded outline-none text-xs transition-all"
                  placeholder="Address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-1">
                  <span className="shrink-0">N.I.C. No.</span>
                  <input
                    type="text"
                    value={billNic}
                    onChange={(e) => setBillNic(e.target.value)}
                    className="w-full border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-blue-900 font-mono font-bold px-2 py-0.5 rounded outline-none text-xs transition-all"
                    placeholder="NIC Number"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="shrink-0">Phone No.</span>
                  <input
                    type="text"
                    value={billPhone}
                    onChange={(e) => setBillPhone(e.target.value)}
                    className="w-full border-b-2 border-blue-600 bg-blue-50/80 focus:bg-blue-100 text-slate-900 font-mono font-medium px-2 py-0.5 rounded outline-none text-xs transition-all"
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              <div className="pt-1">
                being the lawful owner of the articles mentioned below has sold out right for
              </div>
              <div className="flex items-center gap-1 font-bold">
                <span>Rs.</span>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-44 border-b-2 border-emerald-600 bg-emerald-50/80 focus:bg-emerald-100 text-emerald-900 font-mono font-black text-sm px-2 py-0.5 rounded outline-none transition-all"
                  placeholder="Loan Capital Amount"
                />
              </div>
            </div>

            {/* Collateral Articles Table & Weight */}
            <div className="border-2 border-slate-300 rounded-xl p-3 mb-4 bg-slate-50/80 font-sans text-xs">
              <div className="font-bold text-xs text-slate-600 uppercase tracking-wider mb-1">Articles Description:</div>
              <textarea
                rows={2}
                value={billDesc}
                onChange={(e) => setBillDesc(e.target.value)}
                className="w-full border-2 border-blue-500/40 bg-white text-slate-900 font-bold p-2 rounded-lg outline-none text-xs focus:border-blue-600 transition-all resize-none mb-2"
                placeholder="Collateral Item Description"
              />
              <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-2 text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="shrink-0">Appraised Valuation: Rs.</span>
                  <input
                    type="number"
                    value={billAppraised}
                    onChange={(e) => setBillAppraised(e.target.value)}
                    className="w-full border-b-2 border-amber-600 bg-amber-50/80 text-amber-900 font-mono font-bold px-2 py-0.5 rounded outline-none text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="shrink-0">Total Weight:</span>
                  <input
                    type="text"
                    value={billWeight}
                    onChange={(e) => setBillWeight(e.target.value)}
                    className="w-20 border-b-2 border-blue-600 bg-blue-50/80 text-slate-900 font-mono font-bold text-center px-1 py-0.5 rounded outline-none text-xs"
                  />
                  <span>g</span>
                </div>
              </div>
            </div>

            {/* Sinhala & Legal Terms */}
            <div className="text-[10px] text-slate-800 space-y-1 mb-4 leading-normal font-sans bg-slate-100 p-2 rounded-lg border border-slate-200">
              <p>I hold responsible and liable or any claims that may arise on the sale of the articles.</p>
              <p className="font-bold text-slate-900">මෙය මට කියවා තේරුම් කරදුන් පසු අත්සන් කළෙමි.</p>
              <p className="text-[9.5px]">රසිට්පතේ යට සඳහන් අවසාන දිනට ප්‍රථම නිදහස් කිරීම හෝ පොළී මුදල් ගෙවීම කළයුතුයි. එසේ නොවුනහොත් එදිනට පසු බඩු විකුණනු ලැබේ.</p>
            </div>

            {/* Amount Box, Last Date, Signature & Stamp Box */}
            <div className="grid grid-cols-12 gap-3 items-end mb-4 border-t-2 border-b-2 border-slate-300 py-3 font-sans">
              {/* Left: Boxed Amount & Last Date */}
              <div className="col-span-7 space-y-2">
                <div className="border-2 border-slate-900 rounded-xl p-2 text-center bg-slate-50 shadow-inner">
                  <span className="text-xs font-bold text-slate-600 block">Rs.</span>
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    Rs. {parseFloat(billAmount || '0').toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span className="shrink-0">අවසාන දිනය / Last Date &#125;</span>
                  <input
                    type="text"
                    value={billLastDate}
                    onChange={(e) => setBillLastDate(e.target.value)}
                    className="w-32 border-b-2 border-blue-600 bg-blue-50/80 text-slate-900 font-mono font-bold text-center px-1 py-0.5 rounded outline-none text-xs"
                  />
                </div>
                <div className="text-xs">
                  <span>ගනුදෙනු බාරගත් අයගේ අත්සන: </span>
                  <span className="border-b border-slate-800 font-semibold px-2">............................</span>
                </div>
                <div className="text-xs">
                  <span>නම: </span>
                  <span className="border-b border-slate-800 font-bold text-slate-900 px-2">{billName}</span>
                </div>
              </div>

              {/* Right: STAMP Box & Bill Number */}
              <div className="col-span-5 flex flex-col items-center justify-end text-center space-y-2">
                <div className="w-24 h-24 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 bg-slate-50">
                  STAMP
                </div>
                <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-900 font-mono">
                  <span>R No.</span>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-28 border-b-2 border-blue-800 bg-blue-50/80 text-blue-900 font-mono font-black text-center px-1 py-0.5 rounded outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Perforated Stub Line */}
            <div className="border-t-2 border-dashed border-slate-400 pt-3 flex justify-between items-center text-xs font-mono font-bold font-sans">
              <div className="flex items-center gap-1">
                <span>R No.</span>
                <span className="text-blue-900 font-black">{billNo}</span>
              </div>
              <div className="text-xs font-normal text-slate-600 font-sans">......................................... Signature</div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sub-Component: Official Pawn Redemption / Settlement Receipt Modal (Print & PDF Auto-Download)
function RedemptionReceiptModal({
  data,
  onClose,
  clientsList,
  clientsMap,
  branchesList,
  getBillNo,
  getClientNic,
  getCleanDescription
}: {
  data: any;
  onClose: () => void;
  clientsList?: any[];
  clientsMap?: Record<string, string>;
  branchesList?: any[];
  getBillNo: (p: any) => string;
  getClientNic: (p: any) => string;
  getCleanDescription: (p: any) => string;
}) {
  // Pre-compute all derived values (before any hooks)
  const resolvedData = data ? (() => {
    const { pawn, journalEntryId, days, insurance, principal, interest, settlement, redeemedAt } = data;
    const billNo = pawn ? getBillNo(pawn) : 'RED-001';
    const pCidStr = String(pawn?.client_id || '').toLowerCase().trim();
    const clientObj = clientsList?.find((c: any) => {
      const cId  = String(c.id || '').toLowerCase().trim();
      const cNic = String(c.nationalId || c.national_id || c.nic || '').toLowerCase().trim();
      return (cId && cId === pCidStr) || (cNic && cNic === pCidStr);
    });
    const cName = pawn?.client_name || pawn?.customerName || (pCidStr && clientsMap?.[pCidStr]) || (clientObj ? `${clientObj.firstName || ''} ${clientObj.lastName || ''}`.trim() : '') || 'S. A. Perera';
    const cAddress = pawn?.client_address || clientObj?.address || 'Station Road, Dehiwala';
    const cNic = pawn?.client_nic || clientObj?.nationalId || getClientNic(pawn) || '200125102002';
    const bAddress = getBranchAddress(pawn, branchesList);
    return { pawn, journalEntryId, days, insurance, principal, interest, settlement, redeemedAt, billNo, cName, cAddress, cNic, bAddress };
  })() : null;

  // Auto-trigger print when receipt first appears
  const [hasAutoPrintedReceipt, setHasAutoPrintedReceipt] = useState(false);

  useEffect(() => {
    if (data && !hasAutoPrintedReceipt && resolvedData) {
      const timer = setTimeout(() => {
        setHasAutoPrintedReceipt(true);
        // Inline print to avoid calling handlePrint before it's defined
        const { billNo, cName, cNic, cAddress, bAddress, journalEntryId, days, insurance, principal, interest, settlement, redeemedAt } = resolvedData;
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (printWindow) {
          printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Pawn Redemption Receipt - ${billNo}</title><style>@media print{@page{size:A4 portrait;margin:15mm}body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}.no-print{display:none!important}</style></head><body><div style="max-width:650px;margin:0 auto;padding:28px;border:2px solid #6b21a8;border-radius:16px;font-family:sans-serif;color:#0f172a"><div style="text-align:center;border-bottom:2px solid #6b21a8;padding-bottom:12px;margin-bottom:16px"><div style="font-size:11px;font-weight:900;color:#6b21a8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">OFFICIAL PAWN REDEMPTION RECEIPT</div><h2 style="font-size:22px;font-weight:900;text-transform:uppercase;color:#581c87;margin:0">RUPASINGHE TRUST INVESTMENTS LTD.</h2><p style="font-size:11px;color:#475569;margin-top:4px">${bAddress}</p></div><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:16px;background:#faf5ff;padding:10px 14px;border-radius:10px;border:1px solid #e9d5ff"><div>Pawn Bill No: <span style="font-family:monospace;color:#6b21a8;font-weight:900">${billNo}</span></div><div>Date: <span style="font-family:monospace">${redeemedAt}</span></div></div><div style="border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;line-height:1.6"><div><strong>Customer:</strong> ${cName}</div><div><strong>NIC:</strong> ${cNic}</div><div><strong>Address:</strong> ${cAddress}</div></div><table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px"><thead><tr style="background:#f3e8ff;color:#581c87"><th style="padding:10px;border:1px solid #e9d5ff;text-align:left">Description</th><th style="padding:10px;border:1px solid #e9d5ff;text-align:right">Amount (LKR)</th></tr></thead><tbody><tr><td style="padding:10px;border:1px solid #e2e8f0">Principal (මූලික ණය)</td><td style="padding:10px;border:1px solid #e2e8f0;font-family:monospace;text-align:right">Rs. ${principal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr><tr><td style="padding:10px;border:1px solid #e2e8f0">Interest - ${days} Days (පොලී)</td><td style="padding:10px;border:1px solid #e2e8f0;font-family:monospace;text-align:right">Rs. ${interest.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr><tr><td style="padding:10px;border:1px solid #e2e8f0">Insurance &amp; Charges (රක්ෂණ)</td><td style="padding:10px;border:1px solid #e2e8f0;font-family:monospace;text-align:right">Rs. ${parseFloat(insurance||'0').toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr><tr style="background:#581c87;color:white"><td style="padding:12px;font-weight:900;text-transform:uppercase">Total Settlement (මුළු ගෙවූ)</td><td style="padding:12px;font-family:monospace;font-weight:900;font-size:16px;text-align:right">Rs. ${settlement.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr></tbody></table><div style="font-size:10px;color:#64748b;margin-bottom:24px">GL Entry: ${journalEntryId||'N/A'}</div><div style="display:flex;justify-content:space-between;margin-top:30px"><div style="text-align:center;font-size:11px"><div style="width:140px;border-bottom:1px solid #0f172a;margin-bottom:4px"></div><span>Customer Signature</span></div><div style="text-align:center;font-size:11px"><div style="width:140px;border-bottom:1px solid #0f172a;margin-bottom:4px"></div><span>Cashier Signature</span></div></div></div><script>setTimeout(()=>{window.print();},500);</script></body></html>`);
          printWindow.document.close();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [data, hasAutoPrintedReceipt]);

  if (!data) return null;

  const { pawn, journalEntryId, days, insurance, principal, interest, settlement, redeemedAt } = resolvedData!;
  const { billNo, cName, cAddress, cNic, bAddress } = resolvedData!;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Pawn Redemption Receipt - ${billNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          }
          body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; background: white; color: #0f172a; }
        </style>
      </head>
      <body>
        <div style="max-width: 650px; margin: 0 auto; background: white; color: #0f172a; padding: 28px; border: 2px solid #6b21a8; border-radius: 16px;">
          <div style="text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 900; color: #6b21a8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">OFFICIAL PAWN REDEMPTION RECEIPT</div>
            <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; color: #581c87; margin: 0;">RUPASINGHE TRUST INVESTMENTS LTD.</h2>
            <p style="font-size: 13px; font-weight: 700; color: #6b21a8; margin: 2px 0 0 0;">උගස් නිදහස් කිරීමේ රසීද පත්‍රය</p>
            <p style="font-size: 11px; color: #475569; margin-top: 4px;">${bAddress}</p>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 16px; background: #faf5ff; padding: 10px 14px; border-radius: 10px; border: 1px solid #e9d5ff;">
            <div><span>Pawn Bill No: </span> <span style="font-family: monospace; color: #6b21a8; font-weight: 900;">${billNo}</span></div>
            <div><span>Redemption Date: </span> <span style="font-family: monospace; color: #0f172a;">${redeemedAt}</span></div>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 12px; line-height: 1.6;">
            <div><strong>Customer Name (නම):</strong> ${cName}</div>
            <div><strong>NIC No (හැඳුනුම්පත් අංකය):</strong> ${cNic}</div>
            <div><strong>Address (ලිපිනය):</strong> ${cAddress}</div>
            <div><strong>Item Description (උගස් භාණ්ඩය):</strong> ${getCleanDescription(pawn)}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background: #f3e8ff; color: #581c87; text-align: left;">
                <th style="padding: 10px; border: 1px solid #e9d5ff;">Payment Description</th>
                <th style="padding: 10px; border: 1px solid #e9d5ff; text-align: right;">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Principal Loan Amount Disbursed (මූලික ණය මුදල)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Accrued Interest (${days} Days) (පොලී මුදල)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Insurance & Service Charges (රක්ෂණ / සේවා ගාස්තු)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${parseFloat(insurance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background: #581c87; color: white;">
                <td style="padding: 12px; font-weight: 900; font-size: 14px; text-transform: uppercase;">Total Settlement Amount Paid (මුළු ගෙවූ මුදල)</td>
                <td style="padding: 12px; font-family: monospace; font-weight: 900; font-size: 16px; text-align: right;">Rs. ${settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 10px; color: #64748b; margin-bottom: 24px; font-style: italic;">
            Posted GL Journal Entry: <span style="font-family: monospace; font-weight: bold; color: #475569;">${journalEntryId || 'N/A'}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
            <div style="text-align: center; font-size: 11px;">
              <div style="width: 140px; border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
              <span>Customer Signature / පාරිභෝගික අත්සන</span>
            </div>
            <div style="text-align: center; font-size: 11px;">
              <div style="width: 140px; border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
              <span>Cashier / Authorized Signature</span>
            </div>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 600);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPdf = () => {
    // Open print-ready popup so user can Save as PDF
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      toast.error('Popup blocked. Please allow popups and try again.');
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Pawn Redemption Receipt - ${billNo}</title>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
            .no-print { display: none !important; }
          }
          body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; background: white; color: #0f172a; }
          .save-btn { position: fixed; top: 12px; right: 12px; background: #6b21a8; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 900; cursor: pointer; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
          .save-btn:hover { background: #7c3aed; }
        </style>
      </head>
      <body>
        <button class="save-btn no-print" onclick="window.print()">⬇ Save as PDF / Print</button>
        <div style="max-width: 650px; margin: 0 auto; background: white; color: #0f172a; padding: 28px; border: 2px solid #6b21a8; border-radius: 16px;">
          <div style="text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 900; color: #6b21a8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">OFFICIAL PAWN REDEMPTION RECEIPT</div>
            <h2 style="font-size: 22px; font-weight: 900; text-transform: uppercase; color: #581c87; margin: 0;">RUPASINGHE TRUST INVESTMENTS LTD.</h2>
            <p style="font-size: 13px; font-weight: 700; color: #6b21a8; margin: 2px 0 0 0;">උගස් නිදහස් කිරීමේ රසීද පත්‍රය</p>
            <p style="font-size: 11px; color: #475569; margin-top: 4px;">${bAddress}</p>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 16px; background: #faf5ff; padding: 10px 14px; border-radius: 10px; border: 1px solid #e9d5ff;">
            <div><span>Pawn Bill No: </span> <span style="font-family: monospace; color: #6b21a8; font-weight: 900;">${billNo}</span></div>
            <div><span>Redemption Date: </span> <span style="font-family: monospace; color: #0f172a;">${redeemedAt}</span></div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 12px; line-height: 1.6;">
            <div><strong>Customer Name (නම):</strong> ${cName}</div>
            <div><strong>NIC No (හැඳුනුම්පත් අංකය):</strong> ${cNic}</div>
            <div><strong>Address (ලිපිනය):</strong> ${cAddress}</div>
            <div><strong>Item Description (උගස් භාණ්ඩය):</strong> ${getCleanDescription(pawn)}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background: #f3e8ff; color: #581c87; text-align: left;">
                <th style="padding: 10px; border: 1px solid #e9d5ff;">Payment Description</th>
                <th style="padding: 10px; border: 1px solid #e9d5ff; text-align: right;">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Principal Loan Amount Disbursed (මූලික ණය මුදල)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Accrued Interest (${days} Days) (පොලී මුදල)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Insurance &amp; Service Charges (රක්ෂණ / සේවා ගාස්තු)</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right;">Rs. ${parseFloat(insurance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style="background: #581c87; color: white;">
                <td style="padding: 12px; font-weight: 900; font-size: 14px; text-transform: uppercase;">Total Settlement Amount Paid (මුළු ගෙවූ මුදල)</td>
                <td style="padding: 12px; font-family: monospace; font-weight: 900; font-size: 16px; text-align: right;">Rs. ${settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 24px; font-style: italic;">
            Posted GL Journal Entry: <span style="font-family: monospace; font-weight: bold; color: #475569;">${journalEntryId || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
            <div style="text-align: center; font-size: 11px;">
              <div style="width: 140px; border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
              <span>Customer Signature / පාරිභෝගික අත්සන</span>
            </div>
            <div style="text-align: center; font-size: 11px;">
              <div style="width: 140px; border-bottom: 1px solid #0f172a; margin-bottom: 4px;"></div>
              <span>Cashier / Authorized Signature</span>
            </div>
          </div>
        </div>
        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body>
      </html>
    `);
    printWin.document.close();
    toast.success('Print dialog opened — select "Save as PDF" to download.');
  };



  return (
    <Dialog open={!!data} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-w-2xl w-[95vw] border border-purple-200 shadow-2xl rounded-3xl p-6 bg-white text-slate-900">
        <DialogHeader className="border-b border-purple-100 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-purple-700">
              <Coins className="w-6 h-6" />
              <DialogTitle className="text-xl font-black tracking-tight text-purple-900">
                Pawn Redemption Receipt / උගස් නිදහස් කිරීමේ රසීද පත්‍රය
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPdf}
                type="button"
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button
                onClick={handlePrint}
                type="button"
                className="bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Redemption Bill
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Receipt Display Content */}
        <div className="py-4 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-purple-900 border-b border-purple-200 pb-2">
              <span>Pawn Bill No: <strong className="font-mono text-purple-700 text-sm">{billNo}</strong></span>
              <span>Redemption Date: <strong className="font-mono">{redeemedAt}</strong></span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Customer Name</span>
                <span className="font-black text-slate-900">{cName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">NIC Number</span>
                <span className="font-mono font-bold text-slate-900">{cNic}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Item Description</span>
                <span className="font-bold text-slate-800">{getCleanDescription(pawn)}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-purple-100/60 text-purple-900 font-black uppercase text-[10px]">
                <tr>
                  <th className="p-3 text-left">Payment Breakdown</th>
                  <th className="p-3 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                <tr>
                  <td className="p-3 text-slate-700">Principal Disbursed Amount (මූලික ණය මුදල)</td>
                  <td className="p-3 text-right font-mono text-slate-900">Rs. {principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-700">Accrued Interest ({days} Days) (පොලී මුදල)</td>
                  <td className="p-3 text-right font-mono text-purple-700">Rs. {interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-700">Insurance & Service Fee (රක්ෂණ / සේවා ගාස්තු)</td>
                  <td className="p-3 text-right font-mono text-slate-900">Rs. {parseFloat(insurance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-purple-900 text-white font-black text-sm">
                  <td className="p-3.5 uppercase tracking-wider">Total Settlement Paid (මුළු ගෙවූ මුදල)</td>
                  <td className="p-3.5 text-right font-mono tracking-tight">Rs. {settlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
