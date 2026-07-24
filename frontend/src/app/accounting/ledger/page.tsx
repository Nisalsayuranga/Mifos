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

interface TransactionRow {
  loan_no: string;
  cash_loan: number | string;
  insurance_rs: number | string;
  weight_g: number | string;
  weight_mg: number | string;
  item_code: string;
  redeem_no: string;
  interest_rs: number | string;
  cash_received: number | string;
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
  const [loanIssuedTotal, setLoanIssuedTotal] = useState<string | number>('');
  const [redemptionTotal, setRedemptionTotal] = useState<string | number>('');
  const [interestRecTotal, setInterestRecTotal] = useState<string | number>('');
  const [recoveryTotal, setRecoveryTotal] = useState<string | number>('');
  const [insuranceTotal, setInsuranceTotal] = useState<string | number>('');
  const [expensesTotal, setExpensesTotal] = useState<string | number>('');
  const [userClosingBalance, setUserClosingBalance] = useState<string | number>('');
  const [actualCashCount, setActualCashCount] = useState<string | number>('');
  const [staffShift, setStaffShift] = useState('');

  // Structured Staff Shifts / Attendance
  const [shiftList, setShiftList] = useState<StaffShiftItem[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newCheckIn, setNewCheckIn] = useState('08:00');
  const [newCheckOut, setNewCheckOut] = useState('17:30');
  const [newShiftStatus, setNewShiftStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');

  const handleAddShift = () => {
    if (!newStaffName.trim()) return;
    const item: StaffShiftItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newStaffName.trim(),
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      status: newShiftStatus
    };
    setShiftList(prev => [...prev, item]);
    setNewStaffName('');
  };

  const handleRemoveShift = (id: string) => {
    setShiftList(prev => prev.filter(s => s.id !== id));
  };

  const formattedShiftString = useMemo(() => {
    return shiftList.map(s => {
      const timeStr = `${s.checkIn}-${s.checkOut}`;
      return s.status === 'ABSENT' ? `${s.name} (${timeStr} / AB)` : `${s.name} (${timeStr})`;
    }).join(', ');
  }, [shiftList]);

  useEffect(() => {
    setStaffShift(formattedShiftString);
  }, [formattedShiftString]);

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
      } else {
        // Non-JSON response (e.g. server error HTML)
        setPreviousClosing(null);
        setPreviousDate(null);
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

  // Auto sum detailed transaction table into summary figures
  const detailedLoansSum = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.cash_loan) || 0), 0);
  }, [transactions]);

  const detailedRedemptionsSum = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.cash_received) || 0), 0);
  }, [transactions]);

  const detailedInterestSum = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.interest_rs) || 0), 0);
  }, [transactions]);

  const detailedInsuranceSum = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.insurance_rs) || 0), 0);
  }, [transactions]);

  useEffect(() => {
    if (expenses.length > 0) {
      setExpensesTotal(detailedExpensesSum);
    }
  }, [detailedExpensesSum, expenses.length]);

  useEffect(() => {
    if (transactions.length > 0) {
      if (detailedLoansSum > 0) setLoanIssuedTotal(detailedLoansSum);
      if (detailedRedemptionsSum > 0) setRedemptionTotal(detailedRedemptionsSum);
      if (detailedInterestSum > 0) setInterestRecTotal(detailedInterestSum);
      if (detailedInsuranceSum > 0) setInsuranceTotal(detailedInsuranceSum);
    }
  }, [detailedLoansSum, detailedRedemptionsSum, detailedInterestSum, detailedInsuranceSum, transactions.length]);

  const addTransactionRow = () => {
    setTransactions(prev => [
      ...prev,
      {
        loan_no: '',
        cash_loan: '',
        insurance_rs: '',
        weight_g: '',
        weight_mg: '',
        item_code: '',
        redeem_no: '',
        interest_rs: '',
        cash_received: '',
        remarks: ''
      }
    ]);
  };

  const removeTransactionRow = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const updateTransactionRow = (index: number, field: keyof TransactionRow, val: any) => {
    setTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

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
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error) {
          setMatrixError(data.error);
        } else {
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
      
      {/* Crisp White Header Bar matching Mifos Design System */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            Pawning Ledger & Audit System
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Manage multi-branch daily paper log records, 11-branch completion matrix, and general journal logs.
          </p>
        </div>

        {/* Clean Light Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('entry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'entry'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Daily Ledger Entry
          </button>
          <button
            onClick={() => handleTabSwitch('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            11-Branch Matrix
          </button>
          <button
            onClick={() => handleTabSwitch('journal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'journal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              feedback.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Clean Controls Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Branch Selection
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!isHqUser}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75"
              >
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Ledger Date
              </label>
              <input
                type="date"
                value={ledgerDate}
                onChange={(e) => setLedgerDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Interactive Staff Shifts & Attendance Builder */}
            <div className="space-y-3 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Staff Shifts / Attendance (සේවක පැමිණීම)
                </span>
                <span className="text-[11px] font-bold text-slate-500">{shiftList.length} Staff Logged</span>
              </label>

              {/* Add Shift Control Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Staff Name (e.g. Achini, Dahami)"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">In:</span>
                  <input
                    type="text"
                    placeholder="08:00"
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono text-center font-bold"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">Out:</span>
                  <input
                    type="text"
                    placeholder="17:30"
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono text-center font-bold"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-1">
                  <select
                    value={newShiftStatus}
                    onChange={(e: any) => setNewShiftStatus(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 text-[11px] font-bold text-slate-800"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent (AB)</option>
                  </select>
                  <Button
                    onClick={handleAddShift}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-2.5 text-xs shrink-0"
                  >
                    + Check-In
                  </Button>
                </div>
              </div>

              {/* Active Shift Log Pills */}
              {shiftList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                  {shiftList.map((s) => (
                    <span
                      key={s.id}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition ${
                        s.status === 'ABSENT'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full inline-block bg-current" />
                      <span>{s.name}</span>
                      <span className="font-mono text-[11px] opacity-85">({s.checkIn} - {s.checkOut}{s.status === 'ABSENT' ? ' / AB' : ''})</span>
                      <button
                        onClick={() => handleRemoveShift(s.id)}
                        className="hover:bg-slate-200/60 p-0.5 rounded-full text-slate-500 hover:text-slate-900 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Paper Ledger Transactions Sheet (Red Circled Section) */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  Daily Paper Transactions Log (ඉහළ ගනුදෙනු ලැයිස්තුව Grid)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Enter individual loans issued, redemptions, weights, codes & interest items as written in top red section of ledger book.
                </p>
              </div>
              <Button
                onClick={addTransactionRow}
                variant="outline"
                className="font-bold text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                + Add Transaction Bill Line
              </Button>
            </div>

            {transactions.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">No individual transaction bills entered yet.</p>
                <p className="text-[11px] text-slate-400">Click &quot;+ Add Transaction Bill Line&quot; to enter Loan No, Cash, Weight, Redeem No, Interest & Insurance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                      <th className="py-2.5 px-2 min-w-[90px]">Loan No</th>
                      <th className="py-2.5 px-2 min-w-[100px] text-right">Cash (Loan)</th>
                      <th className="py-2.5 px-2 min-w-[80px] text-right">Insurance</th>
                      <th className="py-2.5 px-2 min-w-[70px] text-center">Weight g</th>
                      <th className="py-2.5 px-2 min-w-[70px] text-center">Weight mg</th>
                      <th className="py-2.5 px-2 min-w-[70px] text-center">Code</th>
                      <th className="py-2.5 px-2 min-w-[90px]">Redeem No</th>
                      <th className="py-2.5 px-2 min-w-[100px] text-right">Interest Rs</th>
                      <th className="py-2.5 px-2 min-w-[100px] text-right">Cash (Redeem)</th>
                      <th className="py-2.5 px-2 min-w-[70px] text-center">Type</th>
                      <th className="py-2.5 px-2 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-1.5">
                          <input
                            type="text"
                            placeholder="e.g. 1R 256"
                            value={t.loan_no}
                            onChange={(e) => updateTransactionRow(idx, 'loan_no', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="23590"
                            value={t.cash_loan}
                            onChange={(e) => updateTransactionRow(idx, 'cash_loan', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-rose-700"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={t.insurance_rs}
                            onChange={(e) => updateTransactionRow(idx, 'insurance_rs', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            placeholder="25"
                            value={t.weight_g}
                            onChange={(e) => updateTransactionRow(idx, 'weight_g', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            placeholder="060"
                            value={t.weight_mg}
                            onChange={(e) => updateTransactionRow(idx, 'weight_mg', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center text-xs text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="text"
                            placeholder="CH"
                            value={t.item_code}
                            onChange={(e) => updateTransactionRow(idx, 'item_code', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs uppercase text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="text"
                            placeholder="1R 175"
                            value={t.redeem_no}
                            onChange={(e) => updateTransactionRow(idx, 'redeem_no', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="1641.26"
                            value={t.interest_rs}
                            onChange={(e) => updateTransactionRow(idx, 'interest_rs', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="32825"
                            value={t.cash_received}
                            onChange={(e) => updateTransactionRow(idx, 'cash_received', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="text"
                            placeholder="R"
                            value={t.remarks}
                            onChange={(e) => updateTransactionRow(idx, 'remarks', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            onClick={() => removeTransactionRow(idx)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold font-mono text-xs border-t-2 border-slate-300">
                      <td className="py-2 px-2 uppercase text-slate-700">TOTALS:</td>
                      <td className="py-2 px-2 text-right text-rose-700">LKR {detailedLoansSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-2 text-right text-emerald-700">LKR {detailedInsuranceSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={4} className="py-2 px-2 text-center text-slate-500 font-normal">Auto-summed to summary box below ↓</td>
                      <td className="py-2 px-2 text-right text-emerald-700">LKR {detailedInterestSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-2 text-right text-emerald-700">LKR {detailedRedemptionsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side: Paper Ledger Form */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Daily Cash Ledger Figures
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                  <span className="font-bold">CP Balance:</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cpBalance}
                    onChange={(e) => setCpBalance(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-700 font-bold uppercase">
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
                    className={`w-full bg-slate-50 border rounded-lg px-3.5 py-2 text-slate-900 font-bold text-right text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      isContinuityMismatch ? 'border-amber-500 text-amber-900 bg-amber-50/50' : 'border-slate-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-emerald-700 font-extrabold uppercase">Transfer In (+)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferIn}
                      onChange={(e) => setTransferIn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-emerald-700 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-rose-700 font-extrabold uppercase">Transfer Out (-)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferOut}
                      onChange={(e) => setTransferOut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-rose-700 font-bold text-right focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-rose-700 font-extrabold uppercase">Loans Issued Total (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={loanIssuedTotal}
                    onChange={(e) => setLoanIssuedTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-rose-700 font-bold text-right text-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-700 font-extrabold uppercase">Redemptions Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={redemptionTotal}
                    onChange={(e) => setRedemptionTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-emerald-700 font-bold text-right text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-700 font-extrabold uppercase">Interest Rec: Int (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={interestRecTotal}
                    onChange={(e) => setInterestRecTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-emerald-700 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-700 font-extrabold uppercase">Recovery Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={recoveryTotal}
                    onChange={(e) => setRecoveryTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-emerald-700 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-emerald-700 font-extrabold uppercase">Insurance Total (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={insuranceTotal}
                    onChange={(e) => setInsuranceTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-emerald-700 font-bold text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-rose-700 font-extrabold uppercase">Daily Expenses Total (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expensesTotal}
                    onChange={(e) => setExpensesTotal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-rose-700 font-bold text-right focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-200 pt-3 md:col-span-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-700">
                    <span>Closing Balance (ලෙජර් අවසාන ශේෂය)</span>
                    <span className="text-blue-700 text-[11px] font-mono">Formula Result: LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={userClosingBalance}
                    onChange={(e) => setUserClosingBalance(e.target.value)}
                    className={`w-full border rounded-lg px-4 py-2.5 text-right text-xl font-black focus:ring-2 focus:outline-none ${
                      userClosingBalance !== '' && !isMathBalanced
                        ? 'bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-500'
                        : 'bg-emerald-50/50 border-emerald-500 text-emerald-900 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveLedger}
                  disabled={savingLedger || loadingLedger}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 gap-2"
                >
                  <Save className="w-5 h-5" />
                  {savingLedger ? 'Saving...' : 'Save & Verify Ledger'}
                </Button>
              </div>
            </div>

            {/* Right Side: Clean Verification Engine Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`p-6 rounded-xl border shadow-sm transition-all ${
                userClosingBalance === ''
                  ? 'bg-white border-slate-200 text-slate-700'
                  : isMathBalanced
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-3 border-b border-current/20 pb-4 mb-4">
                  <ShieldCheck className="w-8 h-8 shrink-0" />
                  <div>
                    <h3 className="font-black text-base tracking-tight uppercase">
                      {userClosingBalance === '' ? 'Awaiting Input' : isMathBalanced ? '100% Math Balanced' : 'Math Mismatch Alert'}
                    </h3>
                    <p className="text-xs opacity-80">Automatic Ledger Formula Verification</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center font-mono">
                    <span className="opacity-75 font-semibold">Calculated Closing:</span>
                    <span className="font-bold text-base">LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="opacity-75 font-semibold">Entered Closing:</span>
                    <span className="font-bold text-base">LKR {userClosingNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="border-t border-current/20 pt-3 flex justify-between items-center font-bold">
                    <span>Formula Discrepancy:</span>
                    <span className={`text-base font-mono ${isMathBalanced ? 'text-emerald-700' : 'text-rose-700 underline'}`}>
                      LKR {mathDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-600" />
                  Date Continuity Verification
                </h4>
                {previousClosing !== null ? (
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Last Recorded Date ({previousDate}):</span>
                      <span className="font-mono font-bold">LKR {previousClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {isContinuityMismatch ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Opening balance differs from previous closing balance!</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
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

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800">Daily Expenses Itemization (දිනපතා වියදම් ලැයිස්තුව)</h3>
                <p className="text-xs text-slate-500 font-medium">Specify tea, garbage bags, stationary and other daily shop expenses.</p>
              </div>
              <Button
                onClick={addExpenseRow}
                variant="outline"
                className="font-bold text-xs gap-1.5"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Add Expense Item
              </Button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No itemized expenses added. Click &quot;Add Expense Item&quot; to list items.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      placeholder="Description (e.g. Tea, Stapler pins)"
                      value={exp.description}
                      onChange={(e) => updateExpenseRow(idx, 'description', e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount (LKR)"
                      value={exp.amount}
                      onChange={(e) => updateExpenseRow(idx, 'amount', e.target.value)}
                      className="w-40 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold text-right"
                    />
                    <button
                      onClick={() => removeExpenseRow(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2 text-xs font-bold text-slate-800 font-mono">
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm text-slate-700">Loading Pawning Ledger & Audit System...</p>
        </div>
      </div>
    }>
      <MainLedgerContent />
    </Suspense>
  );
}
