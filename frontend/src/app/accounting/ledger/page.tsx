'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Building2, Calendar, Calculator, CheckCircle2, AlertTriangle, 
  FileSpreadsheet, Plus, Trash2, Save, RefreshCw, UserCheck,
  Layers, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TransactionRow {
  id: string;
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
  id: string;
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

  // User State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHqUser, setIsHqUser] = useState(false);

  // Controls
  const [selectedBranch, setSelectedBranch] = useState(branchParam || 'BRL');
  const [ledgerDate, setLedgerDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cpBalance, setCpBalance] = useState<string | number>('');

  // Daily Cash Figures
  const [openingBalance, setOpeningBalance] = useState<string | number>('');
  const [transferIn, setTransferIn] = useState<string | number>('');
  const [transferOut, setTransferOut] = useState<string | number>('');
  const [recoveryTotal, setRecoveryTotal] = useState<string | number>('');
  const [userClosingBalance, setUserClosingBalance] = useState<string | number>('');

  // Transactions & Expenses
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
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

  // Sync Staff Shift String
  const staffShiftString = useMemo(() => {
    return shiftList.map(s => {
      const timeStr = `${s.checkIn}-${s.checkOut}`;
      return s.status === 'ABSENT' ? `${s.name} (${timeStr} / AB)` : `${s.name} (${timeStr})`;
    }).join(', ');
  }, [shiftList]);

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

  // Transaction Table Row Handlers
  const handleAddTransactionRow = () => {
    setTransactions(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
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

  const handleRemoveTransactionRow = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTransactionRow = (index: number, field: keyof TransactionRow, val: any) => {
    setTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Expenses Handlers
  const handleAddExpenseRow = () => {
    setExpenses(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), description: '', amount: '' }]);
  };

  const handleRemoveExpenseRow = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExpenseRow = (index: number, field: keyof ExpenseRow, val: any) => {
    setExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Auto-calculated Totals
  const totalLoansIssued = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.cash_loan) || 0), 0);
  }, [transactions]);

  const totalRedemptions = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.cash_received) || 0), 0);
  }, [transactions]);

  const totalInterestCollected = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.interest_rs) || 0), 0);
  }, [transactions]);

  const totalInsuranceCollected = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.insurance_rs) || 0), 0);
  }, [transactions]);

  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Formula Closing Balance
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

          if (data.transactions && Array.isArray(data.transactions)) {
            setTransactions(data.transactions.map((t: any) => ({
              id: t.id || Math.random().toString(),
              loan_no: t.loan_no || t.bill_no || '',
              cash_loan: t.cash_loan || t.amount || '',
              insurance_rs: t.insurance_rs || '',
              weight_g: t.weight_g || '',
              weight_mg: t.weight_mg || '',
              item_code: t.item_code || '',
              redeem_no: t.redeem_no || '',
              interest_rs: t.interest_rs || '',
              cash_received: t.cash_received || '',
              remarks: t.remarks || ''
            })));
          } else {
            setTransactions([]);
          }

          if (data.expenses && Array.isArray(data.expenses)) {
            setExpenses(data.expenses.map((e: any) => ({
              id: e.id || Math.random().toString(),
              description: e.description || '',
              amount: e.amount || ''
            })));
          } else {
            setExpenses([]);
          }
        } else {
          setCpBalance('');
          setOpeningBalance(data.previous_closing !== null ? data.previous_closing : '');
          setTransferIn('');
          setTransferOut('');
          setRecoveryTotal('');
          setUserClosingBalance('');
          setTransactions([]);
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
      staff_shift: staffShiftString,
      created_by: currentUser?.email || 'Teller',
      status: 'APPROVED',
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
        setFeedback({
          type: 'success',
          message: `Daily Ledger for ${selectedBranch} on ${ledgerDate} saved successfully!`
        });
        fetchLedgerData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingLedger(false);
    }
  };

  // Matrix State
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
      if (res.ok) {
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

  // Journal Logs
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
    <div className="w-full min-w-0 space-y-6 pb-24">
      
      {/* Clean White Main Title Bar */}
      <div className="w-full bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-blue-600 shrink-0" />
            Daily Transaction Ledger & Summary
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5">
            Exact Digital Twin of Paper Ledger Book & Excel Sheet (Daily Financial Ledger)
          </p>
        </div>

        {/* Clean Light Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => handleTabSwitch('entry')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'entry' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Daily Entry Sheet
          </button>
          <button
            onClick={() => handleTabSwitch('matrix')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            11-Branch Matrix
          </button>
          <button
            onClick={() => handleTabSwitch('journal')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
              activeTab === 'journal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            General Journal
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 1: DAILY LEDGER ENTRY SHEET            */}
      {/* ========================================== */}
      {activeTab === 'entry' && (
        <div className="w-full space-y-6">
          {feedback && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold w-full ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              feedback.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Top Control Header Card */}
          <div className="w-full bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 w-full">
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!isHqUser}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-75"
                >
                  {BRANCHES.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[180px] space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Ledger Date
                </label>
                <input
                  type="date"
                  value={ledgerDate}
                  onChange={(e) => setLedgerDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="w-full md:w-48 space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">CP Balance</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cpBalance}
                  onChange={(e) => setCpBalance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Staff Attendance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Staff Name (Achini)"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                  <Button onClick={handleAddShift} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-3 text-xs shrink-0">
                    + Add
                  </Button>
                </div>
              </div>
            </div>

            {shiftList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 w-full">
                {shiftList.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-xs font-bold">
                    <span>{s.name} ({s.checkIn}-{s.checkOut})</span>
                    <button onClick={() => handleRemoveShift(s.id)} className="text-slate-400 hover:text-slate-800 text-sm font-black">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 1: TOP DAILY TRANSACTIONS GRID (EXCEL SHEET DIRECT TABLE) */}
          <div className="w-full bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0" />
                  Daily Paper Transactions Log Sheet (ඉහළ ගනුදෙනු ලැයිස්තුව Grid)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Type individual loans & redemptions directly in rows below. Totals are auto-calculated at bottom.
                </p>
              </div>
              <Button
                onClick={handleAddTransactionRow}
                variant="outline"
                size="sm"
                className="font-bold text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 shrink-0"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                + Add Bill Row
              </Button>
            </div>

            <div className="overflow-x-auto w-full border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs min-w-[950px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                    <th className="py-2.5 px-2.5 min-w-[110px]">Loan No</th>
                    <th className="py-2.5 px-2.5 min-w-[110px] text-right">Cash (Loan)</th>
                    <th className="py-2.5 px-2.5 min-w-[90px] text-right">Insurance</th>
                    <th className="py-2.5 px-2.5 min-w-[75px] text-center">Weight g</th>
                    <th className="py-2.5 px-2.5 min-w-[75px] text-center">Weight mg</th>
                    <th className="py-2.5 px-2.5 min-w-[75px] text-center">Code</th>
                    <th className="py-2.5 px-2.5 min-w-[110px]">Redeem No</th>
                    <th className="py-2.5 px-2.5 min-w-[110px] text-right">Interest Rs</th>
                    <th className="py-2.5 px-2.5 min-w-[110px] text-right">Cash (Redeem)</th>
                    <th className="py-2.5 px-2.5 min-w-[75px] text-center">Type</th>
                    <th className="py-2.5 px-2 w-[40px] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                        No transactions added yet. Click &quot;+ Add Bill Row&quot; above to add rows.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="1R 256"
                            value={t.loan_no}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'loan_no', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="23590"
                            value={t.cash_loan}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'cash_loan', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-rose-700"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={t.insurance_rs}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'insurance_rs', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            placeholder="25"
                            value={t.weight_g}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'weight_g', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            placeholder="060"
                            value={t.weight_mg}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'weight_mg', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center text-xs text-slate-800"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="CH"
                            value={t.item_code}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'item_code', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs uppercase text-slate-900"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="1R 175"
                            value={t.redeem_no}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'redeem_no', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="1641.26"
                            value={t.interest_rs}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'interest_rs', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="32825"
                            value={t.cash_received}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'cash_received', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-emerald-700"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            placeholder="R"
                            value={t.remarks}
                            onChange={(e) => handleUpdateTransactionRow(idx, 'remarks', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-xs text-slate-800"
                          />
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <button
                            onClick={() => handleRemoveTransactionRow(idx)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold font-mono text-xs border-t-2 border-slate-300">
                    <td className="py-2.5 px-2.5 uppercase text-slate-800 font-black">TOTALS:</td>
                    <td className="py-2.5 px-2.5 text-right text-rose-700">LKR {totalLoansIssued.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-2.5 text-right text-emerald-700">LKR {totalInsuranceCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td colSpan={4} className="py-2.5 px-2.5 text-center text-slate-500 font-normal">Auto-calculated formula sum ↓</td>
                    <td className="py-2.5 px-2.5 text-right text-emerald-700">LKR {totalInterestCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-2.5 text-right text-emerald-700">LKR {totalRedemptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 2: CLEAN FULL-WIDTH STACKED SUMMARY & EXPENSES CARDS */}
          <div className="w-full flex flex-col gap-6">
            
            {/* Daily Cash Summary (Formula Table) */}
            <div className="w-full bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Calculator className="w-5 h-5 text-blue-600 shrink-0" />
                Daily Cash Summary (දිනපතා මුදල් සාරාංශය)
              </h3>

              <div className="space-y-3 text-xs font-bold w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
                  <span className="text-slate-800 font-bold">Opening Balance (ආරම්භක ශේෂය):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-slate-900"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
                  <span className="text-emerald-700 font-bold">Transfer In (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferIn}
                    onChange={(e) => setTransferIn(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-emerald-700"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
                  <span className="text-rose-700 font-bold">Transfer Out (-):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferOut}
                    onChange={(e) => setTransferOut(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-rose-700"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 gap-2">
                  <span className="font-bold">Loan Issued Total (-) [Auto-Sum]:</span>
                  <span className="font-mono text-sm font-black">LKR {totalLoansIssued.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 gap-2">
                  <span className="font-bold">Redemption Total (+) [Auto-Sum]:</span>
                  <span className="font-mono text-sm font-black">LKR {totalRedemptions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 gap-2">
                  <span className="font-bold">Rec: Interest Total (+) [Auto-Sum]:</span>
                  <span className="font-mono text-sm font-black">LKR {totalInterestCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
                  <span className="text-emerald-700 font-bold">Recovery Total (+):</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={recoveryTotal}
                    onChange={(e) => setRecoveryTotal(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-slate-300 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-emerald-700"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 gap-2">
                  <span className="font-bold">Insurance Rec (+) [Auto-Sum]:</span>
                  <span className="font-mono text-sm font-black">LKR {totalInsuranceCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 gap-2">
                  <span className="font-bold">Expenses Total (-) [Itemized Below]:</span>
                  <span className="font-mono text-sm font-black">LKR {totalExpensesSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-100 border-2 border-emerald-400 rounded-xl text-emerald-950 text-base font-black gap-2">
                  <span>Closing Balance (අවසාන ශේෂය):</span>
                  <span className="font-mono text-xl">LKR {calculatedClosing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  onClick={handleSaveLedger}
                  disabled={savingLedger || loadingLedger}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm gap-2 rounded-xl shadow-sm"
                >
                  <Save className="w-5 h-5" />
                  {savingLedger ? 'Saving Ledger...' : 'Update & Save Ledger for ' + ledgerDate}
                </Button>
              </div>
            </div>

            {/* Itemized Expenses Card */}
            <div className="w-full bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900">Itemized Expenses (දිනපතා වියදම්)</h3>
                <Button onClick={handleAddExpenseRow} variant="outline" size="sm" className="h-8 text-xs font-bold border-blue-300 text-blue-700">
                  + Add Expense Line
                </Button>
              </div>

              {expenses.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">No expenses added yet. Click &quot;+ Add Expense Line&quot; to list tea, stationary, cleaning items.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {expenses.map((exp, idx) => (
                    <div key={exp.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Expense description (Tea, Stationary)"
                        value={exp.description}
                        onChange={(e) => handleUpdateExpenseRow(idx, 'description', e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={exp.amount}
                        onChange={(e) => handleUpdateExpenseRow(idx, 'amount', e.target.value)}
                        className="w-full sm:w-36 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-mono font-bold text-right text-rose-700"
                      />
                      <button onClick={() => handleRemoveExpenseRow(idx)} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded self-end sm:self-auto">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 text-xs font-bold text-slate-800 font-mono">
                    Total Expenses: LKR {totalExpensesSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: 11-BRANCH MATRIX                    */}
      {/* ========================================== */}
      {activeTab === 'matrix' && (
        <div className="w-full space-y-6">
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

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-full">
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
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
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
      {/* TAB 3: GENERAL JOURNAL LEDGER LOGS         */}
      {/* ========================================== */}
      {activeTab === 'journal' && (
        <div className="w-full space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4 text-slate-800 w-full">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">General Ledger</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Record and view strict double-entry journal logs.</p>
            </div>
          </div>

          <div className="space-y-6 w-full">
            {loadingJournal ? (
               <p className="text-center font-bold text-slate-400">Loading ledger logs...</p>
            ) : journalEntries.length === 0 ? (
               <p className="text-center font-bold text-slate-400">No journal entries found.</p>
            ) : journalEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-slate-800 w-full">
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
