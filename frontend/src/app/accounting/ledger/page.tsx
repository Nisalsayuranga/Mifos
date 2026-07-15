'use client';

import { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  // Form State
  const [newDesc, setNewDesc] = useState("");
  const [newRef, setNewRef] = useState("");
  const [lines, setLines] = useState([{ account: "", debit: "", credit: "" }, { account: "", debit: "", credit: "" }]);

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) setEntries(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const handleAddLine = () => setLines([...lines, { account: "", debit: "", credit: "" }]);
  
  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = async () => {
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
        setShowAddModal(false);
        setNewDesc(""); setNewRef("");
        setLines([{ account: "", debit: "", credit: "" }, { account: "", debit: "", credit: "" }]);
        loadEntries();
      } else {
        const errorData = await res.json();
        alert("Transaction Failed: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
      alert("System Error");
    }
  };

  const filteredEntries = filterDate ? entries.filter(e => e.date === filterDate) : entries;
  const totalDebit = filteredEntries.reduce((sum, e) => sum + parseFloat(e.total_debit), 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + parseFloat(e.total_credit), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">General Ledger</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Record and view strict double-entry journal logs.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 gap-2 w-full md:w-auto">
          <Plus className="w-4 h-4" /> Add Journal Entry
        </Button>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
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
                     <Input placeholder="General Account" value={line.account} onChange={e => updateLine(index, 'account', e.target.value)} />
                     <Input placeholder="Debit (Dr)" type="number" value={line.debit} onChange={e => updateLine(index, 'debit', e.target.value)} />
                     <Input placeholder="Credit (Cr)" type="number" value={line.credit} onChange={e => updateLine(index, 'credit', e.target.value)} />
                   </div>
                ))}
              </div>
              <Button variant="link" onClick={handleAddLine} className="px-0 mt-2 font-bold text-blue-600">+ Add line</Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Lock Entry</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entries</p>
          <p className="text-3xl font-black text-slate-800">{filteredEntries.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Debit (Dr)</p>
          <p className="text-3xl font-black text-slate-800">Rs. {totalDebit.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Credit (Cr)</p>
          <p className="text-3xl font-black text-slate-800">Rs. {totalCredit.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 shadow-xl shadow-slate-200/50">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Trial Balance</p>
          <p className={`text-3xl font-black ${Math.abs(totalDebit - totalCredit) < 0.1 ? 'text-white' : 'text-rose-500'}`}>
             Rs. {Math.abs(totalDebit - totalCredit).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4">
         <div className="flex-1">
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full md:w-64" />
         </div>
         {filterDate && <Button variant="outline" onClick={() => setFilterDate("")}><X className="w-4 h-4 mr-2"/> Clear Filter</Button>}
         <Button variant="outline" className="font-bold"><Download className="w-4 h-4 mr-2"/> Export</Button>
      </div>

      <div className="space-y-6">
        {loading ? (
           <p className="text-center font-bold text-slate-400">Loading ledger logs...</p>
        ) : filteredEntries.length === 0 ? (
           <p className="text-center font-bold text-slate-400">No journal entries found.</p>
        ) : filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
  );
}
