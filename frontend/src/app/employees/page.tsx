'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShieldCheck, UserPlus, Pencil, Trash2, RefreshCcw,
  Eye, EyeOff, Building2, Mail, Lock, Sparkles, Users
} from 'lucide-react';
import { toast } from 'sonner';

// Branches will be fetched dynamically from /api/branches

const ROLES = ['TELLER', 'ADMIN'];

export default function StaffPage() {
  const [staff, setStaff]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isSaving, setIsSaving]       = useState(false);
  const [isOpen, setIsOpen]           = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [branches, setBranches]       = useState<any[]>([]);
  const [isNewBranch, setIsNewBranch] = useState(false);
  const [newBranchId, setNewBranchId] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  // Form fields
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [branchId, setBranchId]     = useState('');
  const [branchName, setBranchName] = useState('');
  const [role, setRole]             = useState('TELLER');

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to load staff');
      }
    } catch (e) {
      toast.error('Network error loading staff');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        setBranches(await res.json());
      }
    } catch (e) {
      console.error('Failed to load branches');
    }
  };

  useEffect(() => { 
    loadStaff(); 
    loadBranches();
  }, []);

  // Auto-fill branch name when branch ID is selected
  const handleBranchSelect = (bid: string) => {
    setBranchId(bid);
    const match = branches.find(b => b.id === bid);
    setBranchName(match?.name || '');
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setBranchId(''); setBranchName(''); setRole('TELLER');
    setEditingUser(null); setShowPassword(false);
    setIsNewBranch(false); setNewBranchId(''); setNewBranchName('');
  };

  const openAdd = () => { resetForm(); setIsOpen(true); };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEmail(user.email || '');
    setPassword(''); // never pre-fill password
    setBranchId(user.branch_id || '');
    setBranchName(user.branch_name || '');
    setRole(user.role || 'TELLER');
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!email || (!editingUser && !password)) {
      toast.error('Missing required fields', { description: 'Email and Password are required.' });
      return;
    }

    if (isNewBranch && (!newBranchId || !newBranchName)) {
      toast.error('Missing branch info', { description: 'Please enter ID and Name for the new branch.' });
      return;
    }

    if (!isNewBranch && !branchId) {
      toast.error('Missing branch', { description: 'Please select a branch.' });
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(editingUser ? 'Updating user account...' : 'Creating user account...');

    try {
      let finalBranchId = branchId;
      let finalBranchName = branchName;

      // Ensure branchName is captured from the branches list if missing
      if (!finalBranchName && finalBranchId) {
        const bMatch = branches.find(b => b.id === finalBranchId);
        if (bMatch) finalBranchName = bMatch.name;
      }

      // Handle New Branch Creation first
      if (isNewBranch) {
        console.log('Creating new branch:', { newBranchId, newBranchName });
        const bRes = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: newBranchId, name: newBranchName }),
        });
        if (!bRes.ok) {
          const bErr = await bRes.json();
          throw new Error(bErr.error || 'Failed to create new branch');
        }
        const bData = await bRes.json();
        finalBranchId = bData.id;
        finalBranchName = bData.name;
        loadBranches(); // refresh list in background
      }

      const url    = editingUser ? `/api/staff/${editingUser.id}` : '/api/staff';
      const method = editingUser ? 'PATCH' : 'POST';

      const body: any = { 
        email, 
        branchId: finalBranchId, 
        branchName: finalBranchName, 
        role 
      };
      if (password) body.password = password;

      console.log('Saving staff member:', body);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(
        editingUser ? 'User account updated!' : 'User created! They can now log in immediately.',
        { id: toastId }
      );
      setIsOpen(false);
      resetForm();
      loadStaff();
    } catch (err: any) {
      toast.error('Error saving user', { description: err.message, id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Permanently delete "${user.email}"?\n\nThis will remove their login access immediately.`)) return;
    const toastId = toast.loading('Removing user account...');
    try {
      const res = await fetch(`/api/staff/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('User account removed successfully', { id: toastId });
      loadStaff();
    } catch (err: any) {
      toast.error('Could not delete user', { description: err.message, id: toastId });
    }
  };

  const roleColor = (r: string) => {
    if (r === 'ADMIN') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-2xl border-white/40 shadow-2xl gap-6">
        <div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 mb-3 px-3 py-0.5 font-black uppercase tracking-widest text-[10px]">
            <ShieldCheck className="w-3 h-3 mr-1" /> Admin Only
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">
            Staff <span className="text-gradient">Directory</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage branch accounts, passwords and access levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadStaff}
            disabled={loading}
            className="h-12 px-5 border-white/40 glass font-black text-[10px] uppercase tracking-widest rounded-xl gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={openAdd}
            className="gap-2 bg-primary hover:bg-primary/90 h-14 px-8 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 rounded-2xl"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: staff.length,                                              color: 'text-slate-900' },
          { label: 'Branches',     value: staff.filter(s => s.role === 'TELLER').length,             color: 'text-emerald-600' },
          { label: 'Admins',       value: staff.filter(s => s.role === 'ADMIN').length,              color: 'text-indigo-600' },
          { label: 'Active Today', value: staff.filter(s => s.lastSignIn && new Date(s.lastSignIn) > new Date(Date.now() - 86400000)).length, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="glass border-white/40 rounded-2xl p-6 shadow-lg">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-[480px] glass border-white/40 p-0 overflow-hidden rounded-[2rem]">
          <div className="h-2 bg-primary" />
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-primary" />
                {editingUser ? 'Edit User Account' : 'Create New User'}
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                {editingUser
                  ? 'Update credentials or branch assignment. Leave password blank to keep existing.'
                  : 'Create a new branch account. The user can log in immediately after creation.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              {/* Email */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </Label>
                <Input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="branch.new@rupasinghe.com"
                  type="email"
                  className="h-12 bg-white/50 rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> {editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Min 8 characters'}
                    type={showPassword ? 'text' : 'password'}
                    className="h-12 bg-white/50 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch Assignment</Label>
                    {!editingUser && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsNewBranch(!isNewBranch)} 
                        className="h-6 text-[9px] font-black uppercase text-primary hover:text-primary hover:bg-primary/5"
                      >
                        {isNewBranch ? "Select Existing" : "+ Create New Branch"}
                      </Button>
                    )}
                  </div>

                  {isNewBranch ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid gap-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branch Name</Label>
                        <Input 
                          value={newBranchName} 
                          onChange={e => setNewBranchName(e.target.value)} 
                          placeholder="E.g. Kandana" 
                          className="h-12 bg-white/50 rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">ID (3 Letters)</Label>
                        <Input 
                          value={newBranchId} 
                          onChange={e => setNewBranchId(e.target.value.toUpperCase())} 
                          placeholder="KND" 
                          maxLength={10}
                          className="h-12 bg-white/50 rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="grid gap-2 min-w-0">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Building2 className="w-3 h-3" /> Select Branch
                        </Label>
                        <Select value={branchId} onValueChange={(v) => v && handleBranchSelect(v)}>
                          <SelectTrigger className="h-12 bg-white/50 rounded-xl font-bold text-sm w-full overflow-hidden min-w-0">
                            <SelectValue placeholder="Select branch" className="truncate" />
                          </SelectTrigger>
                          <SelectContent className="glass border-white/40 rounded-2xl shadow-2xl max-w-[90vw]">
                            {branches.map(b => (
                              <SelectItem key={b.id} value={b.id} className="font-bold whitespace-nowrap">
                                {b.name} ({b.id.length > 8 ? `${b.id.substring(0, 8)}...` : b.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 min-w-0">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Role</Label>
                        <Select value={role} onValueChange={(v) => v && setRole(v)}>
                          <SelectTrigger className="h-12 bg-white/50 rounded-xl font-bold text-sm w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass border-white/40 rounded-2xl shadow-2xl">
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

              {/* Branch name preview */}
              {branchName && (
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-primary font-black text-sm truncate pr-2">
                    Will be assigned to: <span className="font-black">{branchName}</span> ({branchId.length > 8 ? `${branchId.substring(0, 8)}...` : branchId})
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" className="font-bold text-slate-500 h-12 rounded-xl" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button
                disabled={isSaving}
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
              >
                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isSaving ? 'Saving...' : (editingUser ? 'Update Account' : 'Create Account')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="glass border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white/40">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-black text-slate-800 tracking-tighter text-lg">All User Accounts</h2>
          <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest">
            {staff.length} total
          </Badge>
        </div>
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Email</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Branch</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Branch ID</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Role</TableHead>
              <TableHead className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Last Login</TableHead>
              <TableHead className="px-8 py-5" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center font-black text-slate-300 animate-pulse tracking-widest uppercase">
                  Loading user accounts...
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Users className="h-12 w-12 text-slate-200" />
                    <p className="text-slate-400 font-bold">No user accounts found.</p>
                    <p className="text-slate-300 text-sm">Run the seed API or create your first user.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staff.map(user => (
                <TableRow key={user.id} className="group hover:bg-primary/5 transition-all duration-300">
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 group-hover:text-primary transition-colors text-sm">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 font-bold text-slate-700">
                    {user.branch_name || '—'}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="font-black text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg tracking-widest" title={user.branch_id}>
                      {(user.branch_id && user.branch_id.length > 8) ? `${user.branch_id.substring(0, 8)}...` : (user.branch_id || '—')}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 border ${roleColor(user.role)}`}>
                      {user.role || 'TELLER'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {user.lastSignIn
                      ? new Date(user.lastSignIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Never'}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
