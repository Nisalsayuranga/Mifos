'use client';

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  DivideCircle as Divider, 
  ShieldAlert,
  Package,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  History,
  Trash2,
  Loader2,
  Calendar,
  Layers,
  Scale,
  Coins,
  ArrowRightLeft,
  XCircle,
  FileText,
  Search,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Stock item abbreviations
const ITEM_TYPES = [
  { code: 'PP', name: 'Pendant / Pha (PP)' },
  { code: 'PR', name: 'Pendant Ring (PR)' },
  { code: 'NL', name: 'Necklace (NL)' },
  { code: 'EAR', name: 'Earring (EAR)' },
  { code: 'BRC', name: 'Bracelet (BRC)' },
  { code: 'BPR', name: 'Bracelet / Pendant Ring (BPR)' },
  { code: 'PB', name: 'Pubbar / Pin (PB)' },
  { code: 'CR', name: 'Chain Ring (CR)' },
  { code: 'WJ', name: 'Wedding Jewelry (WJ)' },
  { code: 'BJ', name: 'Baby Jewelry (BJ)' },
  { code: 'ANK', name: 'Anklet (ANK)' },
  { code: 'CH', name: 'Chain (CH)' },
  { code: 'DCH', name: 'Double Chain (DCH)' },
  { code: 'SPCH', name: 'Spiral Chain (SPCH)' },
  { code: 'VCH', name: 'V-Chain (VCH)' },
  { code: 'BLCT', name: 'Biscuit / Bar (BLCT)' },
  { code: 'COIN', name: 'Gold Coin (COIN)' },
  { code: 'NA', name: 'Naththa / Nose Ring (NA)' },
  { code: 'TS', name: 'Thali (TS)' }
];

export default function EndOfDayPage() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'stock'>('reconciliation');

  // ==========================================
  // TAB 1: Reconciliation State & Logic
  // ==========================================
  const [step, setStep] = useState(1);
  const [cashCount, setCashCount] = useState<any>({
    "5000": 0, "1000": 0, "500": 0, "100": 0, "50": 0, "20": 0
  });
  
  const systemExpected = 458900; 

  const calculateTotal = () => {
    return Object.entries(cashCount).reduce((sum, [denom, count]: any) => {
      return sum + (parseInt(denom) * (parseInt(count) || 0));
    }, 0);
  };

  const actualTotal = calculateTotal();
  const difference = actualTotal - systemExpected;
  const isBalanced = difference === 0;

  // ==========================================
  // TAB 2: Stock Management State & Logic
  // ==========================================
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);
  const [stockFilter, setStockFilter] = useState<'Active' | 'Withdrawn'>('Active');
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedItemForWithdrawal, setSelectedItemForWithdrawal] = useState<any | null>(null);

  // Form State - Add Stock Item
  const [billNo, setBillNo] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [itemType, setItemType] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!itemType) {
      setItemSearch("");
    } else {
      const found = ITEM_TYPES.find(it => it.code === itemType);
      if (found) {
        setItemSearch(found.name);
      }
    }
  }, [itemType]);


  // Form State - Withdrawal
  const [withdrawalDate, setWithdrawalDate] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("Pawn Redeemed (Closed)");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  // Default dates to today on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setWithdrawalDate(today);
  }, []);

  // Fetch Stock items
  const loadStockData = async () => {
    setLoadingStock(true);
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStockItems(data || []);
      setIsUsingSupabase(true);
    } catch (err: any) {
      console.warn("Supabase fetch failed, falling back to LocalStorage:", err.message);
      setIsUsingSupabase(false);
      const localData = localStorage.getItem('local_stock_items');
      if (localData) {
        try {
          setStockItems(JSON.parse(localData));
        } catch (parseErr) {
          console.error("Error parsing local stock items", parseErr);
          setStockItems([]);
        }
      } else {
        setStockItems([]);
      }
    } finally {
      setLoadingStock(false);
    }
  };

  // Load stock when tab changes
  useEffect(() => {
    if (activeTab === 'stock') {
      loadStockData();
    }
  }, [activeTab]);

  // Handle Add Item
  const handleAddStock = async () => {
    if (!billNo || !price || !weight || !date || !itemType) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newItem = {
      bill_no: billNo,
      price: parseFloat(price) || 0,
      weight: parseFloat(weight) || 0,
      date: date,
      item_type: itemType,
      status: 'Active',
    };

    try {
      if (isUsingSupabase) {
        const { error } = await supabase
          .from('stock_items')
          .insert([newItem]);
        
        if (error) throw error;
        toast.success("Stock item added to Supabase!");
      } else {
        // LocalStorage fallback
        const localId = Math.random().toString(36).substring(2, 9);
        const localItem = {
          ...newItem,
          id: localId,
          created_at: new Date().toISOString()
        };
        const updated = [localItem, ...stockItems];
        setStockItems(updated);
        localStorage.setItem('local_stock_items', JSON.stringify(updated));
        toast.success("Stock item added (Local Storage)!");
      }

      // Reset Form fields
      setBillNo("");
      setPrice("");
      setWeight("");
      setDate(new Date().toISOString().split('T')[0]);
      setItemType("");
      setShowAddModal(false);
      
      // Reload
      loadStockData();
    } catch (err: any) {
      toast.error("Error adding stock item: " + err.message);
    }
  };

  // Open withdrawal dialog
  const openWithdrawModal = (item: any) => {
    setSelectedItemForWithdrawal(item);
    setWithdrawalDate(new Date().toISOString().split('T')[0]);
    setWithdrawalReason("Pawn Redeemed (Closed)");
    setWithdrawalNotes("");
    setShowWithdrawModal(true);
  };

  // Handle Withdrawal Submission
  const handleWithdrawStock = async () => {
    if (!selectedItemForWithdrawal) return;
    if (!withdrawalDate || !withdrawalReason) {
      toast.error("Please select a date and reason.");
      return;
    }

    const id = selectedItemForWithdrawal.id;

    try {
      if (isUsingSupabase) {
        const { error } = await supabase
          .from('stock_items')
          .update({
            status: 'Withdrawn',
            withdrawal_date: withdrawalDate,
            withdrawal_reason: withdrawalReason,
            withdrawal_notes: withdrawalNotes || ''
          })
          .eq('id', id);

        if (error) throw error;
        toast.success("Item marked as Withdrawn in Supabase!");
      } else {
        // LocalStorage fallback
        const updated = stockItems.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'Withdrawn',
              withdrawal_date: withdrawalDate,
              withdrawal_reason: withdrawalReason,
              withdrawal_notes: withdrawalNotes || ''
            };
          }
          return item;
        });
        setStockItems(updated);
        localStorage.setItem('local_stock_items', JSON.stringify(updated));
        toast.success("Item marked as Withdrawn (Local Storage)!");
      }

      setWithdrawalNotes("");
      setSelectedItemForWithdrawal(null);
      setShowWithdrawModal(false);
      
      // Reload
      loadStockData();
    } catch (err: any) {
      toast.error("Error recording withdrawal: " + err.message);
    }
  };

  const getItemName = (code: string) => {
    const found = ITEM_TYPES.find(item => item.code === code);
    return found ? found.name : code;
  };

  // Calculate statistics (active vault stock)
  const activeStockList = stockItems.filter(item => item.status === 'Active');
  const totalActiveCount = activeStockList.length;
  const totalActiveWeight = activeStockList.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
  const totalActiveValue = activeStockList.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  // Filter and search stock
  const filteredStock = stockItems.filter(item => {
    const matchesStatus = item.status === stockFilter;
    const matchesSearch = 
      item.bill_no.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.item_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getItemName(item.item_type).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">End of Day & Stock</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Perform daily reconciliation and manage pawning gold vault inventory.
          </p>
        </div>
        
        {/* Connection status badge */}
        {activeTab === 'stock' && (
          <Badge variant={isUsingSupabase ? "success" : "warning"} className="font-bold text-[10px] uppercase tracking-wider px-3 py-1">
            {isUsingSupabase ? "Connected to Supabase" : "Offline Mode (Local Cache)"}
          </Badge>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('reconciliation')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'reconciliation' ? "bg-white text-slate-900 shadow-md font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Daily Reconciliation
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'stock' ? "bg-white text-slate-900 shadow-md font-bold" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Pawn Stock Management
        </button>
      </div>

      {/* ==========================================
          RECONCILIATION TAB VIEW
          ========================================== */}
      {activeTab === 'reconciliation' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6 animate-in fade-in-50 duration-300">
            {/* Step 1: Physical Cash Count */}
            <div className={`bg-white rounded-xl border ${step === 1 ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-200 opacity-50'} overflow-hidden`}>
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4 items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                <div>
                  <h2 className="font-bold text-slate-800">Physical Vault Count</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Declare all physical denominations</p>
                </div>
              </div>
              
              {step === 1 && (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {[5000, 1000, 500, 100, 50, 20].map((denom) => (
                      <div key={denom} className="flex justify-between items-center gap-4">
                        <span className="font-black text-slate-700 w-16 text-right">Rs. {denom}</span>
                        <span className="text-slate-300 font-black">X</span>
                        <Input 
                          type="number" 
                          className="w-24 text-center font-bold" 
                          value={cashCount[denom]} 
                          onChange={e => setCashCount({...cashCount, [denom]: e.target.value})} 
                        />
                        <span className="font-black text-emerald-600 w-24 text-right">
                          = Rs. {(denom * (cashCount[denom] || 0)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Counted</p>
                      <p className="text-3xl font-black text-slate-900">Rs. {actualTotal.toLocaleString()}</p>
                    </div>
                    <Button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">Link to System Ledger</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: System Reconciliation */}
            <div className={`bg-white rounded-xl border ${step === 2 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-200 opacity-50'} overflow-hidden`}>
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4 items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                <div>
                  <h2 className="font-bold text-slate-800">System Reconciliation</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Match physical count with digital ledger</p>
                </div>
              </div>
              
              {step === 2 && (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Expected By Ledger</p>
                      <p className="text-2xl font-black text-slate-800">Rs. {systemExpected.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Physical Reality</p>
                      <p className="text-2xl font-black text-blue-600">Rs. {actualTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className={`mt-6 p-6 rounded-xl flex items-center gap-4 border ${isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {isBalanced ? <CheckCircle2 className="w-8 h-8"/> : <ShieldAlert className="w-8 h-8 text-rose-600" />}
                    <div>
                      <h3 className="font-black text-lg">{isBalanced ? "Perfectly Balanced Vault" : "Discrepancy Detected!"}</h3>
                      <p className="font-medium text-sm mt-1">
                        {isBalanced 
                          ? "Your physical cash matches the digital ledger identically." 
                          : `Variance of Rs. ${Math.abs(difference).toLocaleString()}. You must authorize an override to close the branch.`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)} className="font-bold">Back to Recount</Button>
                    <Button onClick={() => setStep(3)} className={`${isBalanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} font-bold px-8`}>
                      {isBalanced ? "Proceed to Lock" : "Force Override & Proceed"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Final Freeze */}
            <div className={`bg-white rounded-xl border ${step === 3 ? 'border-slate-800 shadow-xl shadow-slate-900/10' : 'border-slate-200 opacity-50'} overflow-hidden`}>
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4 items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                <div>
                  <h2 className="font-bold text-slate-800">Final System Freeze</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Irreversible daily closure</p>
                </div>
              </div>
              {step === 3 && (
                <div className="p-8 text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                    <Lock className="w-10 h-10 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Lock Branch Operations</h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">
                      Executing this command will forever archive today's ledger and prevent any further transactions until tomorrow.
                    </p>
                  </div>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 font-bold h-12 text-lg shadow-lg shadow-slate-900/20" onClick={() => alert('Branch successfully archived and closed for the day.')}>
                    AUTHORIZE END-OF-DAY ARCHIVE
                  </Button>
                  <Button variant="link" onClick={() => setStep(2)} className="font-bold text-slate-400">Cancel & Return</Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl shadow-slate-900/20">
              <h3 className="font-black text-lg mb-2">EOD Timeline</h3>
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex gap-4">
                  <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-400"/></div>
                  <div><p className="font-bold">Pending Transfers</p><p className="text-xs font-bold uppercase tracking-widest text-slate-400">All cleared</p></div>
                </div>
                <div className="flex gap-4 border-t border-slate-800 pt-4">
                  <div className="mt-1"><AlertCircle className="w-5 h-5 text-amber-400"/></div>
                  <div><p className="font-bold">Journal Balance</p><p className="text-xs text-amber-400 font-bold uppercase tracking-widest">Awaiting execution</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STOCK MANAGEMENT TAB VIEW
          ========================================== */}
      {activeTab === 'stock' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          
          {/* Inventory Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vault Stock Count</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalActiveCount} Items</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Currently stored in inventory</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Weight</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalActiveWeight.toFixed(3)} g</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Cumulative gold weight</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appraised Value</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">Rs. {totalActiveValue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Cumulative value of stock</p>
              </div>
            </div>
          </div>

          {/* Filtering, Search & Add Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Filter Toggle Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-fit shrink-0">
              <button 
                onClick={() => setStockFilter('Active')}
                className={cn(
                  "flex-1 md:flex-initial px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  stockFilter === 'Active' ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Active Vault Stock ({totalActiveCount})
              </button>
              <button 
                onClick={() => setStockFilter('Withdrawn')}
                className={cn(
                  "flex-1 md:flex-initial px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  stockFilter === 'Withdrawn' ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Withdrawn ({stockItems.filter(item => item.status === 'Withdrawn').length})
              </button>
            </div>

            {/* Search Input & Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by Bill No or Item Code..." 
                  className="pl-9 h-9 rounded-xl bg-slate-50 border-slate-200 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-9 px-6 rounded-xl w-full sm:w-auto shrink-0 shadow-lg shadow-blue-500/10 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Add Stock Item
              </Button>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
            {loadingStock ? (
              <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="font-bold text-xs uppercase tracking-widest">Fetching Vault Items...</span>
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">No stock items found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs font-semibold">
                    {searchQuery ? "No items matching your search query in this category." : "Add physical gold pawn items to display them in this ledger."}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Bill No</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Name</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Weight (g)</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Appraised Value</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Pawning Date</TableHead>
                    {stockFilter === 'Withdrawn' ? (
                      <>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Withdraw Date</TableHead>
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 max-w-xs">Reason / Notes</TableHead>
                      </>
                    ) : (
                      <TableHead className="px-6 py-4 text-right" />
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredStock.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-4 font-black text-slate-800 text-sm">
                        {item.bill_no}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-slate-700 text-xs">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200/50 font-black px-2 py-0.5 rounded-md text-[9px] uppercase mr-2 tracking-wide">
                          {item.item_type}
                        </span>
                        {getItemName(item.item_type)}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-slate-600 text-sm">
                        {parseFloat(item.weight).toFixed(3)} g
                      </TableCell>
                      <TableCell className="px-6 py-4 font-black text-slate-800 text-sm text-right text-gradient">
                        Rs. {(parseFloat(item.price) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                        {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      {item.status === 'Withdrawn' ? (
                        <>
                          <TableCell className="px-6 py-4 font-bold text-rose-600 text-xs uppercase tracking-wider">
                            {new Date(item.withdrawal_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="px-6 py-4 max-w-xs">
                            <p className="text-xs font-black text-rose-800 uppercase tracking-widest">{item.withdrawal_reason}</p>
                            {item.withdrawal_notes && (
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">{item.withdrawal_notes}</p>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="px-6 py-4 text-right">
                          <Button 
                            onClick={() => openWithdrawModal(item)}
                            size="sm"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 font-black text-[9px] uppercase tracking-widest h-8 px-4 rounded-xl transition-all"
                          >
                            Withdraw / Close
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          DIALOG MODALS
          ========================================== */}

      {/* MODAL: ADD STOCK ITEM */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[450px] glass p-0 overflow-hidden rounded-[2rem] border-white/40">
          <div className="h-2 bg-blue-600" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600">
                  <Package className="h-5 w-5" />
                </div>
                Add Vault Stock Item
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-sm">
                Declare a physical gold pawn asset and insert it into active vault stock logs.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              
              {/* Item Type (Searchable Combobox) */}
              <div className="grid gap-2 relative">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pawned Gold Item Type</Label>
                <div className="relative">
                  <Input 
                    type="text"
                    value={itemSearch} 
                    onChange={e => {
                      setItemSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    placeholder="Type to search e.g. P..." 
                    className="h-11 border-slate-200 rounded-xl font-bold pr-10" 
                  />
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
                {isDropdownOpen && (
                  <div className="absolute left-0 top-[70px] z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto glass animate-in fade-in-50 slide-in-from-top-1 duration-150">
                    {ITEM_TYPES.filter(it => 
                      it.code.toLowerCase().includes(itemSearch.toLowerCase()) || 
                      it.name.toLowerCase().includes(itemSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="px-4 py-3 text-xs font-bold text-slate-400 text-center">No matching items</div>
                    ) : (
                      ITEM_TYPES.filter(it => 
                        it.code.toLowerCase().includes(itemSearch.toLowerCase()) || 
                        it.name.toLowerCase().includes(itemSearch.toLowerCase())
                      ).map(it => (
                        <button
                          key={it.code}
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-semibold text-sm transition-colors flex items-center justify-between text-slate-700"
                          onClick={() => {
                            setItemType(it.code);
                            setItemSearch(it.name);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span>{it.name}</span>
                          {itemType === it.code && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>


              {/* Bill Number */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Bill Number (Bill No)</Label>
                <Input 
                  value={billNo} 
                  onChange={e => setBillNo(e.target.value)} 
                  placeholder="E.g. BILL-90823" 
                  className="h-11 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* Price & Weight Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Appraised Value (Rs.)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    placeholder="125000" 
                    className="h-11 border-slate-200 rounded-xl font-bold" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Gross Weight (g)</Label>
                  <Input 
                    type="number"
                    step="0.001"
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    placeholder="8.500" 
                    className="h-11 border-slate-200 rounded-xl font-bold" 
                  />
                </div>
              </div>

              {/* Date */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pawning Date</Label>
                <Input 
                  type="date"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="h-11 border-slate-200 rounded-xl font-bold" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={handleAddStock} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-blue-600/10"
              >
                Insert to Vault
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: WITHDRAWAL / RELEASE */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-[450px] glass p-0 overflow-hidden rounded-[2rem] border-white/40">
          <div className="h-2 bg-rose-600" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                Release Pawn Item
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-sm">
                Record the withdrawal and closure of pawn gold assets from physical vault storage.
              </DialogDescription>
            </DialogHeader>

            {selectedItemForWithdrawal && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
                <div>Bill No: <span className="text-slate-900 font-black">{selectedItemForWithdrawal.bill_no}</span></div>
                <div>Item: <span className="text-slate-900 font-black">{selectedItemForWithdrawal.item_type}</span></div>
                <div>Weight: <span className="text-slate-900 font-black">{parseFloat(selectedItemForWithdrawal.weight).toFixed(3)} g</span></div>
                <div>Value: <span className="text-slate-900 font-black">Rs. {selectedItemForWithdrawal.price.toLocaleString()}</span></div>
              </div>
            )}

            <div className="grid gap-5">
              
              {/* Reason (Select Dropdown) */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Withdrawal Reason / Status</Label>
                <Select onValueChange={(val) => val && setWithdrawalReason(val)} value={withdrawalReason}>
                  <SelectTrigger className="h-11 bg-white/50 border-slate-200 rounded-xl font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Pawn Redeemed (Closed)" className="font-semibold text-sm">Pawn Redeemed (Closed)</SelectItem>
                    <SelectItem value="Pawn Auctioned" className="font-semibold text-sm">Pawn Auctioned</SelectItem>
                    <SelectItem value="Stock Adjustment" className="font-semibold text-sm">Stock Adjustment</SelectItem>
                    <SelectItem value="Other" className="font-semibold text-sm">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Withdrawal Date */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Withdrawal Date</Label>
                <Input 
                  type="date"
                  value={withdrawalDate} 
                  onChange={e => setWithdrawalDate(e.target.value)} 
                  className="h-11 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Logistics Notes / Comments</Label>
                <Input 
                  value={withdrawalNotes} 
                  onChange={e => setWithdrawalNotes(e.target.value)} 
                  placeholder="E.g. Closed ticket. Gold handed back to customer." 
                  className="h-11 border-slate-200 rounded-xl font-bold" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={handleWithdrawStock} 
                className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-rose-600/10"
              >
                Release Gold Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
