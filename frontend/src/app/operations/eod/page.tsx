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
  Printer,
  Building2,
  Users,
  UserPlus,
  Edit
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

// Helper to compress item type codes into short format (e.g., EAR, EAR, EAR -> EAR3, or PR, PR -> PR2)
const compressItemTypeString = (str: string): string => {
  if (!str) return "";
  const tokens = str.split(/[, ]+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) return "";

  const counts: { [code: string]: number } = {};
  const order: string[] = [];

  for (const token of tokens) {
    const match = token.match(/^([A-Za-z]+)(\d*)$/);
    if (match) {
      const baseCode = match[1].toUpperCase();
      const num = match[2] ? parseInt(match[2], 10) : 1;
      if (!counts[baseCode]) {
        counts[baseCode] = 0;
        order.push(baseCode);
      }
      counts[baseCode] += num;
    } else {
      const upperToken = token.toUpperCase();
      if (!counts[upperToken]) {
        counts[upperToken] = 0;
        order.push(upperToken);
      }
      counts[upperToken] += 1;
    }
  }

  return order.map(code => {
    const count = counts[code];
    return count > 1 ? `${code}${count}` : code;
  }).join(", ");
};

// Helper to expand compressed string (e.g. EAR3, PR2) into array of individual item objects
const expandItemTypeCodes = (str: string): Array<{ id: string, code: string }> => {
  if (!str) return [];
  const tokens = str.split(/[, ]+/).map(t => t.trim()).filter(Boolean);
  const result: Array<{ id: string, code: string }> = [];

  for (const token of tokens) {
    const match = token.match(/^([A-Za-z]+)(\d*)$/);
    if (match) {
      const baseCode = match[1].toUpperCase();
      const count = match[2] ? parseInt(match[2], 10) : 1;
      for (let i = 0; i < count; i++) {
        result.push({
          id: Math.random().toString(36).substring(2, 9),
          code: baseCode
        });
      }
    } else {
      result.push({
        id: Math.random().toString(36).substring(2, 9),
        code: token.toUpperCase()
      });
    }
  }

  return result;
};

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
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [selectedItemForWithdrawal, setSelectedItemForWithdrawal] = useState<any | null>(null);
  const [selectedActiveItem, setSelectedActiveItem] = useState<any | null>(null);

  // Stock Customers State
  const [stockCustomers, setStockCustomers] = useState<any[]>([]);
  const [showBillCustomerModal, setShowBillCustomerModal] = useState(false);
  const [selectedBillForCustomerView, setSelectedBillForCustomerView] = useState<string | null>(null);

  // Add Customer Form States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custAddress2, setCustAddress2] = useState("");
  const [custTp, setCustTp] = useState("");
  const [custNic, setCustNic] = useState("");
  const [custBills, setCustBills] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State - Add Stock Item
  const [billNo, setBillNo] = useState("");
  const [billPrefix, setBillPrefix] = useState<string | null>(null);
  const BILL_PREFIXES = ["A", "1R", "3M", "3R", "6R", "12R", "6M"];

  const parseBillNumber = (billNoStr: string) => {
    const str = (billNoStr || "").trim().toUpperCase();
    const sortedPrefixesByLength = [...BILL_PREFIXES].sort((a, b) => b.length - a.length);

    for (const pref of sortedPrefixesByLength) {
      if (str.startsWith(pref + " ") || str === pref || (str.startsWith(pref) && !/\D/.test(str.charAt(pref.length)))) {
        const rest = str.substring(pref.length).trim();
        const numPart = parseInt(rest.replace(/\D/g, ''), 10) || 0;
        const orderIdx = BILL_PREFIXES.indexOf(pref);
        return { orderIdx: orderIdx >= 0 ? orderIdx : 999, numPart, raw: str };
      }
    }

    const numPart = parseInt(str.replace(/\D/g, ''), 10) || 0;
    return { orderIdx: 999, numPart, raw: str };
  };

  const sortStockItems = (items: any[]) => {
    return [...(items || [])].sort((a, b) => {
      const infoA = parseBillNumber(a?.bill_no);
      const infoB = parseBillNumber(b?.bill_no);

      if (infoA.orderIdx !== infoB.orderIdx) {
        return infoA.orderIdx - infoB.orderIdx;
      }

      if (infoA.numPart !== infoB.numPart) {
        return infoA.numPart - infoB.numPart;
      }

      return infoA.raw.localeCompare(infoB.raw);
    });
  };

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
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectCode = (code: string) => {
    const newItems = [];
    for (let i = 0; i < itemQuantity; i++) {
      newItems.push({ id: Math.random().toString(36).substring(2, 9), code });
    }
    setSelectedItems([
      ...selectedItems,
      ...newItems
    ]);
    setItemSearch("");
    setIsDropdownOpen(false);
    setItemQuantity(1);
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
      // Ensure W2, W3, W4 exist in Supabase
      const newBranches = [
        { id: 'W2', name: 'Wattala 2', is_active: true },
        { id: 'W3', name: 'Wattala 3', is_active: true },
        { id: 'W4', name: 'Wattala 4', is_active: true }
      ];
      await supabase.from('branches').upsert(newBranches, { onConflict: 'id' });

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
        { id: 'PND', name: 'Panadura' },
        { id: 'W2',  name: 'Wattala 2' },
        { id: 'W3',  name: 'Wattala 3' },
        { id: 'W4',  name: 'Wattala 4' },
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
      if (searchQuery.trim()) {
        query = query.ilike('bill_no', `%${searchQuery.trim()}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setStockItems(sortStockItems(data || []));
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
          let filtered = activeBranch && activeBranch !== 'ALL'
            ? allItems.filter((item: any) => item.branch_id === activeBranch)
            : allItems;
          if (searchQuery.trim()) {
            filtered = filtered.filter((item: any) => 
              (item.bill_no || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          setStockItems(sortStockItems(filtered));
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

  const loadCustomerData = async () => {
    try {
      let activeBranch = selectedBranch;
      if (!activeBranch && currentUser) {
        activeBranch = currentUser.role === 'ADMIN' ? 'ALL' : (currentUser.branchId || 'HQ');
      }

      let query = supabase.from('stock_customers').select('*');
      if (activeBranch && activeBranch !== 'ALL') {
        query = query.eq('branch_id', activeBranch);
      }
      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setStockCustomers(data || []);
      setIsUsingSupabase(true);
    } catch (err) {
      console.warn("Failed to fetch stock customers from Supabase, loading LocalStorage:", err);
      setIsUsingSupabase(false);
      const local = localStorage.getItem('local_stock_customers');
      if (local) {
        try {
          const allItems = JSON.parse(local);
          let activeBranch = selectedBranch;
          if (!activeBranch && currentUser) {
            activeBranch = currentUser.role === 'ADMIN' ? 'ALL' : (currentUser.branchId || 'HQ');
          }
          const filtered = activeBranch && activeBranch !== 'ALL'
            ? allItems.filter((item: any) => item.branch_id === activeBranch)
            : allItems;
          setStockCustomers(filtered);
        } catch (e) {
          setStockCustomers([]);
        }
      } else {
        setStockCustomers([]);
      }
    }
  };

  // Load stock when tab, branch or search query changes
  useEffect(() => {
    if (activeTab === 'stock') {
      loadStockData();
    }
  }, [activeTab, selectedBranch, currentUser, searchQuery]);

  // Load customer registry only when tab or branch filter changes
  useEffect(() => {
    if (activeTab === 'stock') {
      loadCustomerData();
    }
  }, [activeTab, selectedBranch, currentUser]);

  const closeAddModal = () => {
    setBillNo("");
    setBillPrefix(null);
    setPrice("");
    setWeight("");
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedItems([]);
    setSelectedAddBranch(selectedBranch !== 'ALL' ? selectedBranch : "");
    setIsEditingActive(false);
    setSelectedActiveItem(null);
    setShowAddModal(false);
  };

  const openEditActiveModal = (item: any) => {
    setSelectedActiveItem(item);
    
    // Attempt to extract prefix from bill_no
    let foundPrefix = null;
    let cleanBillNo = item.bill_no;
    for (const pref of BILL_PREFIXES) {
      if (item.bill_no.startsWith(pref + " ")) {
        foundPrefix = pref;
        cleanBillNo = item.bill_no.substring(pref.length + 1);
        break;
      } else if (item.bill_no.startsWith(pref)) {
        foundPrefix = pref;
        cleanBillNo = item.bill_no.substring(pref.length);
        break;
      }
    }

    setBillNo(cleanBillNo);
    setBillPrefix(foundPrefix);
    setPrice(item.price.toString());
    setWeight(item.weight.toString());
    setDate(item.date);
    setSelectedAddBranch(item.branch_id || "");
    
    // Parse item_type string into selectedItems tags
    setSelectedItems(expandItemTypeCodes(item.item_type || ""));
    
    setIsEditingActive(true);
    setShowAddModal(true);
  };

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
      billPrefix,
      isEditingActive,
      selectedActiveItem
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

    // Duplicate bill number check (case-insensitive & trimmed)
    const isDuplicate = stockItems.some(item => 
      item.bill_no.toLowerCase().trim() === finalBillNo.toLowerCase().trim() &&
      (!isEditingActive || item.id !== selectedActiveItem?.id)
    );

    if (isDuplicate) {
      toast.error(`Bill Number "${finalBillNo}" already exists in inventory! Duplicate bill numbers are not allowed.`);
      return;
    }

    const newItem = {
      bill_no: finalBillNo,
      price: parseFloat(price) || 0,
      weight: parseFloat(weight) || 0,
      date: date,
      item_type: compressItemTypeString(selectedItems.map(item => item.code).join(", ")),
      status: 'Active',
      branch_id: targetBranch
    };
    console.log("[DEBUG] newItem payload:", newItem);

    try {
      if (isUsingSupabase) {
        if (isEditingActive && selectedActiveItem) {
          console.log("[DEBUG] Attempting Supabase update...");
          const { error } = await supabase
            .from('stock_items')
            .update({
              bill_no: newItem.bill_no,
              price: newItem.price,
              weight: newItem.weight,
              date: newItem.date,
              item_type: newItem.item_type,
              branch_id: newItem.branch_id
            })
            .eq('id', selectedActiveItem.id);

          if (error) {
            console.error("[DEBUG] Supabase update error:", error);
            throw error;
          }
          toast.success("Stock item updated in Supabase!");
        } else {
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
        }
      } else {
        console.log("[DEBUG] Supabase offline, using LocalStorage fallback...");
        if (isEditingActive && selectedActiveItem) {
          // LocalStorage fallback update
          const updated = stockItems.map(item => {
            if (item.id === selectedActiveItem.id) {
              return {
                ...item,
                bill_no: newItem.bill_no,
                price: newItem.price,
                weight: newItem.weight,
                date: newItem.date,
                item_type: newItem.item_type,
                branch_id: newItem.branch_id
              };
            }
            return item;
          });
          setStockItems(updated);
          localStorage.setItem('local_stock_items', JSON.stringify(updated));
          toast.success("Stock item updated (Local Storage)!");
        } else {
          // LocalStorage fallback insert
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
      }

      closeAddModal();
      
      // Reload
      loadStockData();
    } catch (err: any) {
      toast.error("Error saving stock item: " + err.message);
    }
  };

  // Stock Customer operations & logic
  const getCustomerForBill = (billNo: string) => {
    if (!billNo) return null;
    const cleanBill = billNo.trim().toLowerCase();
    return stockCustomers.find(c => {
      if (!c.bill_numbers) return false;
      const bills = c.bill_numbers.split(",").map((b: string) => b.trim().toLowerCase());
      return bills.includes(cleanBill);
    });
  };

  const handleAddBillPrefix = (prefix: string) => {
    const trimmed = custBills.trim();
    if (!trimmed) {
      setCustBills(prefix + " ");
    } else if (trimmed.endsWith(",")) {
      setCustBills(custBills + " " + prefix + " ");
    } else {
      setCustBills(custBills + ", " + prefix + " ");
    }
  };

  const openAddCustomerModal = (initialBill = "") => {
    setSelectedCustomer(null);
    setCustName("");
    setCustAddress("");
    setCustAddress2("");
    setCustTp("");
    setCustNic("");
    setCustBills(initialBill);
    setIsEditingCustomer(false);
    setShowAddCustomerModal(true);
  };

  const openEditCustomerModal = (customer: any) => {
    setSelectedCustomer(customer);
    setCustName(customer.name);
    setCustAddress(customer.address);
    setCustAddress2(customer.address_2 || "");
    setCustTp(customer.tp);
    setCustNic(customer.nic || "");
    setCustBills(customer.bill_numbers || "");
    setIsEditingCustomer(true);
    setShowAddCustomerModal(true);
  };

  const handleNameChange = (val: string) => {
    setCustName(val);
    if (!val.trim()) {
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const matches = stockCustomers.filter(c => 
      c.name.toLowerCase().includes(val.toLowerCase())
    );
    setNameSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const selectNameSuggestion = (suggestion: any) => {
    setCustName(suggestion.name);
    setCustAddress(suggestion.address);
    setCustAddress2(suggestion.address_2 || "");
    setCustTp(suggestion.tp);
    setCustNic(suggestion.nic || "");
    if (!custBills.trim()) {
      setCustBills(suggestion.bill_numbers || "");
    }
    setShowSuggestions(false);
    setNameSuggestions([]);
  };

  const handleSaveCustomer = async () => {
    if (!custName.trim() || !custAddress.trim() || !custTp.trim()) {
      toast.error("Name, Address, and Telephone are required fields.");
      return;
    }

    const payload = {
      name: custName.trim(),
      address: custAddress.trim(),
      address_2: custAddress2.trim() || null,
      tp: custTp.trim(),
      nic: custNic.trim() || null,
      bill_numbers: custBills.trim(),
      branch_id: selectedBranch && selectedBranch !== 'ALL' 
        ? selectedBranch 
        : (currentUser?.branchId || 'HQ')
    };

    try {
      if (isUsingSupabase) {
        if (isEditingCustomer && selectedCustomer) {
          const { error } = await supabase
            .from('stock_customers')
            .update(payload)
            .eq('id', selectedCustomer.id);
          if (error) throw error;
          toast.success("Customer profile updated in Supabase!");
        } else {
          const { error } = await supabase
            .from('stock_customers')
            .insert([payload]);
          if (error) throw error;
          toast.success("Customer profile created in Supabase!");
        }
      } else {
        const local = localStorage.getItem('local_stock_customers');
        let list: any[] = [];
        if (local) {
          try { list = JSON.parse(local); } catch (e) {}
        }
        if (isEditingCustomer && selectedCustomer) {
          list = list.map(c => c.id === selectedCustomer.id ? { ...c, ...payload } : c);
          toast.success("Customer profile updated (Local Storage)!");
        } else {
          const newCust = {
            id: Math.random().toString(36).substring(2, 9),
            ...payload,
            created_at: new Date().toISOString()
          };
          list = [newCust, ...list];
          toast.success("Customer profile created (Local Storage)!");
        }
        localStorage.setItem('local_stock_customers', JSON.stringify(list));
      }
      setShowAddCustomerModal(false);
      loadCustomerData();
      
      // Auto close bill info modal to refresh view cleanly
      setShowBillCustomerModal(false);
    } catch (err: any) {
      toast.error("Error saving customer profile: " + err.message);
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

  const getItemName = (codeWithCount: string) => {
    if (!codeWithCount) return "";
    if (codeWithCount === 'BLCT') return 'Biscuit (BKT)'; // Backward compatibility
    
    const match = codeWithCount.match(/^([A-Za-z]+)(\d*)$/);
    if (match) {
      const baseCode = match[1].toUpperCase();
      const count = match[2] ? parseInt(match[2], 10) : 1;
      const found = ITEM_TYPES.find(item => item.code === baseCode);
      const name = found ? found.name : baseCode;
      return count > 1 ? `${name} (x${count})` : name;
    }
    const found = ITEM_TYPES.find(item => item.code === codeWithCount.toUpperCase());
    return found ? found.name : codeWithCount;
  };

  const handleExportExcel = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      now.toLocaleTimeString('en-US', { hour12: true });

    const activeBranchName = branches.find(b => b.id === selectedBranch)?.name || (selectedBranch === 'ALL' ? 'All Branches' : selectedBranch);

    const csvLines: string[] = [];

    // Title & Header Information matching paper layout
    csvLines.push(`"INVENTORY ON ${timestamp}"`);
    csvLines.push(`"${activeBranchName.toUpperCase()} Branch"`);
    csvLines.push(`"Status: ${stockFilter} Stock"`);
    csvLines.push("");

    const PREFIX_ORDER = ["A", "1R", "3M", "3R", "6R", "12R", "6M"];
    const grouped: { [key: string]: any[] } = {};
    PREFIX_ORDER.forEach(p => { grouped[p] = []; });
    grouped["OTHERS"] = [];

    sortedStock.forEach(item => {
      const clean = (item.bill_no || "").trim();
      let matched = "OTHERS";
      for (const pref of PREFIX_ORDER) {
        if (clean.startsWith(pref + " ") || clean.startsWith(pref)) {
          matched = pref;
          break;
        }
      }
      grouped[matched].push(item);
    });

    const activeGroups = [...PREFIX_ORDER, "OTHERS"].filter(p => grouped[p].length > 0);

    activeGroups.forEach(pref => {
      const items = grouped[pref];
      csvLines.push(`"=== SECTION: ${pref} ==="`);
      csvLines.push(`"Bill No","Customer Name","Phone (TP)","NIC","Address","Address 2","Price","Weight","Date","Items"`);

      items.forEach(item => {
        const d = new Date(item.date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const yr = String(d.getFullYear()).slice(-2);
        const formattedDate = `${day}-${month}-${yr}`;

        const weightVal = parseFloat(item.weight) || 0;
        const g = Math.floor(weightVal);
        const mg = Math.round((weightVal - g) * 1000);
        const formattedWeight = `${g}g${mg}`;
        const formattedPrice = (parseFloat(item.price) || 0).toLocaleString();

        const cust = getCustomerForBill(item.bill_no);
        const custNameStr = cust ? cust.name : '';
        const custTpStr = cust ? cust.tp : '';
        const custNicStr = cust ? (cust.nic || '') : '';
        const custAddrStr = cust ? cust.address : '';
        const custAddr2Str = cust ? (cust.address_2 || '') : '';

        csvLines.push(`"${item.bill_no}","${custNameStr}","${custTpStr}","${custNicStr}","${custAddrStr}","${custAddr2Str}","${formattedPrice}","${formattedWeight}","${formattedDate}","${compressItemTypeString(item.item_type || '')}"`);
      });

      csvLines.push(`"No of Packets = ${items.length}"`);
      csvLines.push("");
    });

    // Summary Totals at bottom
    const totalCount = sortedStock.length;
    const totalWeight = sortedStock.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalValue = sortedStock.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    csvLines.push(`"SUMMARY TOTALS"`);
    csvLines.push(`"Total Items","${totalCount}"`);
    csvLines.push(`"Total Weight","${totalWeight.toFixed(3)} g"`);
    csvLines.push(`"Total Value","Rs. ${totalValue.toLocaleString()}"`);

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Vault_Stock_${activeBranchName.replace(/\s+/g, '_')}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel CSV report generated successfully!");
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=850')!;
    const now = new Date();
    const timestampStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      now.toLocaleTimeString('en-US', { hour12: true });
      
    const activeBranchName = branches.find(b => b.id === selectedBranch)?.name || (selectedBranch === 'ALL' ? 'All Branches' : selectedBranch);

    const PREFIX_ORDER = ["A", "1R", "3M", "3R", "6R", "12R", "6M"];
    const grouped: { [key: string]: any[] } = {};
    PREFIX_ORDER.forEach(p => { grouped[p] = []; });
    grouped["OTHERS"] = [];

    sortedStock.forEach(item => {
      const clean = (item.bill_no || "").trim();
      let matched = "OTHERS";
      for (const pref of PREFIX_ORDER) {
        if (clean.startsWith(pref + " ") || clean.startsWith(pref)) {
          matched = pref;
          break;
        }
      }
      grouped[matched].push(item);
    });

    const activeGroups = [...PREFIX_ORDER, "OTHERS"].filter(p => grouped[p].length > 0);

    const sectionsHtml = activeGroups.map(pref => {
      const items = grouped[pref];
      const rowsHtml = items.map(item => {
        const d = new Date(item.date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const yr = String(d.getFullYear()).slice(-2);
        const formattedDate = `${day}-${month}-${yr}`;

        const weightVal = parseFloat(item.weight) || 0;
        const g = Math.floor(weightVal);
        const mg = Math.round((weightVal - g) * 1000);
        const formattedWeight = `${g}g${mg}`;
        const formattedPrice = (parseFloat(item.price) || 0).toLocaleString();

        return `
          <tr>
            <td style="font-weight: bold; text-align: left;">${item.bill_no}</td>
            <td style="text-align: right;">${formattedPrice}</td>
            <td style="text-align: right;">${formattedWeight}</td>
            <td style="text-align: center;">${formattedDate}</td>
            <td style="text-align: left;">${compressItemTypeString(item.item_type || '')}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="section-block">
          <table class="inventory-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 22%;">Bill No</th>
                <th style="text-align: right; width: 22%;">Price</th>
                <th style="text-align: right; width: 18%;">Weight</th>
                <th style="text-align: center; width: 18%;">Date</th>
                <th style="text-align: left; width: 20%;">Items</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="packet-count">No of Packets = ${items.length}</div>
        </div>
      `;
    }).join('');

    const totalCount = sortedStock.length;
    const totalWeight = sortedStock.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalValue = sortedStock.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report - ${activeBranchName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 10mm 10mm 10mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .header-block {
              border-bottom: 1.5px solid #000;
              padding-bottom: 6px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-branch {
              font-size: 13px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .columns-wrapper {
              column-count: 2;
              column-gap: 20px;
              column-fill: auto;
            }
            .section-block {
              break-inside: avoid;
              margin-bottom: 12px;
            }
            .inventory-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
            }
            .inventory-table th {
              border-bottom: 1px solid #000;
              padding: 3px 2px;
              font-weight: bold;
              font-size: 9px;
            }
            .inventory-table td {
              padding: 2px 2px;
              font-size: 9px;
              white-space: nowrap;
            }
            .packet-count {
              font-weight: bold;
              font-size: 9.5px;
              margin-top: 4px;
              margin-bottom: 8px;
            }
            .footer-summary {
              break-before: column;
              border-top: 1.5px solid #000;
              padding-top: 8px;
              margin-top: 15px;
              font-size: 10px;
              font-weight: bold;
            }
            .checked-by {
              margin-top: 25px;
              font-weight: bold;
              font-size: 10px;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-block">
            <div>
              <div class="header-title">INVENTORY ON ${timestampStr}</div>
              <div class="header-branch">${activeBranchName.toUpperCase()} Branch</div>
            </div>
            <div style="text-align: right; font-weight: bold; font-size: 9.5px;">
              <div>Status: ${stockFilter} Stock</div>
              <div>Total Items: ${totalCount}</div>
            </div>
          </div>

          <div class="columns-wrapper">
            ${sectionsHtml}

            <div class="section-block footer-summary">
              <div>TOTAL VAULT ITEMS = ${totalCount}</div>
              <div>TOTAL WEIGHT = ${totalWeight.toFixed(3)} g</div>
              <div>TOTAL VALUE = Rs. ${totalValue.toLocaleString()}</div>
              <div class="checked-by">Checked BY: ______________________</div>
            </div>
          </div>

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

  // Strict sort by prefix order: A -> 1R -> 3M -> 3R -> 6R -> 12R -> 6M -> Others
  const sortedStock = sortStockItems(filteredStock);

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

          {/* Branch breakdown overview */}
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Branch Distribution:
            </span>
            {branches.map((b: any) => {
              const count = stockItems.filter(item => item.branch_id === b.id && item.status === stockFilter).length;
              return (
                <div 
                  key={b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-default"
                  title={b.name}
                >
                  <span className="bg-blue-50 text-blue-800 border border-blue-200/50 font-black px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wide">
                    {b.id}
                  </span>
                  <span className="text-slate-900 font-black">{count}</span>
                  <span className="text-slate-400 font-semibold text-[10px]">items</span>
                </div>
              );
            })}
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
                    {sortedStock.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setSelectedBillForCustomerView(item.bill_no);
                              setShowBillCustomerModal(true);
                            }}
                            className="font-black text-slate-800 text-sm hover:text-blue-600 underline decoration-dotted transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                            title="Click to view customer details"
                          >
                            {item.bill_no}
                            {getCustomerForBill(item.bill_no) && (
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full inline-block" />
                            )}
                          </button>
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
                            {compressItemTypeString(item.item_type || "").split(", ").map((code: string) => (
                              <span key={code} className="bg-slate-100 text-slate-800 border border-slate-200/50 font-black px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide">
                                {code}
                              </span>
                            ))}
                            <span className="text-slate-700 font-bold ml-1 whitespace-normal break-words">
                              {compressItemTypeString(item.item_type || "").split(", ").map((code: string) => getItemName(code)).join(" + ")}
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
                          <TableCell className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Button 
                              onClick={() => openEditActiveModal(item)}
                              size="sm"
                              variant="outline"
                              className="border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-[9px] uppercase tracking-widest h-8 px-3 rounded-xl transition-all cursor-pointer"
                            >
                              Edit
                            </Button>
                            <Button 
                              onClick={() => openWithdrawModal(item)}
                              size="sm"
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 font-black text-[9px] uppercase tracking-widest h-8 px-3 rounded-xl transition-all cursor-pointer"
                            >
                              Withdraw
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
                {isEditingActive ? "Edit Vault Stock Item" : "Add Physical Vault Stock"}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-sm">
                {isEditingActive 
                  ? "Modify the record of pawn gold items stored in physical vault storage."
                  : "Declare a physical gold pawn asset and insert it into active vault stock logs."}
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
                      billPrefix ? (billPrefix.length > 2 ? "pl-16" : "pl-12") : "",
                      billNo.trim() !== "" && stockItems.some(item => 
                        item.bill_no.toLowerCase().trim() === (billPrefix ? `${billPrefix} ${billNo.trim()}` : billNo.trim()).toLowerCase().trim() && 
                        (!isEditingActive || item.id !== selectedActiveItem?.id)
                      ) ? "border-rose-500 focus:ring-rose-500" : ""
                    )}
                  />
                </div>
                {(() => {
                  const checkBill = billPrefix ? `${billPrefix} ${billNo.trim()}` : billNo.trim();
                  const isDup = billNo.trim() !== "" && stockItems.some(item => 
                    item.bill_no.toLowerCase().trim() === checkBill.toLowerCase().trim() && 
                    (!isEditingActive || item.id !== selectedActiveItem?.id)
                  );
                  if (isDup) {
                    return (
                      <p className="text-rose-600 font-bold text-xs flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Duplicate Bill Number ({checkBill}) already exists in inventory!
                      </p>
                    );
                  }
                  return null;
                })()}
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
                
                {/* Search Input and Quantity */}
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
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
                  <div className="relative w-24">
                    <Input 
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="h-11 border-slate-200 rounded-xl font-bold text-center text-sm bg-white" 
                      title="Quantity (e.g. 5 Rings)"
                    />
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
            <Button variant="outline" onClick={closeAddModal} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleAddStock} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {isEditingActive ? "Save Changes" : "Insert to Vault"}
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

      {/* MODAL: BILL CUSTOMER INFO */}
      <Dialog open={showBillCustomerModal} onOpenChange={setShowBillCustomerModal}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="h-2 bg-blue-600" />
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tighter text-slate-900">
                Pawn Bill Details
              </DialogTitle>
              <DialogDescription className="font-semibold text-slate-400 text-xs mt-1">
                Customer association for Bill No: <span className="text-slate-700 font-black">{selectedBillForCustomerView}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              {(() => {
                if (!selectedBillForCustomerView) return null;
                const cust = getCustomerForBill(selectedBillForCustomerView);
                if (cust) {
                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3 font-semibold text-xs text-slate-600">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Customer Name</span>
                          <span className="text-sm font-black text-slate-900">{cust.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Telephone (TP)</span>
                          <span className="text-slate-900 font-bold">{cust.tp}</span>
                        </div>
                        {cust.nic && (
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">NIC Number</span>
                            <span className="text-slate-900 font-bold">{cust.nic}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Address</span>
                          <span className="text-slate-800 font-bold block">{cust.address}</span>
                          {cust.address_2 && (
                            <span className="text-slate-400 block mt-1">{cust.address_2}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          onClick={() => {
                            openEditCustomerModal(cust);
                            setShowBillCustomerModal(false);
                          }}
                          variant="outline"
                          className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer px-4 flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" /> Edit Profile
                        </Button>
                        <Button 
                          onClick={() => setShowBillCustomerModal(false)}
                          className="rounded-xl font-bold bg-slate-950 hover:bg-slate-900 text-white cursor-pointer px-5"
                        >
                          Close Details
                        </Button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">No Customer Profile Linked</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-1">There is no customer details registered under this bill number.</p>
                      </div>
                      <div className="flex justify-center pt-2">
                        <Button 
                          onClick={() => {
                            openAddCustomerModal(selectedBillForCustomerView);
                            setShowBillCustomerModal(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[9px] h-10 px-5 rounded-xl shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Customer Details
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD/EDIT CUSTOMER */}
      <Dialog open={showAddCustomerModal} onOpenChange={setShowAddCustomerModal}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-slate-200 shadow-2xl p-0 overflow-hidden rounded-[2.5rem] max-h-[90vh] flex flex-col">
          <div className="h-2 bg-blue-600 shrink-0" />
          <div className="p-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 text-blue-600">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                {isEditingCustomer ? "Edit Customer Profile" : "Register Customer Profile"}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-xs">
                Associate customer contact details and addresses with active vault stock bills.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            <div className="grid gap-4 pb-4">
              
              {/* Customer Name */}
              <div className="grid gap-1.5 relative">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Customer Name</Label>
                <div className="relative">
                  <Input 
                    value={custName} 
                    onChange={e => handleNameChange(e.target.value)} 
                    placeholder="E.g. Saman Kumara" 
                    className="h-10 border-slate-200 rounded-xl font-bold" 
                  />
                  {showSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {nameSuggestions.map(suggestion => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => selectNameSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors animate-in fade-in"
                        >
                          <div className="font-black text-slate-900">{suggestion.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{suggestion.tp} | {suggestion.address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Telephone */}
              <div className="grid gap-1.5">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Telephone (TP)</Label>
                <Input 
                  value={custTp} 
                  onChange={e => setCustTp(e.target.value)} 
                  placeholder="E.g. 0771234567" 
                  className="h-10 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* NIC */}
              <div className="grid gap-1.5">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">NIC (Optional)</Label>
                <Input 
                  value={custNic} 
                  onChange={e => setCustNic(e.target.value)} 
                  placeholder="E.g. 199512345678" 
                  className="h-10 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* Address */}
              <div className="grid gap-1.5">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Address</Label>
                <Input 
                  value={custAddress} 
                  onChange={e => setCustAddress(e.target.value)} 
                  placeholder="E.g. No 12, Main Street, Wattala" 
                  className="h-10 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* Address 2 */}
              <div className="grid gap-1.5">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Address Line 2 (Optional)</Label>
                <Input 
                  value={custAddress2} 
                  onChange={e => setCustAddress2(e.target.value)} 
                  placeholder="E.g. Apartment 4B" 
                  className="h-10 border-slate-200 rounded-xl font-bold" 
                />
              </div>

              {/* Bill Numbers */}
              <div className="grid gap-1.5">
                <div className="flex justify-between items-center">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Linked Pawn Bill Numbers</Label>
                  <div className="flex items-center gap-1">
                    {["A", "1R", "3M", "3R", "6R", "12R", "6M"].map(pref => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handleAddBillPrefix(pref)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black text-slate-700 cursor-pointer transition-colors active:scale-95"
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
                <Input 
                  value={custBills} 
                  onChange={e => setCustBills(e.target.value)} 
                  placeholder="Comma separated: e.g. 1R 15580, 12R 20750" 
                  className="h-10 border-slate-200 rounded-xl font-bold" 
                />
                <span className="text-[9px] font-bold text-slate-400">Associate one or multiple bill numbers to this customer profile.</span>
              </div>

            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setShowAddCustomerModal(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleSaveCustomer} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[9px] h-10 px-5 rounded-xl shadow-lg cursor-pointer"
            >
              Save Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
