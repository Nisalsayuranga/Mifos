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
  CheckCircle,
  X,
  FileSpreadsheet,
  Printer
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
  { code: 'PP', name: 'Pendant (PP)' },
  { code: 'PR', name: 'Ring (PR)' },
  { code: 'NL', name: 'Necklace (NL)' },
  { code: 'EAR', name: 'Earring (EAR)' },
  { code: 'BRC', name: 'Bracelet (BRC)' },
  { code: 'BPR', name: 'Baby Ring (BPR)' },
  { code: 'PB', name: 'Bangle (PB)' },
  { code: 'CR', name: 'Carved Ring (CR)' },
  { code: 'WJ', name: 'Wire Gyspy (WJ)' },
  { code: 'BJ', name: 'Ball Gyspy (BJ)' },
  { code: 'ANK', name: 'Anklets (ANK)' },
  { code: 'CH', name: 'Chain (CH)' },
  { code: 'DCH', name: 'Diamond Chain (DCH)' },
  { code: 'SPCH', name: 'Singapore Chain (SPCH)' },
  { code: 'VCH', name: 'V Chain (VCH)' },
  { code: 'BKT', name: 'Biscuit (BKT)' },
  { code: 'COIN', name: 'Coin (COIN)' },
  { code: 'NA', name: 'Not Applicable (NA)' },
  { code: 'TS', name: 'Tassel (TS)' },
  { code: 'SPJ', name: 'Spring Gyspy (SPJ)' }
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
  const [isEditingWithdrawal, setIsEditingWithdrawal] = useState(false);
  const [selectedItemForWithdrawal, setSelectedItemForWithdrawal] = useState<any | null>(null);

  // Form State - Add Stock Item
  const [billNo, setBillNo] = useState("");
  const [billPrefix, setBillPrefix] = useState<string | null>(null);
  const BILL_PREFIXES = ["1R", "12R", "3R", "6R", "A", "3M", "6M"];

  const handlePrefixClick = (prefix: string) => {
    if (billPrefix === prefix) {
      setBillPrefix(null);
    } else {
      setBillPrefix(prefix);
    }
  };
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string, code: string }>>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectCode = (code: string) => {
    setSelectedItems([
      ...selectedItems,
      { id: Math.random().toString(36).substring(2, 9), code }
    ]);
    setItemSearch("");
    setIsDropdownOpen(false);
  };

  const handleRemoveItem = (idToRemove: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== idToRemove));
  };


  // Form State - Withdrawal
  const [withdrawalDate, setWithdrawalDate] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("Pawn Redeemed (Closed)");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedAddBranch, setSelectedAddBranch] = useState("");

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        if (u.role !== 'ADMIN') {
          setSelectedBranch(u.branchId || "HQ");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch branches from Supabase
  const loadBranches = async () => {
    try {
      const { data, error } = await supabase.from('branches').select('*').eq('is_active', true);
      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([
        { id: 'BRL', name: 'Borella' },
        { id: 'DHW', name: 'Dehiwala' },
        { id: 'DMT', name: 'Dematagoda' },
        { id: 'HMG', name: 'Homagama' },
        { id: 'KDW', name: 'Kadawatha' },
        { id: 'KIR', name: 'Kiribathgoda' },
        { id: 'KOT', name: 'Kotikawatta' },
        { id: 'KTW', name: 'Kottawa' },
        { id: 'MRG', name: 'Maharagama' },
        { id: 'PND', name: 'Panadura' },
        { id: 'WAT', name: 'Wattala' },
        { id: 'HQ',  name: 'Head Office' }
      ]);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // Sync selectedAddBranch with selectedBranch when modal opens
  useEffect(() => {
    if (showAddModal) {
      if (selectedBranch && selectedBranch !== 'ALL') {
        setSelectedAddBranch(selectedBranch);
      } else if (currentUser && currentUser.role !== 'ADMIN') {
        setSelectedAddBranch(currentUser.branchId || "HQ");
      } else {
        setSelectedAddBranch("");
      }
    }
  }, [showAddModal]);

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
      // Determine the active branch filter
      let activeBranch = selectedBranch;
      if (!activeBranch && currentUser) {
        activeBranch = currentUser.role === 'ADMIN' ? 'ALL' : (currentUser.branchId || 'HQ');
      }

      let query = supabase.from('stock_items').select('*');
      if (activeBranch && activeBranch !== 'ALL') {
        query = query.eq('branch_id', activeBranch);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setStockItems(data || []);
      setIsUsingSupabase(true);
    } catch (err: any) {
      console.warn("Supabase fetch failed, falling back to LocalStorage:", err.message);
      setIsUsingSupabase(false);
      const localData = localStorage.getItem('local_stock_items');
      if (localData) {
        try {
          const allItems = JSON.parse(localData);
          let activeBranch = selectedBranch;
          if (!activeBranch && currentUser) {
            activeBranch = currentUser.role === 'ADMIN' ? 'ALL' : (currentUser.branchId || 'HQ');
          }
          const filtered = activeBranch && activeBranch !== 'ALL'
            ? allItems.filter((item: any) => item.branch_id === activeBranch)
            : allItems;
          setStockItems(filtered);
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

  // Load stock when tab or branch changes
  useEffect(() => {
    if (activeTab === 'stock') {
      loadStockData();
    }
  }, [activeTab, selectedBranch, currentUser]);

  // Handle Add Item
  const handleAddStock = async () => {
    console.log("[DEBUG] handleAddStock initiated. Current state:", {
      currentUser,
      selectedAddBranch,
      billNo,
      price,
      weight,
      date,
      selectedItems,
      billPrefix
    });

    const targetBranch = currentUser?.role === 'ADMIN' ? selectedAddBranch : (currentUser?.branchId || 'HQ');
    console.log("[DEBUG] resolved targetBranch:", targetBranch);
    if (!targetBranch) {
      console.warn("[DEBUG] Validation failed: targetBranch is empty.");
      toast.error("Please select a branch.");
      return;
    }

    if (!billNo || !price || !weight || !date) {
      console.warn("[DEBUG] Validation failed: one or more required fields are empty.", { billNo, price, weight, date });
      toast.error("Please fill in all fields.");
      return;
    }

    if (selectedItems.length === 0) {
      console.warn("[DEBUG] Validation failed: selectedItems list is empty.");
      toast.error("Please select at least one gold item type.");
      return;
    }

    const finalBillNo = billPrefix ? `${billPrefix} ${billNo.trim()}` : billNo.trim();
    console.log("[DEBUG] generated finalBillNo:", finalBillNo);

    const newItem = {
      bill_no: finalBillNo,
      price: parseFloat(price) || 0,
      weight: parseFloat(weight) || 0,
      date: date,
      item_type: selectedItems.map(item => item.code).join(", "),
      status: 'Active',
      branch_id: targetBranch
    };
    console.log("[DEBUG] newItem payload to insert:", newItem);

    try {
      if (isUsingSupabase) {
        console.log("[DEBUG] Attempting Supabase insert...");
        const { data, error } = await supabase
          .from('stock_items')
          .insert([newItem])
          .select();
        
        if (error) {
          console.error("[DEBUG] Supabase insert error:", error);
          throw error;
        }
        console.log("[DEBUG] Supabase insert successful. Returned data:", data);
        toast.success("Stock item added to Supabase!");
      } else {
        console.log("[DEBUG] Supabase offline, using LocalStorage fallback...");
        // LocalStorage fallback
        const localItem = {
          ...newItem,
          id: Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString()
        };
        const localData = localStorage.getItem('local_stock_items');
        let allItems = [];
        if (localData) {
          try {
            allItems = JSON.parse(localData);
          } catch (e) {}
        }
        const updated = [localItem, ...allItems];
        localStorage.setItem('local_stock_items', JSON.stringify(updated));
        console.log("[DEBUG] LocalStorage insert successful.");
        toast.success("Stock item added (Local Storage)!");
      }

      // Reset Form fields
      console.log("[DEBUG] Resetting form fields...");
      setBillNo("");
      setBillPrefix(null);
      setPrice("");
      setWeight("");
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedItems([]);
      setSelectedAddBranch(selectedBranch !== 'ALL' ? selectedBranch : "");
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
    setIsEditingWithdrawal(false);
    setShowWithdrawModal(true);
  };

  // Open edit withdrawal dialog
  const openEditWithdrawalModal = (item: any) => {
    setSelectedItemForWithdrawal(item);
    setWithdrawalDate(item.withdrawal_date || new Date().toISOString().split('T')[0]);
    setWithdrawalReason(item.withdrawal_reason || "Pawn Redeemed (Closed)");
    setWithdrawalNotes(item.withdrawal_notes || "");
    setIsEditingWithdrawal(true);
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
        toast.success(isEditingWithdrawal ? "Withdrawal details updated in Supabase!" : "Item marked as Withdrawn in Supabase!");
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
        toast.success(isEditingWithdrawal ? "Withdrawal details updated (Local Storage)!" : "Item marked as Withdrawn (Local Storage)!");
      }

      setWithdrawalNotes("");
      setSelectedItemForWithdrawal(null);
      setShowWithdrawModal(false);
      setIsEditingWithdrawal(false);
      
      // Reload
      loadStockData();
    } catch (err: any) {
      toast.error("Error saving withdrawal: " + err.message);
    }
  };

  const getItemName = (code: string) => {
    if (code === 'BLCT') return 'Biscuit (BKT)'; // Backward compatibility
    const found = ITEM_TYPES.find(item => item.code === code);
    return found ? found.name : code;
  };

  const handleExportExcel = () => {
    const headers = ["Bill No", "Branch", "Item Categories", "Item Names", "Weight (g)", "Appraised Value (Rs.)", "Date", "Status"];
    const rows = filteredStock.map(item => [
      item.bill_no,
      item.branch_id || 'HQ',
      item.item_type || '',
      (item.item_type || "").split(",").map((c: string) => getItemName(c.trim())).join(" + "),
      parseFloat(item.weight).toFixed(3),
      parseFloat(item.price || 0).toFixed(2),
      item.date,
      item.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Vault_Stock_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel CSV file downloaded successfully!");
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')!;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const activeBranchName = branches.find(b => b.id === selectedBranch)?.name || (selectedBranch === 'ALL' ? 'All Branches' : selectedBranch);

    const totalCount = filteredStock.length;
    const totalWeight = filteredStock.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalValue = filteredStock.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    const tableRowsHtml = filteredStock.map((item, index) => {
      const itemsList = (item.item_type || "").split(",").map((c: string) => c.trim()).filter(Boolean);
      const badgesHtml = itemsList.map((code: string) => 
        `<span style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:800; text-transform:uppercase; margin-right:4px; display:inline-block;">${code}</span>`
      ).join('');
      const namesJoined = itemsList.map((code: string) => getItemName(code)).join(" + ");

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 10px 12px; font-weight: 800; color: #0f172a;">${item.bill_no}</td>
          <td style="padding: 10px 12px; font-weight: bold; color: #475569;">${item.branch_id || 'HQ'}</td>
          <td style="padding: 10px 12px; font-weight: bold; color: #334155; font-size: 11px;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
              ${badgesHtml}
              <span style="font-weight: 700; color: #1e293b; margin-left: 2px;">${namesJoined}</span>
            </div>
          </td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; color: #475569;">${parseFloat(item.weight).toFixed(3)} g</td>
          <td style="padding: 10px 12px; font-weight: 800; text-align: right; color: #0f172a;">Rs. ${(parseFloat(item.price) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding: 10px 12px; font-weight: bold; color: #64748b; font-size: 11px;">${new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td style="padding: 10px 12px;">
            <span style="background: ${item.status === 'Active' ? '#ecfdf5' : '#fef2f2'}; color: ${item.status === 'Active' ? '#065f46' : '#991b1b'}; border: 1px solid ${item.status === 'Active' ? '#a7f3d0' : '#fecaca'}; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; text-transform: uppercase;">
              ${item.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Vault Stock Report - ${dateStr}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: -0.05em; color: #0f172a; margin: 0; }
            .subtitle { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px; }
            .meta-info { font-size: 12px; color: #475569; text-align: right; line-height: 1.6; }
            .stats-container { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; border-radius: 12px; }
            .stat-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .stat-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; color: #475569; padding: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #cbd5e1; }
            td { font-size: 12px; }
            .total-row { border-top: 2px solid #94a3b8; background: #f8fafc !important; font-weight: 900; }
            .total-cell { padding: 12px; font-size: 13px; color: #0f172a; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">RUPASINGHE PAWNING</h1>
              <div class="subtitle">Vault Inventory Stock Report</div>
            </div>
            <div class="meta-info">
              <div><strong>Branch Filter:</strong> ${activeBranchName}</div>
              <div><strong>Report Status:</strong> ${stockFilter} Vault Items</div>
              <div><strong>Generated:</strong> ${dateStr}</div>
            </div>
          </div>

          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">Total Vault Items</div>
              <div class="stat-value">${totalCount} Items</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cumulative Weight</div>
              <div class="stat-value">${totalWeight.toFixed(3)} g</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cumulative Value</div>
              <div class="stat-value">Rs. ${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Bill No</th>
                <th style="text-align: left;">Branch</th>
                <th style="text-align: left;">Item categories & Names</th>
                <th style="text-align: right;">Gross Weight</th>
                <th style="text-align: right;">Appraised Value</th>
                <th style="text-align: left;">Pawning Date</th>
                <th style="text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              <tr class="total-row">
                <td colspan="3" class="total-cell" style="text-align: right; font-weight: 900;">REPORT SUMMARY TOTALS:</td>
                <td class="total-cell" style="text-align: right; font-weight: 900;">${totalWeight.toFixed(3)} g</td>
                <td class="total-cell" style="text-align: right; font-weight: 900;">Rs. ${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td colspan="2" class="total-cell"></td>
              </tr>
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    <div className="space-y-6 w-full max-w-[96%] xl:max-w-[1400px] mx-auto pb-20">
      
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

            {/* Branch Selector for Admin */}
            {currentUser?.role === 'ADMIN' && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Branch:</span>
                <Select value={selectedBranch} onValueChange={(val) => val && setSelectedBranch(val)}>
                  <SelectTrigger className="h-8 w-44 bg-white border-slate-200 rounded-lg font-bold text-xs shadow-sm">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent className="glass max-h-48 overflow-y-auto">
                    <SelectItem value="ALL" className="font-semibold text-xs">All Branches</SelectItem>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id} className="font-semibold text-xs">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleExportExcel}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[9px] h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                </Button>
                
                <Button 
                  onClick={handleExportPDF}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[9px] h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Print PDF Report"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" /> Print
                </Button>

                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-9 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Add Stock Item
                </Button>
              </div>
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
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Bill No</TableHead>
                      {currentUser?.role === 'ADMIN' && (
                        <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Branch</TableHead>
                      )}
                      <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Item Name</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Weight (g)</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Appraised Value</TableHead>
                      <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Pawning Date</TableHead>
                      {stockFilter === 'Withdrawn' ? (
                        <>
                          <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Withdraw Date</TableHead>
                          <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 max-w-xs">Reason / Notes</TableHead>
                          <TableHead className="px-6 py-4 text-right" />
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
                        {currentUser?.role === 'ADMIN' && (
                          <TableCell className="px-6 py-4 font-bold text-slate-700 text-xs">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200/50 font-black px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide">
                              {item.branch_id || 'HQ'}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="px-6 py-4 font-bold text-slate-700 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(item.item_type || "").split(",").map((c: string) => c.trim()).filter(Boolean).map((code: string) => (
                              <span key={code} className="bg-slate-100 text-slate-800 border border-slate-200/50 font-black px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide">
                                {code}
                              </span>
                            ))}
                            <span className="text-slate-700 font-bold ml-1 whitespace-normal break-words">
                              {(item.item_type || "").split(",").map((c: string) => c.trim()).filter(Boolean).map((code: string) => getItemName(code)).join(" + ")}
                            </span>
                          </div>
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
                            <TableCell className="px-6 py-4 text-right">
                              <Button 
                                onClick={() => openEditWithdrawalModal(item)}
                                size="sm"
                                variant="outline"
                                className="border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[9px] uppercase tracking-widest h-8 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                Edit
                              </Button>
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          DIALOG MODALS
          ========================================== */}

      {/* MODAL: ADD STOCK ITEM */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[580px] glass p-0 rounded-[2rem] border-white/40 max-h-[90vh] flex flex-col overflow-hidden">
          <div className="h-2 bg-blue-600 shrink-0" />
          <div className="p-6 pb-2 shrink-0">
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
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
            <div className="grid gap-5 pb-4">
              
              {/* Branch Selection (Visible ONLY to Admin) */}
              {currentUser?.role === 'ADMIN' && (
                <div className="grid gap-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Target Branch Location</Label>
                  <Select onValueChange={(val) => val && setSelectedAddBranch(val)} value={selectedAddBranch}>
                    <SelectTrigger className="h-11 bg-white/50 border-slate-200 rounded-xl font-bold text-sm">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent className="glass max-h-48 overflow-y-auto">
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="font-semibold text-sm">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Bill Number */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Bill Number (Bill No)</Label>
                
                {/* Prefix selection buttons */}
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {BILL_PREFIXES.map(pref => {
                    const isSelected = billPrefix === pref;
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handlePrefixClick(pref)}
                        className={cn(
                          "px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all duration-150 active:scale-95 cursor-pointer",
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                        )}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  {billPrefix && (
                    <span className="absolute left-3 top-3 text-slate-400 font-black text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200/50 pointer-events-none select-none">
                      {billPrefix}
                    </span>
                  )}
                  <Input 
                    value={billNo} 
                    onChange={e => setBillNo(e.target.value)} 
                    placeholder="Enter bill number (e.g. 31582)" 
                    className={cn(
                      "h-11 border-slate-200 rounded-xl font-bold",
                      billPrefix ? (billPrefix.length > 2 ? "pl-16" : "pl-12") : ""
                    )}
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

              {/* Pawned Gold Item Categories (Multi-Select Tag Input) */}
              <div className="grid gap-2 relative">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Pawned Gold Item Categories</Label>
                
                {/* Search Input */}
                <div className="relative">
                  <Input 
                    type="text"
                    value={itemSearch} 
                    onChange={e => {
                      setItemSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setIsDropdownOpen(false)}
                    placeholder="Search and select gold items (e.g. Ring, Pendant)..." 
                    className="h-11 border-slate-200 rounded-xl font-bold pr-10 text-sm bg-white" 
                  />
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>

                {/* Dropdown */}
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
                      ).map(it => {
                        const isSelected = selectedItems.some(item => item.code === it.code);
                        return (
                          <button
                            key={it.code}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-semibold text-sm transition-colors flex items-center justify-between text-slate-700 cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectCode(it.code);
                            }}
                          >
                            <span>{it.name}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selected Tags Display */}
                {selectedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    {selectedItems.map(item => {
                      const found = ITEM_TYPES.find(it => it.code === item.code);
                      return (
                        <div 
                          key={item.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200/50 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <span>{found ? found.name : item.code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-0.5 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleAddStock} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-blue-600/10"
            >
              Insert to Vault
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: WITHDRAWAL / RELEASE */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-[450px] glass p-0 rounded-[2rem] border-white/40 max-h-[90vh] flex flex-col overflow-hidden">
          <div className="h-2 bg-rose-600 shrink-0" />
          <div className="p-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                {isEditingWithdrawal ? "Edit Withdrawal Details" : "Release Pawn Item"}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-sm">
                {isEditingWithdrawal 
                  ? "Modify the withdrawal date, reason, or comments recorded for this stock item." 
                  : "Record the withdrawal and closure of pawn gold assets from physical vault storage."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
            {selectedItemForWithdrawal && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
                <div>Bill No: <span className="text-slate-900 font-black">{selectedItemForWithdrawal.bill_no}</span></div>
                <div>Item: <span className="text-slate-900 font-black">{selectedItemForWithdrawal.item_type}</span></div>
                <div>Weight: <span className="text-slate-900 font-black">{parseFloat(selectedItemForWithdrawal.weight).toFixed(3)} g</span></div>
                <div>Value: <span className="text-slate-900 font-black">Rs. {selectedItemForWithdrawal.price.toLocaleString()}</span></div>
              </div>
            )}

            <div className="grid gap-5 pb-4">
              
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
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="rounded-xl font-bold">Cancel</Button>
             <Button 
              onClick={handleWithdrawStock} 
              className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-rose-600/10 cursor-pointer"
            >
              {isEditingWithdrawal ? "Save Changes" : "Release Gold Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
