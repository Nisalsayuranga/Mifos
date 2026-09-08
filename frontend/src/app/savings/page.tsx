'use client';

import { useState, useEffect } from "react";
import { Search, Plus, Eye, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SavingsAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [loading, setLoading] = useState(true);

  // New Account Form
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Savings");
  const [newDeposit, setNewDeposit] = useState("");

  const loadAccounts = async () => {
    try {
      const res = await fetch(`/api/accounts?type=${filterType}`);
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [filterType]);

  const handleCreateAccount = async () => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          balance: parseFloat(newDeposit) || 0,
          interestRate: newType === 'Savings' ? 3.5 : newType === 'Business' ? 2.0 : 0.5
        })
      });
      
      if (res.ok) {
        setIsOpen(false);
        setNewName("");
        setNewDeposit("");
        loadAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    return account.name.toLowerCase().includes(searchTerm.toLowerCase()) || account.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Accounts</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage checking, savings, and enterprise balances.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 gap-2 w-full md:w-auto">
          <Plus className="w-4 h-4" /> Open New Account
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Originate Account</DialogTitle>
            <DialogDescription>Input the KYC-approved client details to generate a new ledger.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Account Holder Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full legal name" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Product Type</Label>
              <Select onValueChange={(val) => val && setNewType(val)} value={newType}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings Account (3.5% APY)</SelectItem>
                  <SelectItem value="Checking">Checking Account (0.5% APY)</SelectItem>
                  <SelectItem value="Business">Enterprise Business (2.0% APY)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Initial Cash Deposit (Rs.)</Label>
              <Input value={newDeposit} onChange={e => setNewDeposit(e.target.value)} type="number" placeholder="5000" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Authorize & Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Ledgers</p>
          <p className="text-3xl font-black text-slate-800">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Consolidated Wealth</p>
          <p className="text-3xl font-black text-emerald-600">
            Rs. {accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 shadow-xl shadow-slate-200/50">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Active Mandates</p>
          <p className="text-3xl font-black text-white">
            {accounts.filter((a) => a.status === "Active").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Liquidity</p>
          <p className="text-3xl font-black text-slate-800">
            Rs. {(accounts.length ? Math.round(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) / accounts.length) : 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by ID or Holder Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
             <Select onValueChange={(val) => val && setFilterType(val)} value={filterType}>
                <SelectTrigger className="w-40 font-semibold"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            <Button variant="outline" className="font-bold border-slate-300 gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Account ID</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Entity Name</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Product</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Net Balance</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Rate</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Origination</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 font-bold text-slate-400">Loading ledger data...</TableCell></TableRow>
            ) : filteredAccounts.length === 0 ? (
               <TableRow><TableCell colSpan={8} className="text-center py-10 font-bold text-slate-400">No accounts match search.</TableCell></TableRow>
            ) : filteredAccounts.map((account) => (
              <TableRow key={account.id} className="hover:bg-slate-50">
                <TableCell className="font-black text-slate-900">{account.id}</TableCell>
                <TableCell className="font-bold text-slate-700">{account.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-full ${
                    account.type === 'Business' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    account.type === 'Savings' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {account.type}
                  </span>
                </TableCell>
                <TableCell className="font-black text-emerald-600">Rs. {(account.balance||0).toLocaleString()}</TableCell>
                <TableCell className="font-bold text-slate-500">{account.interest_rate}%</TableCell>
                <TableCell>
                   <span className={`inline-flex px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-emerald-50 text-emerald-700 border border-emerald-100`}>
                      {account.status}
                    </span>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-500">
                  {new Date(account.opened_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600"><Eye className="h-4 w-4"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
