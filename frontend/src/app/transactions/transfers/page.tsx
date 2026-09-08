'use client';

import { useState, useEffect } from "react";
import { Plus, ArrowRightLeft, Download, CheckCircle, Clock, Building2, Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const vaults = ["Main Vault", "Branch Vault A", "Branch Vault B", "Branch Vault C", "ATM Vault 1", "ATM Vault 2"];

export default function VaultTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [fromVault, setFromVault] = useState("");
  const [toVault, setToVault] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("LKR");
  const [notes, setNotes] = useState("");

  const loadTransfers = async () => {
    try {
      const res = await fetch(`/api/transfers?status=${filterStatus}`);
      if (res.ok) setTransfers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransfers(); }, [filterStatus]);

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromVault, toVault, amount, currency, notes, initiatedBy: 'Current User' })
      });
      if (res.ok) {
        setShowAddModal(false);
        setFromVault(""); setToVault(""); setAmount(""); setNotes("");
        loadTransfers();
      } else {
        const errorData = await res.json();
        alert("Failed: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/transfers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, approvedBy: status === 'Completed' ? 'Admin' : undefined })
      });
      if (res.ok) loadTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  const totalTransferred = transfers.filter(t => t.status === "Completed").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const pendingTransfers = transfers.filter(t => t.status === "Pending").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Vault Logistics</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage, approve, and track massive cash logistics.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 gap-2 w-full md:w-auto">
          <Plus className="w-4 h-4" /> Move Capital
        </Button>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Initiate Vault Transfer</DialogTitle>
            <DialogDescription>A secondary approver must authorize this transfer before release.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="font-bold">Origin Entity</Label>
                 <Select onValueChange={(val) => val && setFromVault(val)} value={fromVault}>
                    <SelectTrigger><SelectValue placeholder="Select Origin" /></SelectTrigger>
                    <SelectContent>{vaults.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="font-bold">Destination Entity</Label>
                 <Select onValueChange={(val) => val && setToVault(val)} value={toVault}>
                    <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                    <SelectContent>{vaults.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="font-bold">Capital Amount</Label>
                 <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
               </div>
               <div className="space-y-2">
                 <Label className="font-bold">Denomination</Label>
                 <Select onValueChange={(val) => val && setCurrency(val)} value={currency}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="LKR">LKR (Rs)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            </div>
            <div className="space-y-2">
               <Label className="font-bold">Logistics Instructions / Notes</Label>
               <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for capital movement..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Request Final Approval</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-600 text-white rounded-xl p-5 shadow-xl shadow-emerald-500/20">
          <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Moved</p>
          <p className="text-3xl font-black">Rs. {totalTransferred.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xl shadow-slate-900/20">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Awaiting Approvals</p>
          <p className="text-3xl font-black">{pendingTransfers}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Vaults</p>
          <p className="text-3xl font-black text-slate-800">{vaults.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-center">
            <Building2 className="text-slate-200 w-16 h-16" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex gap-4">
         <div className="flex-1 max-w-xs">
             <Select onValueChange={(val) => val && setFilterStatus(val)} value={filterStatus}>
                <SelectTrigger className="font-semibold"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending Approvals</SelectItem>
                  <SelectItem value="Completed">Completed Logistics</SelectItem>
                  <SelectItem value="Rejected">Rejected Flags</SelectItem>
                </SelectContent>
              </Select>
         </div>
      </div>

      <div className="space-y-4">
        {loading ? (
            <p className="text-center font-bold text-slate-400">Loading vault activity...</p>
        ) : transfers.length === 0 ? (
            <p className="text-center font-bold text-slate-400">No transfers met the criteria.</p>
        ) : transfers.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center hover:border-slate-300 transition-colors">
             <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="hidden sm:flex w-14 h-14 bg-slate-100 rounded-full items-center justify-center">
                   <ArrowRightLeft className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                   <div className="flex items-center gap-3">
                       <h3 className="font-black text-lg text-slate-900">{t.id}</h3>
                       <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                       }`}>
                          {t.status}
                       </span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                       <Clock className="w-3 h-3"/> {new Date(t.date).toLocaleDateString()} AT {t.time}
                   </div>
                   <p className="text-slate-600 font-medium text-sm mt-2 flex items-center gap-2">
                       <Building2 className="w-4 h-4 text-slate-400"/>
                       <span className="font-bold text-slate-800">{t.from_vault}</span> 
                       <ArrowRightLeft className="w-3 h-3 text-slate-300" /> 
                       <span className="font-bold text-slate-800">{t.to_vault}</span>
                   </p>
                </div>
             </div>
             
             <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                 <div className="text-right">
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.currency}</p>
                     <p className="text-3xl font-black text-slate-900">{(t.amount||0).toLocaleString()}</p>
                 </div>
                 {t.status === 'Pending' && (
                     <div className="flex gap-2">
                         <Button onClick={() => updateStatus(t.id, 'Completed')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8"><Check className="w-4 h-4 mr-1"/> Approve</Button>
                         <Button onClick={() => updateStatus(t.id, 'Rejected')} size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold h-8"><X className="w-4 h-4 mr-1"/> Reject</Button>
                     </div>
                 )}
                 {t.status === 'Completed' && (
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Archived & Balanced</p>
                 )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
