'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Smartphone, Send, RefreshCcw, Save, ShieldCheck, 
  CheckCircle2, AlertTriangle, MessageSquare, Radio, Server
} from "lucide-react";
import { toast } from "sonner";

export default function SmsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  /* Gateway Config State */
  const [gatewayUrl, setGatewayUrl] = useState('http://192.168.1.50:8080/send');
  const [apiKey, setApiKey] = useState('MIFOS_SMS_SECRET_2026');
  const [simSlot, setSimSlot] = useState('1');
  const [enabled, setEnabled] = useState(true);

  /* Test SMS State */
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testMessage, setTestMessage] = useState('RUPASINGHE PAWNING: Test receipt message from Android SIM Gateway.');

  /* SMS Logs */
  const [logs, setLogs] = useState<any[]>([]);

  const loadSettingsAndLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/sms');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setGatewayUrl(data.config.gatewayUrl || 'http://192.168.1.50:8080/send');
          setApiKey(data.config.apiKey || 'MIFOS_SMS_SECRET_2026');
          setSimSlot(String(data.config.simSlot || '1'));
          setEnabled(data.config.enabled !== false);
        }
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndLogs();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving Android SIM Gateway settings...');
    try {
      const res = await fetch('/api/settings/sms-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayUrl,
          apiKey,
          simSlot: parseInt(simSlot) || 1,
          enabled
        })
      });

      if (res.ok) {
        toast.success('Android SIM Gateway configuration saved!', { id: toastId });
      } else {
        toast.error('Failed to save configuration', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Error saving settings: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhone || !testMessage) return toast.error('Enter phone number and message');
    setTesting(true);
    const toastId = toast.loading('Sending test SMS via Android Gateway...');

    try {
      const res = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          ticketNo: 'TEST-001',
          amount: 50000,
          type: 'TEST'
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.status === 'SENT') {
          toast.success('Test SMS dispatched successfully via Android SIM!', { id: toastId });
        } else {
          toast.info(`SMS queued in database (${data.notice})`, { id: toastId });
        }
        loadSettingsAndLogs();
      } else {
        toast.error(data.error || 'Failed to dispatch SMS', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Error dispatching test SMS: ' + err.message, { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-16">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-8 rounded-3xl border-white/40 shadow-2xl gap-6 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
              Android SIM <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">SMS Gateway</span>
            </h1>
            <p className="text-slate-500 font-semibold text-xs tracking-tight mt-1">
              Free unlimited customer receipt SMS dispatch via branch Android phone SIM card.
            </p>
          </div>
        </div>

        <Button
          onClick={loadSettingsAndLogs}
          variant="outline"
          className="h-11 px-4 bg-white/80 border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm text-xs"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-amber-500' : ''}`} /> Refresh Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gateway Configuration Settings Card */}
        <Card className="glass border-white/40 shadow-xl rounded-3xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-500" />
              <h2 className="font-black text-base text-slate-900">Gateway Connection Settings</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono text-[10px] font-black uppercase tracking-wider">
              100% Free Local SIM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Android Phone Local IP Gateway URL</Label>
              <Input
                value={gatewayUrl}
                onChange={e => setGatewayUrl(e.target.value)}
                placeholder="http://192.168.1.50:8080/send"
                className="h-11 rounded-xl bg-white/80 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Enter the IP address of the Android phone connected to branch Wi-Fi running SMS Gateway app.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Gateway API Key / Secret Token</Label>
              <Input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                type="password"
                placeholder="MIFOS_SMS_SECRET_2026"
                className="h-11 rounded-xl bg-white/80 font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">SIM Card Slot</Label>
              <Input
                value={simSlot}
                onChange={e => setSimSlot(e.target.value)}
                type="number"
                placeholder="1"
                className="h-11 rounded-xl bg-white/80 font-mono text-xs"
              />
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>How to setup Free Android SIM SMS:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-700">
              <li>Connect an Android phone to the branch Wi-Fi network.</li>
              <li>Install any standard free SMS Gateway app (e.g., <i>SMS Gateway API</i>) from Play Store.</li>
              <li>Insert SIM card with an Unlimited SMS pack.</li>
              <li>Copy the HTTP URL (e.g. <code className="bg-white/80 px-1 py-0.5 rounded font-mono">http://192.168.1.50:8080/send</code>) into the box above and click Save.</li>
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="h-11 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs gap-2 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" /> Save Gateway Settings
            </Button>
          </div>
        </Card>

        {/* Test SMS Dispatcher Card */}
        <Card className="glass border-white/40 shadow-xl rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-base text-slate-900">Send Test SMS</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Test Mobile Number</Label>
              <Input
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="0771234567"
                className="h-10 rounded-xl bg-white/80 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Message Content</Label>
              <textarea
                rows={4}
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <Button
              onClick={handleSendTestSms}
              disabled={testing}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs gap-2 shadow-md"
            >
              <Send className={`w-4 h-4 ${testing ? 'animate-bounce' : ''}`} /> Dispatch Test SMS
            </Button>
          </div>
        </Card>

      </div>

      {/* Dispatch Logs Table */}
      <Card className="glass border-white/40 shadow-2xl rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-lg text-slate-900 tracking-tight">Recent Customer SMS Dispatch Logs</h2>
          <span className="text-xs font-bold text-slate-400">Total Logs: {logs.length}</span>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300 py-4 pl-6">Timestamp</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Customer Mobile</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Message Text</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Ticket #</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-300">Status & Notice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold text-sm">
                    No SMS dispatch logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('en-GB') : '—';
                  const isSent = log.status === 'SENT';

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6 font-mono text-xs font-semibold text-slate-600">
                        {dateStr}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {log.phone}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-amber-600">
                        {log.ticket_no || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${isSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isSent ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.dispatch_notice || 'Queued in database'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
