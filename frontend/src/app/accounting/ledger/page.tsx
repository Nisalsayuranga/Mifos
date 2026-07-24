'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Building2, Calendar, Calculator, CheckCircle2, AlertTriangle, 
  FileSpreadsheet, Plus, Trash2, Save, RefreshCw, ShieldCheck, UserCheck, Scale,
  BarChart3, Layers, Download, Filter, X, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';

interface TransactionRow {
  transaction_type: 'LOAN_ISSUED' | 'REDEMPTION';
  bill_no: string;
  amount: number | string;
  weight_g: number | string;
  weight_mg: number | string;
  insurance_rs: number | string;
  item_code: string;
  interest_rs: number | string;
  cash_received: number | string;
  remarks: string;
}

interface ExpenseRow {
  description: string;
  amount: number | string;
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
  const monthParam = searchParams.get('month');

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
  const [loanIssuedTotal, setLoanIssuedTotal] = useState<string | number>('');
  const [redemptionTotal, setRedemptionTotal] = useState<string | number>('');
  const [interestRecTotal, setInterestRecTotal] = useState<string | number>('');
  const [recoveryTotal, setRecoveryTotal] = useState<string | number>('');
  const [insuranceTotal, setInsuranceTotal] = useState<string | number>('');
  const [expensesTotal, setExpensesTotal] = useState<string | number>('');
  const [userClosingBalance, setUserClosingBalance] = useState<string | number>('');
  const [actualCashCount, setActualCashCount] = useState<string | number>('');
  const [staffShift, setStaffShift] = useState('');

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

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

  const fetchLedgerData = async () => {
    setLoadingLedger(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/ledger/daily?branch_id=${selectedBranch}&date=${ledgerDate}`);
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
        setLoanIssuedTotal(l.loan_issued_total || '');
        setRedemptionTotal(l.redemption_total || '');
        setInterestRecTotal(l.interest_rec_total || '');
        setRecoveryTotal(l.recovery_total || '');
        setInsuranceTotal(l.insurance_total || '');
        setExpensesTotal(l.expenses_total || '');
        setUserClosingBalance(l.closing_balance || '');
        setActualCashCount(l.actual_cash_count !== null ? l.actual_cash_count : '');
        setStaffShift(l.staff_shift || '');

        setTransactions(data.transactions || []);
        setExpenses(data.expenses || []);
      } else {
        setCpBalance('');
        setOpeningBalance(data.previous_closing !== null ? data.previous_closing : '');
        setTransferIn('');
        setTransferOut('');
        setLoanIssuedTotal('');
        setRedemptionTotal('');
        setInterestRecTotal('');
        setRecoveryTotal('');
        setInsuranceTotal('');
        setExpensesTotal('');
        setUserClosingBalance('');
        setActualCashCount('');
        setStaffShift('');
        setTransactions([]);
        setExpenses([]);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'entry' && selectedBranch && ledgerDate) {
      fetchLedgerData();
    }
  }, [activeTab, selectedBranch, ledgerDate]);

  const calculatedClosing = useMemo(() => {
    const op = Number(openingBalance) || 0;
    const ti = Number(transferIn) || 0;
    const to = Number(transferOut) || 0;
    const loans = Number(loanIssuedTotal) || 0;
    const red = Number(redemptionTotal) || 0;
    const int = Number(interestRecTotal) || 0;
    const rec = Number(recoveryTotal) || 0;
    const ins = Number(insuranceTotal) || 0;
    const exp = Number(expensesTotal) || 0;

    return Number((op + ti - to - loans + red + int + rec + ins - exp).toFixed(2));
  }, [openingBalance, transferIn, transferOut, loanIssuedTotal, redemptionTotal, interestRecTotal, recoveryTotal, insuranceTotal, expensesTotal]);

  const userClosingNum = Number(userClosingBalance) || 0;
  const isMathBalanced = Math.abs(userClosingNum - calculatedClosing) < 0.01;
  const mathDiff = Number((userClosingNum - calculatedClosing).toFixed(2));

  const isContinuityMismatch = useMemo(() => {
    if (previousClosing === null) return false;
    const op = Number(openingBalance) || 0;
    return Math.abs(op - previousClosing) > 0.01;
  }, [openingBalance, previousClosing]);

  const detailedExpensesSum = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  useEffect(() => {
    if (expenses.length > 0) {
      setExpensesTotal(detailedExpensesSum);
    }
  }, [detailedExpensesSum, expenses.length]);

  const addExpenseRow = () => {
    setExpenses(prev => [...prev, { description: '', amount: '' }]);
  };

  const removeExpenseRow = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const updateExpenseRow = (index: number, field: keyof ExpenseRow, val: any) => {
    setExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

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
      loan_issued_total: loanIssuedTotal,
      redemption_total: redemptionTotal,
      interest_rec_total: interestRecTotal,
      recovery_total: recoveryTotal,
      insurance_total: insuranceTotal,
      expenses_total: expensesTotal,
      closing_balance: userClosingBalance,
      actual_cash_count: actualCashCount !== '' ? actualCashCount : null,
      staff_shift: staffShift,
      created_by: currentUser?.email || 'Teller',
      status: isMathBalanced ? 'APPROVED' : 'FLAGGED',
      transactions,
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
        if (data.math_status === 'MISMATCH') {
          setFeedback({
            type: 'warning',
            message: `Ledger saved as FLAGGED! Manual Closing differs from Calculated Closing by LKR ${data.math_mismatch_amount}`
          });
        } else {
          setFeedback({
            type: 'success',
            message: `Daily Ledger for ${selectedBranch} on ${ledgerDate} saved successfully with 100% Math Balance!`
          });
        }
        fetchLedgerData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingLedger(false);
    }
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
      const data = await res.json();

      if (data.error) {
        setMatrixError(data.error);
      } else {
        setMatrixBranches(data.branches || []);
        setMatrixData(data.matrix || {});
      }
    } catch (err: any) {
      setMatrixError(err.message);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matrix') {
      fetchMatrix();
    }
  }, [activeTab, selectedYear]);

  const grandTotalEntered = Object.values(matrixData).reduce((sum, b: any) => sum + (b.total_entered || 0), 0);
  const grandTotalFlagged = Object.values(matrixData).reduce((sum, b: any) => sum + (b.total_flagged || 0), 0);

  // ==========================================
  // TAB 3: GENERAL JOURNAL LEDGER LOGIC
  // ==========================================
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [filterJournalDate, setFilterJournalDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRef, setNewRef] = useState("");
  const [lines, setLines] = useState([{ account: "", debit: "", credit: "" }, { account: "", debit: "", credit: "" }]);

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
    if (activeTab === 'journal') {
      loadJournalEntries();
    }
  }, [activeTab]);

  const handleAddJournalLine = () => setLines([...lines, { account: "", debit: "", credit: "" }]);
  
  const updateJournalLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleJournalSubmit = async () => {
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: newDesc,
          reference: newRef,
          entries: lines
        })
      });
      if (res.ok) {
        setShowAddJournalModal(false);
        setNewDesc(""); setNewRef("");
        setLines([{ account: "", debit: "", credit: "" }, { account: "", debit: "", credit: "" }]);
        loadJournalEntries();
      } else {
        const errorData = await res.json();
        alert("Transaction Failed: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
      alert("System Error");
    }
  };

  const filteredJournalEntries = filterJournalDate ? journalEntries.filter(e => e.date === filterJournalDate) : journalEntries;
  const totalJournalDebit = filteredJournalEntries.reduce((sum, e) => sum + parseFloat(e.total_debit || 0), 0);
  const totalJournalCredit = filteredJournalEntries.reduce((sum, e) => sum + parseFloat(e.total_credit || 0), 0);

  const handleTabSwitch = (tab: 'entry' | 'matrix' | 'journal') => {
    setActiveTab(tab);
    router.push(`/accounting/ledger?tab=${tab}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            Pawning Ledger & Audit System
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage multi-branch daily paper log records, 11-branch completion matrix, and general journal logs.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'entry'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Daily Ledger Entry
          </button>
          <button
            onClick={() => handleTabSwitch('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'matrix'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            11-Branch Matrix
          </button>
          <button
            onClick={() => handleTabSwitch('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'journal'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            General Journal
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: DAILY LEDGER ENTRY CONTENT          */}
      {/* ========================================== */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          {feedback && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
              feedback.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' :
              feedback.type === 'warning' ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' :
              'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Branch Selection
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!isHqUser}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-75"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Ledger Date
              </label>
              <input
                type="date"
                value={ledgerDate}
                onChange={(e) => setLedgerDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Staff Shifts / Attendance
              </label>
              <input
                type="text"
                placeholder="e.g. Achini (8.00-5.30), Dahami (8.00-5.30 / AB)"
                value={staffShift}
                onChange={(e) => setStaffShift(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  Daily Cash Ledger Figures
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>CP Balance:</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cpBalance}
                    onChange={(e) => setCpBalance(e.target.value)}
                    className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Opening Balance (ආරම්භක)</span>
                    {previousClosing !== null && (
                      <span className="text-slate-500 text-[10px]">Prev: LKR {previousClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-white font-bold text-right text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                      isContinuityMismatch ? 'border-amber-500/80 text-amber-200' : 'border-slate-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-400 font-bold uppercase">Transfer In (+)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferIn}
                      onChange={(e) => setTransferIn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-emerald-300 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-rose-400 font-bold uppercase">Transfer Out (-)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferOut}
                      onChange={(e) => setTransferOut(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-rose-300 font-bold text-right focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-rose-400 font-bold uppercase">Loans Issued Total (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={loanIssuedTotal}
                    onChange={(e) => setLoanIssuedTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-rose-300 font-bold text-right text-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-400 font-bold uppercase">Redemptions Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={redemptionTotal}
                    onChange={(e) => setRedemptionTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 font-bold text-right text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-400 font-bold uppercase">Interest Rec: Int (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={interestRecTotal}
                    onChange={(e) => setInterestRecTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-400 font-bold uppercase">Recovery Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={recoveryTotal}
                    onChange={(e) => setRecoveryTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-400 font-bold uppercase">Insurance Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={insuranceTotal}
                    onChange={(e) => setInsuranceTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-emerald-300 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-rose-400 font-bold uppercase">Daily Expenses Total (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expensesTotal}
                    onChange={(e) => setExpensesTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-rose-300 font-bold text-right focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-800 pt-3 md:col-span-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-300">
                    <span>Closing Balance (ලෙජර් අවසාන ශේෂය)</span>
                    <span className="text-emerald-400 text-[11px] font-mono">Formula Result: LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={userClosingBalance}
                    onChange={(e) => setUserClosingBalance(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-right text-xl font-black focus:ring-2 focus:outline-none ${
                      userClosingBalance !== '' && !isMathBalanced
                        ? 'border-rose-500 text-rose-300 focus:ring-rose-500'
                        : 'border-emerald-500/80 text-emerald-300 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleSaveLedger}
                  disabled={savingLedger || loadingLedger}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {savingLedger ? 'Saving...' : 'Save & Verify Ledger'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className={`p-6 rounded-2xl border backdrop-blur shadow-xl transition-all ${
                userClosingBalance === ''
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : isMathBalanced
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50'
                  : 'bg-rose-950/80 border-rose-500/80 text-rose-100 shadow-rose-950/50'
              }`}>
                <div className="flex items-center gap-3 border-b border-current/20 pb-4 mb-4">
                  <ShieldCheck className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight uppercase">
                      {userClosingBalance === '' ? 'Awaiting Input' : isMathBalanced ? '100% Math Balanced' : 'Math Mismatch Alert'}
                    </h3>
                    <p className="text-xs opacity-80">Automatic Ledger Formula Verification</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center font-mono">
                    <span className="opacity-75">Calculated Closing:</span>
                    <span className="font-bold text-base">LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="opacity-75">Entered Closing:</span>
                    <span className="font-bold text-base">LKR {userClosingNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="border-t border-current/20 pt-3 flex justify-between items-center font-bold">
                    <span>Formula Discrepancy:</span>
                    <span className={`text-base font-mono ${isMathBalanced ? 'text-emerald-300' : 'text-rose-300 underline'}`}>
                      LKR {mathDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Date Continuity Verification
                </h4>
                {previousClosing !== null ? (
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Last Recorded Date ({previousDate}):</span>
                      <span className="font-mono font-bold">LKR {previousClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {isContinuityMismatch ? (
                      <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Opening balance differs from previous closing balance!</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Opening balance matches previous day closing!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No previous ledger entry found for continuity check.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Daily Expenses Itemization (දිනපතා වියදම් ලැයිස්තුව)</h3>
                <p className="text-xs text-slate-400">Specify tea, garbage bags, stationary and other daily shop expenses.</p>
              </div>
              <button
                onClick={addExpenseRow}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Expense Item
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No itemized expenses added. Click &quot;Add Expense Item&quot; to list items.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Description (e.g. Tea, Stapler pins)"
                      value={exp.description}
                      onChange={(e) => updateExpenseRow(idx, 'description', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount (LKR)"
                      value={exp.amount}
                      onChange={(e) => updateExpenseRow(idx, 'amount', e.target.value)}
                      className="w-40 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold text-right"
                    />
                    <button
                      onClick={() => removeExpenseRow(idx)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2 text-xs font-bold text-slate-300 font-mono">
                  Total Itemized Expenses: LKR {detailedExpensesSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: 11-BRANCH MATRIX CONTENT            */}
      {/* ========================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Days Entered ({selectedYear})</p>
                <p className="text-3xl font-black text-white mt-1">{grandTotalEntered} Days</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Mismatch Days</p>
                <p className={`text-3xl font-black mt-1 ${grandTotalFlagged > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {grandTotalFlagged} Days
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                grandTotalFlagged > 0 ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Branches Tracked</p>
                <p className="text-3xl font-black text-white mt-1">{matrixBranches.length} Branches</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Completion Progress Matrix ({selectedYear})
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold text-xs"
                >
                  <option value="2024">Year 2024</option>
                  <option value="2025">Year 2025</option>
                  <option value="2026">Year 2026</option>
                </select>
                <button
                  onClick={fetchMatrix}
                  disabled={loadingMatrix}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition disabled:opacity-50"
                  title="Refresh Matrix"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingMatrix ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingMatrix ? (
              <div className="p-12 text-center text-slate-400 animate-pulse font-medium">
                Loading 11 Branches Matrix...
              </div>
            ) : matrixError ? (
              <div className="p-8 bg-rose-950/50 text-rose-300 text-sm font-semibold text-center">
                {matrixError}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-950 min-w-[140px] z-10">Branch</th>
                      {MONTH_NAMES.map((m, idx) => (
                        <th key={idx} className="py-3.5 px-3 text-center min-w-[75px]">{m}</th>
                      ))}
                      <th className="py-3.5 px-4 text-right min-w-[90px]">Total Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {matrixBranches.map((b) => {
                      const item = matrixData[b.id];
                      return (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-extrabold text-white sticky left-0 bg-slate-950 z-10 flex items-center justify-between">
                            <span>{b.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({b.id})</span>
                          </td>

                          {MONTH_NAMES.map((_, mIdx) => {
                            const mKey = `${selectedYear}-${String(mIdx + 1).padStart(2, '0')}`;
                            const mData = item?.months?.[mKey];
                            const count = mData?.entered_count || 0;
                            const flagged = mData?.flagged_count || 0;

                            let badgeColor = 'bg-slate-950 text-slate-500 border-slate-800';
                            if (count >= 25) {
                              badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
                            } else if (count > 0) {
                              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
                            }

                            return (
                              <td key={mIdx} className="py-3 px-2 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedBranch(b.id);
                                    handleTabSwitch('entry');
                                  }}
                                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition hover:scale-105 ${badgeColor}`}
                                  title={`${count} days entered in ${mKey}. Click to enter data.`}
                                >
                                  <span>{count}</span>
                                  {flagged > 0 && (
                                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" title={`${flagged} flagged days`} />
                                  )}
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
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
            <Button onClick={() => setShowAddJournalModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 gap-2 w-full md:w-auto">
              <Plus className="w-4 h-4" /> Add Journal Entry
            </Button>
          </div>

          <Dialog open={showAddJournalModal} onOpenChange={setShowAddJournalModal}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">New Journal Entry</DialogTitle>
                <DialogDescription>Debits and Credits must balance identically to process.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="font-bold">Date</Label>
                     <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} readOnly className="bg-slate-50"/>
                   </div>
                   <div className="space-y-2">
                     <Label className="font-bold">Reference Code</Label>
                     <Input value={newRef} onChange={e => setNewRef(e.target.value)} placeholder="REF-001" />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="font-bold">Description</Label>
                   <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Loan disbursement from vault..." />
                </div>
                
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <Label className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4 block">Transaction Rows</Label>
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                       <div key={index} className="grid grid-cols-3 gap-3">
                         <Input placeholder="General Account" value={line.account} onChange={e => updateJournalLine(index, 'account', e.target.value)} />
                         <Input placeholder="Debit (Dr)" type="number" value={line.debit} onChange={e => updateJournalLine(index, 'debit', e.target.value)} />
                         <Input placeholder="Credit (Cr)" type="number" value={line.credit} onChange={e => updateJournalLine(index, 'credit', e.target.value)} />
                       </div>
                    ))}
                  </div>
                  <Button variant="link" onClick={handleAddJournalLine} className="px-0 mt-2 font-bold text-blue-600">+ Add line</Button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddJournalModal(false)}>Cancel</Button>
                <Button onClick={handleJournalSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Lock Entry</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm text-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entries</p>
              <p className="text-3xl font-black text-slate-800">{filteredJournalEntries.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm text-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Debit (Dr)</p>
              <p className="text-3xl font-black text-slate-800">Rs. {totalJournalDebit.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm text-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Credit (Cr)</p>
              <p className="text-3xl font-black text-slate-800">Rs. {totalJournalCredit.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Trial Balance</p>
              <p className={`text-3xl font-black ${Math.abs(totalJournalDebit - totalJournalCredit) < 0.1 ? 'text-white' : 'text-rose-500'}`}>
                 Rs. {Math.abs(totalJournalDebit - totalJournalCredit).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4 text-slate-800">
             <div className="flex-1">
                <Input type="date" value={filterJournalDate} onChange={(e) => setFilterJournalDate(e.target.value)} className="w-full md:w-64" />
             </div>
             {filterJournalDate && <Button variant="outline" onClick={() => setFilterJournalDate("")}><X className="w-4 h-4 mr-2"/> Clear Filter</Button>}
          </div>

          <div className="space-y-6">
            {loadingJournal ? (
               <p className="text-center font-bold text-slate-400">Loading ledger logs...</p>
            ) : filteredJournalEntries.length === 0 ? (
               <p className="text-center font-bold text-slate-400">No journal entries found.</p>
            ) : filteredJournalEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-slate-800">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">{entry.id}</span>
                         <span className="text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</span>
                         <span className="text-xs font-bold text-slate-500">Ref: {entry.reference || 'N/A'}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mt-2">{entry.description}</p>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      Auth by {entry.created_by}
                   </span>
                </div>
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Account</TableHead>
                       <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider text-right">Debit</TableHead>
                       <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider text-right">Credit</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {entry.journal_entry_line && entry.journal_entry_line.map((line: any) => (
                        <TableRow key={line.id}>
                           <TableCell className="font-semibold text-slate-700">{line.account_name}</TableCell>
                           <TableCell className="text-right font-black text-slate-800">{line.debit > 0 ? `Rs. ${line.debit.toLocaleString()}` : '-'}</TableCell>
                           <TableCell className="text-right font-black text-slate-800">{line.credit > 0 ? `Rs. ${line.credit.toLocaleString()}` : '-'}</TableCell>
                        </TableRow>
                     ))}
                     <TableRow className="bg-slate-50/50">
                        <TableCell className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Total Transaction Value</TableCell>
                        <TableCell className="text-right font-black text-slate-900 text-lg border-t-2 border-slate-300">Rs. {entry.total_debit?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black text-slate-900 text-lg border-t-2 border-slate-300">Rs. {entry.total_credit?.toLocaleString()}</TableCell>
                     </TableRow>
                   </TableBody>
                </Table>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm text-slate-300">Loading Pawning Ledger & Audit System...</p>
        </div>
      </div>
    }>
      <MainLedgerContent />
    </Suspense>
  );
}
