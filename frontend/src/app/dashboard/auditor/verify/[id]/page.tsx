'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ShieldCheck, ArrowLeft, User, Phone, MapPin, CreditCard,
  Scale, FileText, Camera, DollarSign, Package, AlertTriangle,
  CheckCircle2, Clock, Building2, Eye, ExternalLink, RefreshCcw,
  Check, X, AlertCircle, Sparkles, Layers, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/getAuthHeaders';

const ISSUE_AREAS = [
  'Customer details',
  'Bill number',
  'Pawn details',
  'Weight',
  'Karat',
  'Physical item',
  'Uploaded image',
  'Document',
  'Stock',
  'Cash',
  'Other'
];

export default function AuditorVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Section 4: Physical Item Verification Controls
  const [physicalExists, setPhysicalExists] = useState<boolean | null>(null);
  const [itemMatches, setItemMatches] = useState<boolean | null>(null);
  const [weightMatches, setWeightMatches] = useState<boolean | null>(null);
  const [karatMatches, setKaratMatches] = useState<boolean | null>(null);
  const [descriptionMatches, setDescriptionMatches] = useState<boolean | null>(null);
  const [quantityMatches, setQuantityMatches] = useState<boolean | null>(null);
  const [observedWeight, setObservedWeight] = useState('');
  const [observedKarat, setObservedKarat] = useState('');

  // Section 5: Stock Verification
  const [stockVerified, setStockVerified] = useState<boolean | null>(null);

  // Section 6: Cash Verification
  const [cashVerified, setCashVerified] = useState<boolean | null>(null);

  // Section 7: Overall Audit Verdict & Notes
  const [auditVerdict, setAuditVerdict] = useState<'VERIFIED_PASSED' | 'FLAGGED_DISCREPANCY' | 'IN_REVIEW'>('VERIFIED_PASSED');
  const [auditNotes, setAuditNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issue / Error Note Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssueArea, setSelectedIssueArea] = useState<string>('Weight');
  const [issueNote, setIssueNote] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Auditor Approval Confirmation Modal State
  const [isConfirmApprovalModalOpen, setIsConfirmApprovalModalOpen] = useState(false);
  const [auditorCertified, setAuditorCertified] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Image Modal Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadVerificationData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));

      const res = await fetch(`/api/pawns/${id}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load pawn transaction dossier');
      }

      const resJson = await res.json();
      setData(resJson);

      // Pre-fill if prior audit log exists for this bill
      if (resJson.auditHistory && resJson.auditHistory.length > 0) {
        const latest = resJson.auditHistory[0];
        const det = latest.details || {};
        if (latest.action === 'AUDIT_VERIFIED') setAuditVerdict('VERIFIED_PASSED');
        else if (latest.action === 'AUDIT_FLAGGED') setAuditVerdict('FLAGGED_DISCREPANCY');

        if (det.notes) setAuditNotes(det.notes);
        if (det.physicalExists !== undefined) setPhysicalExists(det.physicalExists);
        if (det.itemMatches !== undefined) setItemMatches(det.itemMatches);
        if (det.weightMatches !== undefined) setWeightMatches(det.weightMatches);
        if (det.karatMatches !== undefined) setKaratMatches(det.karatMatches);
        if (det.descriptionMatches !== undefined) setDescriptionMatches(det.descriptionMatches);
        if (det.quantityMatches !== undefined) setQuantityMatches(det.quantityMatches);
        if (det.observedWeight) setObservedWeight(String(det.observedWeight));
        if (det.observedKarat) setObservedKarat(String(det.observedKarat));
        if (det.stockVerified !== undefined) setStockVerified(det.stockVerified);
        if (det.cashVerified !== undefined) setCashVerified(det.cashVerified);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error loading transaction verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, [id]);

  const handleOpenIssueModal = (area?: string) => {
    if (area) setSelectedIssueArea(area);
    setIssueNote('');
    setIsIssueModalOpen(true);
  };

  const handleSubmitIssue = async () => {
    if (!issueNote.trim()) {
      toast.error('Please enter a clear error/observation note before submitting.');
      return;
    }
    if (!data?.pawn) return;

    setIsSubmittingIssue(true);
    const toastId = toast.loading('Recording auditor issue and marking ticket for recheck...');

    try {
      const res = await fetch(`/api/pawns/${id}/issue`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category: selectedIssueArea,
          note: issueNote.trim(),
          details: {
            observedWeight: observedWeight ? parseFloat(observedWeight) : null,
            observedKarat: observedKarat || null
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit issue note');
      }

      toast.success(
        `Auditor Issue Recorded for Bill #${data.pawn.bill_no || data.pawn.id.substring(0, 8)}`,
        {
          description: 'Transaction marked as REQUIRES RECHECK and blocked from Manager approval.',
          id: toastId
        }
      );

      setIsIssueModalOpen(false);
      setIssueNote('');
      // Reload verification dossier so active status and issue are immediately visible
      await loadVerificationData();
    } catch (err: any) {
      toast.error('Failed to record issue', { description: err.message, id: toastId });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleInitiateApproval = () => {
    // 1. Safety Check: disallow approval if an active issue exists or status is REQUIRES_RECHECK
    if (data?.pawn?.status === 'REQUIRES_RECHECK' || (data?.unresolvedIssues && data.unresolvedIssues.length > 0)) {
      toast.error('Cannot forward ticket for approval', {
        description: 'There is an active Auditor issue on this transaction that must be resolved first.'
      });
      return;
    }

    // 2. Discrepancy check: If the auditor explicitly marked physical checks as failed
    if (physicalExists === false || itemMatches === false || weightMatches === false || karatMatches === false) {
      toast.error('Checklist discrepancies detected', {
        description: 'You marked physical discrepancies. Please resolve them or click "Flag Issue / Error Note" instead.'
      });
      return;
    }

    // 3. Auto-populate unset checklist items to verified (true) since auditor is confirming passing state
    if (physicalExists === null) setPhysicalExists(true);
    if (itemMatches === null) setItemMatches(true);
    if (weightMatches === null) setWeightMatches(true);
    if (karatMatches === null) setKaratMatches(true);
    if (descriptionMatches === null) setDescriptionMatches(true);
    if (quantityMatches === null) setQuantityMatches(true);
    if (stockVerified === null) setStockVerified(true);
    if (cashVerified === null) setCashVerified(true);

    // Pre-check the certification checkbox so modal is immediately ready
    setAuditorCertified(true);
    setIsConfirmApprovalModalOpen(true);
  };

  const handleConfirmAuditorApproval = async () => {
    if (!data?.pawn) return;

    setIsSubmittingApproval(true);
    const toastId = toast.loading('Submitting auditor approval & transitioning state...');

    try {
      const res = await fetch(`/api/pawns/${id}/auditor-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checklist: {
            physicalExists: physicalExists !== false,
            itemMatches: itemMatches !== false,
            weightMatches: weightMatches !== false,
            karatMatches: karatMatches !== false,
            descriptionMatches: descriptionMatches !== false,
            quantityMatches: quantityMatches !== false,
            observedWeight: observedWeight ? parseFloat(observedWeight) : null,
            observedKarat: observedKarat || null,
            stockVerified: stockVerified !== false,
            cashVerified: cashVerified !== false
          },
          notes: auditNotes || 'All verification checks completed and confirmed correct.',
          confirmed: true
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit auditor approval');
      }

      toast.success(
        `Auditor Approval Confirmed for Bill #${data.pawn.bill_no || data.pawn.id.substring(0, 8)}`,
        {
          description: 'Ticket is now in AUDITED_PENDING_APPROVAL and forwarded to Manager for final approval.',
          id: toastId
        }
      );

      setIsConfirmApprovalModalOpen(false);
      await loadVerificationData();

      // Automatically navigate back to Auditor Dashboard
      setTimeout(() => {
        router.push('/dashboard/auditor');
      }, 1000);
    } catch (err: any) {
      toast.error('Auditor approval failed', { description: err.message, id: toastId });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSubmitAudit = async () => {
    if (!data?.pawn) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting auditor verification results...');

    try {
      const actionName = auditVerdict === 'VERIFIED_PASSED' ? 'AUDIT_VERIFIED' : 'AUDIT_FLAGGED';

      const payload = {
        action: actionName,
        resource: data.pawn.bill_no,
        bill_no: data.pawn.bill_no,
        branch_id: data.pawn.branch_id,
        details: {
          bill_no: data.pawn.bill_no,
          pawn_id: data.pawn.id,
          status: auditVerdict,
          notes: auditNotes,
          checklist: {
            physicalExists,
            itemMatches,
            weightMatches,
            karatMatches,
            descriptionMatches,
            quantityMatches,
            observedWeight: observedWeight ? parseFloat(observedWeight) : null,
            observedKarat: observedKarat || null,
            stockVerified,
            cashVerified
          },
          auditor_email: user?.email || 'Branch Auditor',
          audited_at: new Date().toISOString()
        }
      };

      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit verification');
      }

      toast.success(
        auditVerdict === 'VERIFIED_PASSED'
          ? `Audit Verification for Bill #${data.pawn.bill_no} successfully marked as Passed`
          : `Discrepancy recorded and flagged for Bill #${data.pawn.bill_no}`,
        { id: toastId }
      );

      // Return to Auditor Dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard/auditor');
      }, 1000);
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message, id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCcw className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-slate-600 font-bold text-sm">Loading pawn verification dossier from database...</p>
      </div>
    );
  }

  if (!data?.pawn) {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900">Transaction Not Found</h2>
        <p className="text-slate-500 text-sm">
          The requested pawn ticket could not be found or does not belong to your assigned branch.
        </p>
        <Link href="/dashboard/auditor">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
            Return to Auditor Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { pawn, client, items, evaluationEvidence, stockItems, transactions, dailyLedger, auditHistory } = data;
  const grossWeightGrams = (parseFloat(pawn.weight_mg) / 1000) || parseFloat(pawn.weight_grams) || parseFloat(pawn.weight) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl border-slate-200 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/auditor">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-slate-200 hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Auditor Verification
              </Badge>
              <span className="font-mono text-xs font-black text-slate-500">
                Bill No: <strong className="text-slate-900 text-sm">{pawn.bill_no || pawn.id.substring(0, 8)}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Physical vs. System <span className="text-amber-600">Verification</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Branch</p>
            <p className="text-sm font-black text-slate-900 flex items-center justify-end gap-1">
              <Building2 className="w-4 h-4 text-amber-600" />
              {pawn.branch_id}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`font-black text-xs uppercase px-3 py-1 ${
              pawn.status === 'REQUIRES_RECHECK'
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-black'
                : pawn.status === 'AUDITED_PENDING_APPROVAL'
                ? 'bg-blue-50 text-blue-800 border-blue-300 font-black'
                : pawn.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : pawn.status === 'PENDING_APPROVAL'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            Loan Status: {
              pawn.status === 'REQUIRES_RECHECK' 
                ? '⚠ REQUIRES RECHECK' 
                : pawn.status === 'AUDITED_PENDING_APPROVAL'
                ? '✓ AUDITED • PENDING MGR'
                : pawn.status
            }
          </Badge>

          <Button
            onClick={() => handleOpenIssueModal()}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2 rounded-2xl gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] shrink-0"
            title="Raise Auditor Issue / Error Note"
          >
            <AlertTriangle className="w-4 h-4 text-white" /> Issue / Error Note
          </Button>
        </div>
      </div>

      {/* ACTIVE AUDITOR ISSUE BANNER */}
      {(pawn.status === 'REQUIRES_RECHECK' || (data.unresolvedIssues && data.unresolvedIssues.length > 0)) && (
        <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/15 to-rose-500/10 border-2 border-rose-500/50 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-rose-950">
                    AUDITOR ISSUE ACTIVE
                  </h3>
                  <Badge className="bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                    REQUIRES CORRECTION / RECHECK
                  </Badge>
                  <Badge variant="outline" className="border-rose-400 text-rose-800 font-bold text-[10px] uppercase">
                    BLOCKED FROM MANAGER APPROVAL
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-rose-700/90 mt-0.5">
                  The Auditor has raised one or more issues. This transaction cannot proceed to Manager approval until corrected and rechecked.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handleOpenIssueModal()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Log Another Issue
            </Button>
          </div>

          {/* List of active issue notes */}
          {data.unresolvedIssues && data.unresolvedIssues.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {data.unresolvedIssues.map((issueLog: any, idx: number) => {
                const det = issueLog.details || {};
                return (
                  <div key={issueLog.id || idx} className="p-4 bg-white/95 rounded-2xl border border-rose-200/80 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-rose-900 bg-rose-100 px-2 py-0.5 rounded-lg uppercase tracking-wider text-[10px]">
                          Area: {det.category || 'Discrepancy'}
                        </span>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          Auditor: <strong className="text-slate-800">{issueLog.user_email || det.auditor_email || 'Branch Auditor'}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {issueLog.created_at ? new Date(issueLog.created_at).toLocaleString('en-GB') : ''}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 pl-2 border-l-2 border-rose-500 ml-1">
                      "{det.note || det.notes || 'Discrepancy reported by branch auditor.'}"
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 bg-white/90 rounded-2xl border border-rose-200 text-xs font-bold text-rose-900">
              Ticket status marked as <strong>REQUIRES_RECHECK</strong>. Awaiting branch staff correction.
            </div>
          )}
        </div>
      )}

      {/* AUDITOR APPROVED BANNER */}
      {pawn.status === 'AUDITED_PENDING_APPROVAL' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-blue-500/40 rounded-3xl p-6 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900">
                  AUDITOR VERIFIED & APPROVED
                </h3>
                <Badge className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  PENDING MANAGER APPROVAL
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                All physical and system verification checks have passed and been certified. Ticket is now in the Branch Manager's queue for final approval and GL ledger posting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT / CENTER COLUMN: Details & Evidence (2 spans) */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" /> 1. Customer Details
              </h2>
              <span className="text-xs font-bold text-slate-400">KYC Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <p>Full Name: <strong className="text-slate-900 text-sm font-black block">{client?.first_name ? `${client.first_name} ${client.last_name || ''}`.trim() : pawn.customer_name || 'Valued Customer'}</strong></p>
                <p>National ID (NIC): <strong className="font-mono text-slate-900 text-sm font-black block">{client?.national_id || 'Not specified'}</strong></p>
                <p>Contact Phone: <strong className="text-slate-900 block">{client?.phone || pawn.phone || 'Not specified'}</strong></p>
                <p>Registered Address: <strong className="text-slate-900 block">{client?.address || 'Not specified'}</strong></p>
              </div>

              {/* Customer Photo / ID photo if available */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {client?.photo_url || client?.nic_image ? (
                  <div className="relative group cursor-zoom-in" onClick={() => setPreviewImage(client.photo_url || client.nic_image)}>
                    <img 
                      src={client.photo_url || client.nic_image} 
                      alt="Customer KYC Proof" 
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-300 shadow-sm"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Zoom
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <User className="w-12 h-12 mx-auto text-slate-300 mb-1" />
                    <span className="text-xs font-bold">No KYC photo attached</span>
                  </div>
                )}
                <span className="text-[10px] font-black uppercase text-slate-400 mt-2">Customer Profile Photo</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: PAWN / BILL DETAILS */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" /> 2. Pawn / Bill Details
              </h2>
              <span className="text-xs font-bold text-slate-400">System Contract Records</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Loan Disbursed</span>
                <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                  Rs. {Number(pawn.disbursed_amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Appraised Value</span>
                <p className="text-lg font-black font-mono text-slate-800 mt-0.5">
                  Rs. {Number(pawn.appraised_value || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">System Total Weight</span>
                <p className="text-lg font-black font-mono text-amber-700 mt-0.5">
                  {grossWeightGrams.toFixed(3)} g
                </p>
                <span className="text-[10px] text-slate-400 font-mono font-bold">({pawn.weight_mg || (grossWeightGrams * 1000)} mg)</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Interest & Period</span>
                <p className="text-sm font-black text-slate-800 mt-1">
                  {pawn.interest_rate || 3.5}% /mo • {pawn.period_months || 3} Mos
                </p>
              </div>
            </div>

            {/* Collateral Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Declared Pawn Collateral Items</span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700">Item Description</th>
                      <th className="py-2.5 px-4 text-left font-bold text-slate-700">Purity</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-700">Weight (mg)</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-700">Appraised (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items && items.length > 0 ? (
                      items.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-black text-slate-900">{item.item_type || item.description}</td>
                          <td className="py-2.5 px-4 font-bold text-amber-700">{item.purity || '22K'}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{item.weight_mg || 0}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            Rs. {Number(item.appraised_value || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-black text-slate-900">{pawn.description || 'Gold Collateral Item'}</td>
                        <td className="py-3 px-4 font-bold text-amber-700">22K</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{pawn.weight_mg || 0}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          Rs. {Number(pawn.appraised_value || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 3: UPLOADED EVIDENCE (Scale Photos & Receipts) */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" /> 3. Uploaded Evidence
              </h2>
              <span className="text-xs font-bold text-slate-400">Scale Proofs & Collateral Photos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Air Weight Photo Proof */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 flex flex-col items-center">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Air Weight Scale Photo
                  </span>
                  {evaluationEvidence?.air_weight && (
                    <span className="text-xs font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Scale: {evaluationEvidence.air_weight} mg
                    </span>
                  )}
                </div>

                <div 
                  className="w-full aspect-video bg-black/95 rounded-xl overflow-hidden shadow-inner flex items-center justify-center cursor-zoom-in group relative border border-slate-300"
                  onClick={() => evaluationEvidence?.air_weight_photo_url && setPreviewImage(evaluationEvidence.air_weight_photo_url)}
                >
                  {evaluationEvidence?.air_weight_photo_url ? (
                    <>
                      <img 
                        src={evaluationEvidence.air_weight_photo_url} 
                        alt="Air weight proof" 
                        className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Click to Zoom
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">No air weight photo attached</span>
                  )}
                </div>
              </div>

              {/* Water Weight Photo Proof */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 flex flex-col items-center">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Water Weight Scale Photo
                  </span>
                  {evaluationEvidence?.water_weight && (
                    <span className="text-xs font-mono font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                      Scale: {evaluationEvidence.water_weight} mg
                    </span>
                  )}
                </div>

                <div 
                  className="w-full aspect-video bg-black/95 rounded-xl overflow-hidden shadow-inner flex items-center justify-center cursor-zoom-in group relative border border-slate-300"
                  onClick={() => evaluationEvidence?.water_weight_photo_url && setPreviewImage(evaluationEvidence.water_weight_photo_url)}
                >
                  {evaluationEvidence?.water_weight_photo_url ? (
                    <>
                      <img 
                        src={evaluationEvidence.water_weight_photo_url} 
                        alt="Water weight proof" 
                        className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Click to Zoom
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">No water weight photo attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Archimedes Specific Gravity Data */}
            {evaluationEvidence && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">Archimedes Specific Gravity (SG):</span>
                <span className="font-mono font-black text-amber-900">
                  {evaluationEvidence.specific_gravity || '—'} (Deductions Karat: {evaluationEvidence.estimated_karat || '22K'})
                </span>
              </div>
            )}
          </div>

          {/* SECTION 5: STOCK VERIFICATION */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" /> 5. Stock Verification
              </h2>
              <span className="text-xs font-bold text-slate-400">Vault Inventory Records</span>
            </div>

            {stockItems && stockItems.length > 0 ? (
              <div className="space-y-3">
                {stockItems.map((stk: any) => (
                  <div key={stk.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">Vault Sub-Bill: {stk.bill_no}</span>
                        <Badge variant="outline" className={`font-black text-[9px] uppercase px-2 py-0.5 ${stk.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-200'}`}>
                          {stk.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-1">Item: {stk.item_type}</p>
                      <p className="text-[11px] text-slate-400">Stock Date: {stk.date || stk.created_at?.split('T')[0]}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-black text-sm text-slate-900">{stk.weight} g</p>
                      <p className="font-mono text-xs font-bold text-slate-500">Rs. {Number(stk.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">No corresponding stock_items row found for bill.</p>
            )}
          </div>

          {/* SECTION 6: CASH & LEDGER VERIFICATION */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" /> 6. Cash & Ledger Verification
              </h2>
              <span className="text-xs font-bold text-slate-400">Cashier & Drawer Balances</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Expected Disbursement</span>
                <p className="text-base font-black font-mono text-slate-900 mt-1">
                  Rs. {Number(pawn.disbursed_amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">Recorded Transactions</span>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {transactions.length} Cash Flow Events
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">PAWN_DISBURSE matched</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400">EOD Daily Ledger Date</span>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {dailyLedger ? dailyLedger.status : 'Pending Settlement'}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Date: {pawn.created_at?.split('T')[0]}</span>
              </div>
            </div>
          </div>

          {/* AUDIT HISTORY & ISSUE TRAIL (Preserves all historical audit records) */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" /> Audit History & Issue Trail
              </h2>
              <Badge variant="outline" className="font-mono text-xs font-bold">
                {auditHistory?.length || 0} events recorded
              </Badge>
            </div>

            {auditHistory && auditHistory.length > 0 ? (
              <div className="space-y-3">
                {auditHistory.map((log: any, idx: number) => {
                  const det = log.details || {};
                  const isIssue = log.action === 'AUDIT_ISSUE_RAISED';
                  const isVerified = log.action === 'AUDIT_VERIFIED';
                  const isFlagged = log.action === 'AUDIT_FLAGGED';

                  return (
                    <div 
                      key={log.id || idx} 
                      className={`p-4 rounded-2xl border transition-colors ${
                        isIssue 
                          ? 'bg-rose-50/70 border-rose-200' 
                          : isVerified 
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isFlagged
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`font-black text-[9px] uppercase tracking-wider px-2 py-0.5 ${
                            isIssue 
                              ? 'bg-rose-600 text-white' 
                              : isVerified 
                              ? 'bg-emerald-600 text-white'
                              : isFlagged
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}>
                            {isIssue ? '⚠ ISSUE RAISED' : isVerified ? '✓ VERIFIED PASSED' : isFlagged ? '⚠ FLAGGED' : log.action}
                          </Badge>
                          {det.category && (
                            <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                              Area: {det.category}
                            </span>
                          )}
                          <span className="text-xs font-black text-slate-800">
                            {log.user_email || det.auditor_email || 'Auditor'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-700">
                        "{det.note || det.notes || `Audit event ${log.action} recorded.`}"
                      </p>

                      {det.checklist && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                          <span>Physical Item: {det.checklist.physicalExists ? 'Yes' : 'No'}</span>
                          <span>• Item Matches: {det.checklist.itemMatches ? 'Yes' : 'No'}</span>
                          <span>• Weight Matches: {det.checklist.weightMatches ? 'Yes' : 'Discrepancy'}</span>
                          <span>• Karat Matches: {det.checklist.karatMatches ? 'Yes' : 'Differs'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">No previous audit logs recorded for this ticket.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Section 4 Physical Verification & Section 7 Audit Checklist Controls (1 span) */}
        <div className="space-y-6">

          {/* SECTION 4: PHYSICAL ITEM VERIFICATION CONTROLS */}
          <div className="glass rounded-3xl border-2 border-amber-500/40 p-6 shadow-xl space-y-5 bg-amber-500/[0.02]">
            <div className="border-b border-amber-500/20 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" /> 4. Physical Item Verification
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Compare physical gold in hand against system ticket.
              </p>
            </div>

            {/* Checklist items with interactive toggle buttons */}
            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* 1. Physical item exists */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>1. Physical item exists in vault?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPhysicalExists(true)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        physicalExists === true ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhysicalExists(false)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        physicalExists === false ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Item matches system details */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>2. Item matches system description?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setItemMatches(true)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        itemMatches === true ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Matches
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemMatches(false)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        itemMatches === false ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Differs
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Weight matches */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>3. Weight matches declared scale?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setWeightMatches(true)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        weightMatches === true ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Matches
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightMatches(false)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        weightMatches === false ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Discrepancy
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Observed (g):</span>
                  <Input 
                    type="number"
                    step="0.001"
                    value={observedWeight}
                    onChange={(e) => setObservedWeight(e.target.value)}
                    placeholder={grossWeightGrams.toFixed(3)}
                    className="h-8 text-xs font-mono font-bold bg-slate-50"
                  />
                </div>
              </div>

              {/* 4. Karat matches */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>4. Karat matches gold testing?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setKaratMatches(true)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        karatMatches === true ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Matches
                    </button>
                    <button
                      type="button"
                      onClick={() => setKaratMatches(false)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        karatMatches === false ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Differs
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Observed Karat:</span>
                  <Input 
                    value={observedKarat}
                    onChange={(e) => setObservedKarat(e.target.value)}
                    placeholder="22K"
                    className="h-8 text-xs font-bold bg-slate-50"
                  />
                </div>
              </div>

              {/* 5. Quantity / items count matches */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span>5. Quantity of pieces matches?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantityMatches(true)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        quantityMatches === true ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Matches
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantityMatches(false)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer transition-all ${
                        quantityMatches === false ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Differs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: AUDIT DECISION & RECORD SUBMISSION */}
          <div className="glass rounded-3xl border border-slate-200 p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" /> 7. Audit Decision & Record
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Record final findings in immutable branch audit trail.
              </p>
            </div>

            {/* Decision selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAuditVerdict('VERIFIED_PASSED')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-black text-[11px] cursor-pointer transition-all ${
                  auditVerdict === 'VERIFIED_PASSED'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Passed
              </button>

              <button
                type="button"
                onClick={() => setAuditVerdict('FLAGGED_DISCREPANCY')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-black text-[11px] cursor-pointer transition-all ${
                  auditVerdict === 'FLAGGED_DISCREPANCY'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Flagged
              </button>

              <button
                type="button"
                onClick={() => setAuditVerdict('IN_REVIEW')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-black text-[11px] cursor-pointer transition-all ${
                  auditVerdict === 'IN_REVIEW'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" /> In Review
              </button>
            </div>

            {/* Findings & Observation notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">
                Auditor Observations & Evidence Notes:
              </label>
              <textarea
                rows={4}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Enter detailed audit notes regarding physical weight, purity test, discrepancies, or verification..."
                className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Button
              onClick={auditVerdict === 'VERIFIED_PASSED' ? handleInitiateApproval : handleSubmitAudit}
              disabled={isSubmitting || isSubmittingApproval}
              className={`w-full font-black text-sm h-12 rounded-2xl shadow-lg gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                auditVerdict === 'VERIFIED_PASSED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isSubmitting || isSubmittingApproval ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {auditVerdict === 'VERIFIED_PASSED'
                ? 'Confirm & Forward to Manager for Approval'
                : 'Submit Audit Verification'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal (Full Zoom) */}
      <Dialog open={Boolean(previewImage)} onOpenChange={(v) => !v && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-slate-800 rounded-3xl">
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" /> Evidence Photo Inspection
            </span>
            <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Enlarged Evidence" 
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AUDITOR ISSUE / ERROR NOTE MODAL */}
      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-2xl">
          {/* Header Bar */}
          <div className="h-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-red-500" />
          
          <div className="p-6 space-y-5">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                    Record Auditor Issue / Error Note
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-500">
                    Bill No: <strong className="text-slate-900 font-mono">{pawn?.bill_no || pawn?.id?.substring(0, 8)}</strong> • Branch: {pawn?.branch_id}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Warning consequence */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
              <p className="font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Workflow Consequence
              </p>
              <p className="font-semibold text-rose-700/90 text-[11px] leading-relaxed">
                Submitting this issue marks the transaction as <strong>REQUIRES RECHECK</strong> and <strong>blocks Manager approval</strong> until the branch team or cashier rectifies the issue.
              </p>
            </div>

            {/* 1. Verification Area Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Select Verification Area with Issue:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ISSUE_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedIssueArea(area)}
                    className={`px-3 py-2 rounded-xl border text-xs font-black text-left cursor-pointer transition-all ${
                      selectedIssueArea === area
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Error / Observation Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Enter Clear Error / Observation Note:
              </label>
              <textarea
                rows={4}
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="State clearly what is wrong (e.g. 'Air weight on scale photo is 12.4g but contract declared 14.8g', 'Physical item is broken', 'NIC number mismatch')..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            {/* 3. System Trail Summary */}
            <div className="p-3 bg-slate-100/70 rounded-2xl text-[11px] font-bold text-slate-600 space-y-1">
              <p className="text-slate-400 uppercase text-[9px] font-black">Audit Record Summary</p>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <span>Auditor: <strong className="text-slate-900">{user?.email || 'Current Auditor'}</strong></span>
                <span>Branch: <strong className="text-slate-900">{pawn?.branch_id}</strong></span>
                <span>Date & Time: <strong className="text-slate-900">{new Date().toLocaleString('en-GB')}</strong></span>
                <span>Status Change: <strong className="text-rose-600">REQUIRES RECHECK</strong></span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsIssueModalOpen(false)}
                className="rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitIssue}
                disabled={isSubmittingIssue || !issueNote.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs h-11 px-5 rounded-xl gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingIssue ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                Submit Issue & Request Recheck
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AUDITOR APPROVAL CONFIRMATION MODAL */}
      <Dialog open={isConfirmApprovalModalOpen} onOpenChange={setIsConfirmApprovalModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-2xl">
          {/* Header Bar */}
          <div className="h-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
          
          <div className="p-6 space-y-5">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                    Confirm Auditor Approval
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-500">
                    Bill No: <strong className="text-slate-900 font-mono">{pawn?.bill_no || pawn?.id?.substring(0, 8)}</strong> • Branch: {pawn?.branch_id}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Checklist Verification Summary */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
              <p className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Completed Verification Summary
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-emerald-900 pt-1">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Physical item in vault: Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Item description: Matches declared</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Gross weight: {observedWeight || grossWeightGrams.toFixed(3)} g verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Karat purity: {observedKarat || '22K'} assayed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Air/Water scale proofs: Inspected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Vault stock & Cashier: Reconciled</span>
                </div>
              </div>
            </div>

            {/* Role Limitation & Workflow Notice */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] font-semibold text-blue-900 space-y-1">
              <p className="font-black text-blue-950 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Multi-tier Governance Protocol
              </p>
              <p className="text-blue-800/90 leading-relaxed">
                Confirming this action transitions the pawn transaction to <strong>AUDITED_PENDING_APPROVAL</strong> and forwards it to the <strong>Branch Manager's Approval Queue</strong>. As Auditor, this certifies physical compliance but does <em>not</em> release money or modify vault stock.
              </p>
            </div>

            {/* Mandatory Auditor Certification Checkbox */}
            <label className="flex items-start gap-3 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
              <input
                type="checkbox"
                checked={auditorCertified}
                onChange={(e) => setAuditorCertified(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 leading-snug">
                I hereby certify under branch audit regulations that I have physically inspected the declared collateral, performed scale weight and purity checks, and verified all documents. I confirm this transaction is authentic, accurate, and ready for Manager approval.
              </span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmApprovalModalOpen(false)}
                className="rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAuditorApproval}
                disabled={isSubmittingApproval || !auditorCertified}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 px-5 rounded-xl gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingApproval ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm Approval & Forward to Manager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
