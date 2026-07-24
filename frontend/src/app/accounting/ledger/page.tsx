'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Building2, Calendar, Calculator, CheckCircle2, AlertTriangle, 
  FileSpreadsheet, Plus, Trash2, Save, RefreshCw, ShieldCheck, UserCheck, Scale,
  Layers, FileText, ArrowDownRight, ArrowUpRight, DollarSign, Wallet
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TransactionItem {
  id: string;
  type: 'LOAN' | 'REDEEM';
  billNo: string;
  cashAmount: number;
  insuranceRs: number;
  weightG: number;
  weightMg: number;
  itemCode: string;
  redeemNo: string;
  interestRs: number;
  category: 'M' | 'A' | 'R';
  remarks: string;
}

interface ExpenseRow {
  description: string;
  amount: number | string;
}

interface StaffShiftItem {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  status: 'PRESENT' | 'ABSENT';
}

const BRANCHES = [
  { id: 'BRL', name: 'Borella' },
  { id: 'KOT', name: 'Kotikawatta' },
  { id: 'DMT', name: 'Dematagoda' },
  { id: 'W2',  name: 'Wattala 2' },
  { id: 'W3',  name: 'Wattala 3' },
  { id: 'W4',  name: 'Wattala 4' },
  { id: 'KIR', name: 'Kiribathgoda' },
  { id: 'KDW', name: 'Kadawatha' },
  { id: 'DHW', name: 'Dehiwala' },
  { id: 'PND', name: 'Panadura' },
  { id: 'KTW', name: 'Kottawa' },
  { id: 'HMG', name: 'Homagama' }
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function MainLedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'entry';
  const branchParam = searchParams.get('branch');

  const [activeTab, setActiveTab] = useState<'entry' | 'matrix' | 'journal'>(
    tabParam === 'matrix' ? 'matrix' : tabParam === 'journal' ? 'journal' : 'entry'
  );

  useEffect(() => {
    if (tabParam === 'matrix') setActiveTab('matrix');
    else if (tabParam === 'journal') setActiveTab('journal');
    else setActiveTab('entry');
  }, [tabParam]);

  // ==========================================
  // TAB 1: DAILY LEDGER ENTRY STATE & LOGIC
  // ==========================================
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHqUser, setIsHqUser] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(branchParam || 'BRL');
  const [ledgerDate, setLedgerDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cpBalance, setCpBalance] = useState<string | number>('');
  const [openingBalance, setOpeningBalance] = useState<string | number>('');
  const [transferIn, setTransferIn] = useState<string | number>('');
  const [transferOut, setTransferOut] = useState<string | number>('');
  const [recoveryTotal, setRecoveryTotal] = useState<string | number>('');
  const [userClosingBalance, setUserClosingBalance] = useState<string | number>('');
  const [staffShift, setStaffShift] = useState('');

  // Structured Transactions (One by One Add)
  const [transactionList, setTransactionList] = useState<TransactionItem[]>([]);
  
  // Single Entry Form Fields
  const [txType, setTxType] = useState<'LOAN' | 'REDEEM'>('LOAN');
  const [txBillNo, setTxBillNo] = useState('');
  const [txCashAmount, setTxCashAmount] = useState('');
  const [txInsuranceRs, setTxInsuranceRs] = useState('');
  const [txWeightG, setTxWeightG] = useState('');
  const [txWeightMg, setTxWeightMg] = useState('');
  const [txItemCode, setTxItemCode] = useState('');
  const [txRedeemNo, setTxRedeemNo] = useState('');
  const [txInterestRs, setTxInterestRs] = useState('');
  const [txCategory, setTxCategory] = useState<'M' | 'A' | 'R'>('R');
  const [txRemarks, setTxRemarks] = useState('');

  // Itemized Expenses
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  // Staff Shifts
  const [shiftList, setShiftList] = useState<StaffShiftItem[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newCheckIn, setNewCheckIn] = useState('08:00');
  const [newCheckOut, setNewCheckOut] = useState('17:30');
  const [newShiftStatus, setNewShiftStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');

  const [previousClosing, setPreviousClosing] = useState<number | null>(null);
  const [previousDate, setPreviousDate] = useState<string | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [savingLedger, setSavingLedger] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        const isAdmin = u.role === 'ADMIN' || u.branch_id === 'HQ' || u.branchId === 'HQ';
        setIsHqUser(isAdmin);

        if (!isAdmin && (u.branch_id || u.branchId)) {
          setSelectedBranch(u.branch_id || u.branchId);
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  // Sync Staff Shift string
  const formattedShiftString = useMemo(() => {
    return shiftList.map(s => {
      const timeStr = `${s.checkIn}-${s.checkOut}`;
      return s.status === 'ABSENT' ? `${s.name} (${timeStr} / AB)` : `${s.name} (${timeStr})`;
    }).join(', ');
  }, [shiftList]);

  useEffect(() => {
    setStaffShift(formattedShiftString);
  }, [formattedShiftString]);

  const handleAddShift = () => {
    if (!newStaffName.trim()) return;
    setShiftList(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: newStaffName.trim(),
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        status: newShiftStatus
      }
    ]);
    setNewStaffName('');
  };

  const handleRemoveShift = (id: string) => {
    setShiftList(prev => prev.filter(s => s.id !== id));
  };

  // Add Transaction Row (One by One)
  const handleAddTransaction = () => {
    if (!txBillNo.trim() && !txCashAmount) {
      alert("Please enter at least Bill/Loan No or Amount!");
      return;
    }

    const newItem: TransactionItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: txType,
      billNo: txBillNo.trim() || 'N/A',
      cashAmount: Number(txCashAmount) || 0,
      insuranceRs: Number(txInsuranceRs) || 0,
      weightG: Number(txWeightG) || 0,
      weightMg: Number(txWeightMg) || 0,
      itemCode: txItemCode.trim().toUpperCase(),
      redeemNo: txRedeemNo.trim(),
      interestRs: Number(txInterestRs) || 0,
      category: txCategory,
      remarks: txRemarks.trim()
    };

    setTransactionList(prev => [newItem, ...prev]);

    // Reset Form Fields
    setTxBillNo('');
    setTxCashAmount('');
    setTxInsuranceRs('');
    setTxWeightG('');
    setTxWeightMg('');
    setTxItemCode('');
    setTxRedeemNo('');
    setTxInterestRs('');
    setTxRemarks('');
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactionList(prev => prev.filter(t => t.id !== id));
  };

  // Auto-calculated Totals from Transaction List
  const totalLoansIssued = useMemo(() => {
    return transactionList.filter(t => t.type === 'LOAN').reduce((sum, t) => sum + t.cashAmount, 0);
  }, [transactionList]);

  const totalRedemptions = useMemo(() => {
    return transactionList.filter(t => t.type === 'REDEEM').reduce((sum, t) => sum + t.cashAmount, 0);
  }, [transactionList]);

  const totalInterestCollected = useMemo(() => {
    return transactionList.reduce((sum, t) => sum + t.interestRs, 0);
  }, [transactionList]);

  const totalInsuranceCollected = useMemo(() => {
    return transactionList.reduce((sum, t) => sum + t.insuranceRs, 0);
  }, [transactionList]);

  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Excel Formula Closing Balance Calculation
  const calculatedClosing = useMemo(() => {
    const op = Number(openingBalance) || 0;
    const ti = Number(transferIn) || 0;
    const to = Number(transferOut) || 0;
    const rec = Number(recoveryTotal) || 0;

    return Number((op + ti - to - totalLoansIssued + totalRedemptions + totalInterestCollected + rec + totalInsuranceCollected - totalExpensesSum).toFixed(2));
  }, [openingBalance, transferIn, transferOut, totalLoansIssued, totalRedemptions, totalInterestCollected, recoveryTotal, totalInsuranceCollected, totalExpensesSum]);

  // Fetch Ledger Data
  const fetchLedgerData = async () => {
    setLoadingLedger(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/ledger/daily?branch_id=${selectedBranch}&date=${ledgerDate}`);
      const contentType = res.headers.get('content-type');
      
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error) {
          setFeedback({ type: 'error', message: data.error });
          return;
        }

        setPreviousClosing(data.previous_closing);
        setPreviousDate(data.previous_ledger_date);

        if (data.ledger) {
          const l = data.ledger;
          setCpBalance(l.cp_balance || '');
          setOpeningBalance(l.opening_balance || '');
          setTransferIn(l.transfer_in || '');
          setTransferOut(l.transfer_out || '');
          setRecoveryTotal(l.recovery_total || '');
          setUserClosingBalance(l.closing_balance || '');

          // Map Transactions
          if (data.transactions && Array.isArray(data.transactions)) {
            const mapped: TransactionItem[] = data.transactions.map((t: any) => ({
              id: t.id || Math.random().toString(),
              type: Number(t.cash_received || 0) > 0 ? 'REDEEM' : 'LOAN',
              billNo: t.loan_no || t.bill_no || '',
              cashAmount: Number(t.cash_loan || t.amount || t.cash_received || 0),
              insuranceRs: Number(t.insurance_rs || 0),
              weightG: Number(t.weight_g || 0),
              weightMg: Number(t.weight_mg || 0),
              itemCode: t.item_code || '',
              redeemNo: t.redeem_no || '',
              interestRs: Number(t.interest_rs || 0),
              category: (t.remarks === 'M' || t.remarks === 'A') ? t.remarks : 'R',
              remarks: t.remarks || ''
            }));
            setTransactionList(mapped);
          } else {
            setTransactionList([]);
          }

          setExpenses(data.expenses || []);
        } else {
          setCpBalance('');
          setOpeningBalance(data.previous_closing !== null ? data.previous_closing : '');
          setTransferIn('');
          setTransferOut('');
          setRecoveryTotal('');
          setUserClosingBalance('');
          setTransactionList([]);
          setExpenses([]);
        }
      }
    } catch (err: any) {
      console.error("Fetch ledger error:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'entry' && selectedBranch && ledgerDate) {
      fetchLedgerData();
    }
  }, [activeTab, selectedBranch, ledgerDate]);

  const handleSaveLedger = async () => {
    setSavingLedger(true);
    setFeedback(null);

    const payload = {
      branch_id: selectedBranch,
      ledger_date: ledgerDate,
      cp_balance: cpBalance,
      opening_balance: openingBalance,
      transfer_in: transferIn,
      transfer_out: transferOut,
      loan_issued_total: totalLoansIssued,
      redemption_total: totalRedemptions,
      interest_rec_total: totalInterestCollected,
      recovery_total: recoveryTotal,
      insurance_total: totalInsuranceCollected,
      expenses_total: totalExpensesSum,
      closing_balance: userClosingBalance || calculatedClosing,
      staff_shift: staffShift,
      created_by: currentUser?.email || 'Teller',
      status: 'APPROVED',
      transactions: transactionList.map(t => ({
        loan_no: t.billNo,
        cash_loan: t.type === 'LOAN' ? t.cashAmount : 0,
        insurance_rs: t.insuranceRs,
        weight_g: t.weightG,
        weight_mg: t.weightMg,
        item_code: t.itemCode,
        redeem_no: t.redeemNo,
        interest_rs: t.interestRs,
        cash_received: t.type === 'REDEEM' ? t.cashAmount : 0,
        remarks: t.remarks || t.category
      })),
      expenses
    };

    try {
      const res = await fetch('/api/ledger/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.error) {
        setFeedback({ type: 'error', message: data.error });
      } else {
        setFeedback({
          type: 'success',
          message: `Daily Ledger for ${selectedBranch} on ${ledgerDate} updated and saved successfully!`
        });
        fetchLedgerData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingLedger(false);
    }
  };

  // Expense Handlers
  const addExpenseRow = () => setExpenses(prev => [...prev, { description: '', amount: '' }]);
  const removeExpenseRow = (idx: number) => setExpenses(prev => prev.filter((_, i) => i !== idx));
  const updateExpenseRow = (idx: number, field: keyof ExpenseRow, val: any) => {
    setExpenses(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // ==========================================
  // TAB 2: 11-BRANCH MATRIX STATE & LOGIC
  // ==========================================
  const [selectedYear, setSelectedYear] = useState('2025');
  const [matrixData, setMatrixData] = useState<Record<string, any>>({});
  const [matrixBranches, setMatrixBranches] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    setMatrixError(null);
    try {
      const res = await fetch(`/api/ledger/matrix?year=${selectedYear}`);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error) setMatrixError(data.error);
        else {
          setMatrixBranches(data.branches || []);
          setMatrixData(data.matrix || {});
        }
      }
    } catch (err: any) {
      setMatrixError(err.message);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matrix') fetchMatrix();
  }, [activeTab, selectedYear]);

  const grandTotalEntered = Object.values(matrixData).reduce((sum, b: any) => sum + (b.total_entered || 0), 0);
  const grandTotalFlagged = Object.values(matrixData).reduce((sum, b: any) => sum + (b.total_flagged || 0), 0);

  // ==========================================
  // TAB 3: GENERAL JOURNAL LEDGER LOGIC
  // ==========================================
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);

  const loadJournalEntries = async () => {
    setLoadingJournal(true);
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) setJournalEntries(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJournal(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'journal') loadJournalEntries();
  }, [activeTab]);

  const handleTabSwitch = (tab: 'entry' | 'matrix' | 'journal') => {
    setActiveTab(tab);
    router.push(`/accounting/ledger?tab=${tab}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            Daily Transaction Ledger & Summary
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Excel-Style Pawning Daily Financial Entry & Automatic Cash Flow Calculator
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'entry' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Daily Entry Sheet
          </button>
          <button
            onClick={() => handleTabSwitch('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            11-Branch Matrix
          </button>
          <button
            onClick={() => handleTabSwitch('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'journal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            General Journal
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: DAILY LEDGER ENTRY SHEET CONTENT    */}
      {/* ========================================== */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          {feedback && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              feedback.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Top Bar Controls: Branch & Date & CP & Attendance */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm items-end">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!isHqUser}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Ledger Date
              </label>
              <input
                type="date"
                value={ledgerDate}
                onChange={(e) => setLedgerDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">CP Balance</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cpBalance}
                onChange={(e) => setCpBalance(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm text-right"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Staff Attendance
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Staff Name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900"
                />
                <Button onClick={handleAddShift} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs px-3">
                  + Add Staff
                </Button>
              </div>
            </div>

            {shiftList.length > 0 && (
              <div className="md:col-span-12 flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                {shiftList.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-xs font-bold">
                    <span>{s.name} ({s.checkIn}-{s.checkOut})</span>
                    <button onClick={() => handleRemoveShift(s.id)} className="text-slate-400 hover:text-slate-800">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 1: ONE-BY-ONE TRANSACTION ADDITION FORM (EXCEL STYLE) */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add Loan or Redemption Bill (එක් එක් ගනුදෙනුව එකතු කරන්න)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select transaction type, enter bill details and click &quot;+ Add Transaction Row&quot;
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setTxType('LOAN')}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                    txType === 'LOAN' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Loan Issued (ණය)
                </button>
                <button
                  onClick={() => setTxType('REDEEM')}
                  className={`px-3 py-1.5 rounded-md font-bold text-xs transition ${
                    txType === 'REDEEM' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Redemption (බේරුම්)
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Bill / Loan No</label>
                <input
                  type="text"
                  placeholder="e.g. 1R 256"
                  value={txBillNo}
                  onChange={(e) => setTxBillNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                  {txType === 'LOAN' ? 'Cash Loan (LKR)' : 'Redeem Cash (LKR)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={txCashAmount}
                  onChange={(e) => setTxCashAmount(e.target.value)}
                  className={`w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-right ${
                    txType === 'LOAN' ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Insurance</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={txInsuranceRs}
                  onChange={(e) => setTxInsuranceRs(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-mono font-bold text-right text-emerald-700"
                />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Weight g</label>
                <input
                  type="number"
                  placeholder="25"
                  value={txWeightG}
                  onChange={(e) => setTxWeightG(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-center text-slate-900"
                />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Weight mg</label>
                <input
                  type="number"
                  placeholder="060"
                  value={txWeightMg}
                  onChange={(e) => setTxWeightMg(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-center text-slate-800"
                />
              </div>

              <div className="md:col-span-1 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Code</label>
                <input
                  type="text"
                  placeholder="CH"
                  value={txItemCode}
                  onChange={(e) => setTxItemCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-center uppercase text-slate-900"
                />
              </div>

              {txType === 'REDEEM' && (
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase">Interest Rs</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1641.26"
                    value={txInterestRs}
                    onChange={(e) => setTxInterestRs(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-mono font-bold text-right text-emerald-700"
                  />
                </div>
              )}

              <div className="md:col-span-1 space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase">Category</label>
                <select
                  value={txCategory}
                  onChange={(e: any) => setTxCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="R">R (Regular)</option>
                  <option value="M">M (Main)</option>
                  <option value="A">A (Additional)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Button
                  onClick={handleAddTransaction}
                  className={`w-full font-bold h-9 text-xs gap-1.5 text-white ${
                    txType === 'LOAN' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  + Add {txType === 'LOAN' ? 'Loan' : 'Redeem'}
                </Button>
              </div>
            </div>

            {/* SECTION 2: ADDED TRANSACTIONS TABLE (MATCHES EXCEL SHEET) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  Daily Transactions Log Sheet ({transactionList.length} Items Added)
                </h3>
              </div>

              {transactionList.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-600">No transactions added for {ledgerDate} yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Use the form above to add loans and redemptions one by one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Loan / Bill No</th>
                        <th className="py-2.5 px-3 text-right">Cash Loan (LKR)</th>
                        <th className="py-2.5 px-3 text-right">Insurance (LKR)</th>
                        <th className="py-2.5 px-3 text-center">Weight</th>
                        <th className="py-2.5 px-3 text-center">Code</th>
                        <th className="py-2.5 px-3 text-right">Interest (LKR)</th>
                        <th className="py-2.5 px-3 text-right">Cash Redeem (LKR)</th>
                        <th className="py-2.5 px-3 text-center">Category</th>
                        <th className="py-2.5 px-3 w-[50px] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {transactionList.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                              t.type === 'LOAN' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.billNo}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                            {t.type === 'LOAN' ? `LKR ${t.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {t.insuranceRs > 0 ? `LKR ${t.insuranceRs.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {t.weightG > 0 || t.weightMg > 0 ? `${t.weightG}g ${t.weightMg}mg` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 uppercase">{t.itemCode || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {t.interestRs > 0 ? `LKR ${t.interestRs.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {t.type === 'REDEEM' ? `LKR ${t.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{t.category}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button onClick={() => handleRemoveTransaction(t.id)} className="text-rose-600 hover:bg-rose-50 p-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black font-mono text-xs border-t-2 border-slate-300">
                        <td colSpan={2} className="py-3 px-3 uppercase text-slate-800">EXCEL TOTALS:</td>
                        <td className="py-3 px-3 text-right text-rose-700">LKR {totalLoansIssued.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-right text-emerald-700">LKR {totalInsuranceCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td colSpan={2}></td>
                        <td className="py-3 px-3 text-right text-emerald-700">LKR {totalInterestCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-right text-emerald-700">LKR {totalRedemptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: AUTOMATIC DAILY CASH SUMMARY & CATEGORY BREAKDOWN (EXCEL FORMULA CARD) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Calculator className="w-5 h-5 text-blue-600" />
                Daily Cash Summary (දිනපතා මුදල් සාරාංශය)
              </h3>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-slate-700">Opening Balance (ආරම්භක ශේෂය):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-36 bg-white border rounded px-2 py-1 text-right font-mono text-sm font-bold text-slate-900"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-emerald-700">Transfer In (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={transferIn}
                    onChange={(e) => setTransferIn(e.target.value)}
                    className="w-36 bg-white border rounded px-2 py-1 text-right font-mono text-sm font-bold text-emerald-700"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-rose-700">Transfer Out (-):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={transferOut}
                    onChange={(e) => setTransferOut(e.target.value)}
                    className="w-36 bg-white border rounded px-2 py-1 text-right font-mono text-sm font-bold text-rose-700"
                  />
                </div>

                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-rose-900">
                  <span>Loan Issued Total (-) [Auto-Summed]:</span>
                  <span className="font-mono text-sm">LKR {totalLoansIssued.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 text-emerald-900">
                  <span>Redemption Total (+) [Auto-Summed]:</span>
                  <span className="font-mono text-sm">LKR {totalRedemptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 text-emerald-900">
                  <span>Rec: Interest Total (+) [Auto-Summed]:</span>
                  <span className="font-mono text-sm">LKR {totalInterestCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border">
                  <span className="text-emerald-700">Recovery Total (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={recoveryTotal}
                    onChange={(e) => setRecoveryTotal(e.target.value)}
                    className="w-36 bg-white border rounded px-2 py-1 text-right font-mono text-sm font-bold text-emerald-700"
                  />
                </div>

                <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 text-emerald-900">
                  <span>Insurance Rec (+) [Auto-Summed]:</span>
                  <span className="font-mono text-sm">LKR {totalInsuranceCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-rose-900">
                  <span>Expenses Total (-) [Itemized Below]:</span>
                  <span className="font-mono text-sm">LKR {totalExpensesSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-emerald-100/70 border-2 border-emerald-400 rounded-xl text-emerald-950 text-base font-black">
                  <span>Closing Balance (අවසාන ශේෂය):</span>
                  <span className="font-mono text-lg">LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSaveLedger}
                  disabled={savingLedger || loadingLedger}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm gap-2"
                >
                  <Save className="w-5 h-5" />
                  {savingLedger ? 'Updating & Saving...' : 'Update & Save Ledger for ' + ledgerDate}
                </Button>
              </div>
            </div>

            {/* Itemized Expenses & Category Breakdown Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Itemized Expenses (වියදම්)</h4>
                  <Button onClick={addExpenseRow} variant="outline" size="sm" className="h-7 text-xs font-bold">+ Add Expense</Button>
                </div>

                {expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No expenses added.</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((exp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tea, Cleaning, etc."
                          value={exp.description}
                          onChange={(e) => updateExpenseRow(idx, 'description', e.target.value)}
                          className="flex-1 bg-slate-50 border rounded px-2.5 py-1 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={exp.amount}
                          onChange={(e) => updateExpenseRow(idx, 'amount', e.target.value)}
                          className="w-24 bg-slate-50 border rounded px-2 py-1 text-xs font-bold text-right"
                        />
                        <button onClick={() => removeExpenseRow(idx)} className="text-rose-600">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: 11-BRANCH MATRIX CONTENT            */}
      {/* ========================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Days Entered ({selectedYear})</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{grandTotalEntered} Days</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Mismatch Days</p>
                <p className={`text-3xl font-black mt-1 ${grandTotalFlagged > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {grandTotalFlagged} Days
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                grandTotalFlagged > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Branches Tracked</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{matrixBranches.length} Branches</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Completion Progress Matrix ({selectedYear})
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-bold text-xs"
                >
                  <option value="2024">Year 2024</option>
                  <option value="2025">Year 2025</option>
                  <option value="2026">Year 2026</option>
                </select>
                <Button
                  onClick={fetchMatrix}
                  disabled={loadingMatrix}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingMatrix ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </div>

            {loadingMatrix ? (
              <div className="p-12 text-center text-slate-500 font-bold animate-pulse">
                Loading 11 Branches Matrix...
              </div>
            ) : matrixError ? (
              <div className="p-8 bg-rose-50 text-rose-800 text-sm font-semibold text-center">
                {matrixError}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4 sticky left-0 bg-slate-100 min-w-[140px] z-10">Branch</th>
                      {MONTH_NAMES.map((m, idx) => (
                        <th key={idx} className="py-3 px-3 text-center min-w-[70px]">{m}</th>
                      ))}
                      <th className="py-3 px-4 text-right min-w-[90px]">Total Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matrixBranches.map((b) => {
                      const item = matrixData[b.id];
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-black text-slate-800 sticky left-0 bg-white z-10 flex items-center justify-between">
                            <span>{b.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({b.id})</span>
                          </td>

                          {MONTH_NAMES.map((_, mIdx) => {
                            const mKey = `${selectedYear}-${String(mIdx + 1).padStart(2, '0')}`;
                            const mData = item?.months?.[mKey];
                            const count = mData?.entered_count || 0;
                            const flagged = mData?.flagged_count || 0;

                            let badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
                            if (count >= 25) {
                              badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                            } else if (count > 0) {
                              badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                            }

                            return (
                              <td key={mIdx} className="py-3 px-2 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedBranch(b.id);
                                    handleTabSwitch('entry');
                                  }}
                                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition hover:scale-105 ${badgeColor}`}
                                >
                                  <span>{count}</span>
                                  {flagged > 0 && (
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-right font-mono font-black text-blue-600">
                            {item?.total_entered || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: GENERAL JOURNAL LEDGER CONTENT     */}
      {/* ========================================== */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4 text-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">General Ledger</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Record and view strict double-entry journal logs.</p>
            </div>
          </div>

          <div className="space-y-6">
            {loadingJournal ? (
               <p className="text-center font-bold text-slate-400">Loading ledger logs...</p>
            ) : journalEntries.length === 0 ? (
               <p className="text-center font-bold text-slate-400">No journal entries found.</p>
            ) : journalEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-slate-800">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">{entry.id}</span>
                         <span className="text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-2">{entry.description}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm text-slate-700">Loading Daily Transaction Ledger...</p>
        </div>
      </div>
    }>
      <MainLedgerContent />
    </Suspense>
  );
}
