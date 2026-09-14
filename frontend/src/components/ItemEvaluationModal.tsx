import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, AlertCircle, RefreshCw, Activity, PackageSearch } from 'lucide-react';
import { WebcamCapture } from './WebcamCapture';
import { createClient } from '@supabase/supabase-js';

// Fallback to anon key if env not set (for demo/development)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ielkaetihagxgnrrasch.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGthZXRpaGFneGducnJhc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDE1NTksImV4cCI6MjA5OTY3NzU1OX0.YKLOHhXhUCgG1eMZiksR4H7UwySjhWzc0e_pomh_0oI'
);

interface EvaluationResult {
  airWeight: number;
  waterWeight: number;
  askingAmount: number;
  trueValue: number;
}

interface ItemEvaluationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (data: EvaluationResult) => void;
}

export function ItemEvaluationModal({ isOpen, onOpenChange, onAccept }: ItemEvaluationModalProps) {
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [airWeight, setAirWeight] = useState<string>('');
  const [waterWeight, setWaterWeight] = useState<string>('');
  const [askingAmount, setAskingAmount] = useState<string>('');
  const [trueValue, setTrueValue] = useState<string>('');
  
  const [specificGravity, setSpecificGravity] = useState<number>(0);
  const [estimatedKarat, setEstimatedKarat] = useState<string>('Unknown');
  
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [captureTarget, setCaptureTarget] = useState<'AIR' | 'WATER' | null>(null);
  
  const [airWeightPhoto, setAirWeightPhoto] = useState<string | null>(null);
  const [waterWeightPhoto, setWaterWeightPhoto] = useState<string | null>(null);

  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Calculate SG when weights change
  useEffect(() => {
    const aw = parseFloat(airWeight);
    const ww = parseFloat(waterWeight);
    
    if (aw > 0 && ww > 0 && aw > ww) {
      const sg = aw / (aw - ww);
      setSpecificGravity(sg);
      
      // Determine Karat
      if (sg >= 19.3) setEstimatedKarat('24K');
      else if (sg >= 17.5) setEstimatedKarat('22K');
      else if (sg >= 16.5) setEstimatedKarat('21K');
      else if (sg >= 14.7) setEstimatedKarat('18K');
      else if (sg >= 12.6) setEstimatedKarat('14K');
      else if (sg >= 11.4) setEstimatedKarat('10K');
      else if (sg >= 11.1) setEstimatedKarat('9K');
      else setEstimatedKarat('Unknown / Base Metal');
    } else {
      setSpecificGravity(0);
      setEstimatedKarat('Unknown');
    }
  }, [airWeight, waterWeight]);

  const handleCapture = async (base64Img: string) => {
    setShowWebcam(false);
    
    if (captureTarget === 'AIR') {
      setAirWeightPhoto(base64Img);
      if (mode === 'AUTO') processOCR(base64Img, setAirWeight);
    } else if (captureTarget === 'WATER') {
      setWaterWeightPhoto(base64Img);
      if (mode === 'AUTO') processOCR(base64Img, setWaterWeight);
    }
    setCaptureTarget(null);
  };

  const processOCR = async (imgData: string, setter: (val: string) => void) => {
    setIsProcessingOcr(true);
    setOcrError(null);
    try {
      // Dynamically import tesseract to prevent Next.js Out-Of-Memory errors during bundling
      const Tesseract = (await import('tesseract.js')).default;
      
      // Using tesseract to read digits from the scale display
      const result = await Tesseract.recognize(imgData, 'eng', {
        tessedit_char_whitelist: '0123456789.', // Only numbers and decimal
      });
      
      const text = result.data.text.trim();
      // Basic regex to find a number in the text
      const match = text.match(/\d+(\.\d+)?/);
      
      if (match && match[0]) {
        setter(match[0]);
      } else {
        setOcrError("Could not read numbers clearly. Please enter manually.");
        setMode('MANUAL');
      }
    } catch (err) {
      console.error(err);
      setOcrError("OCR failed. Switching to manual mode.");
      setMode('MANUAL');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const openCamera = (target: 'AIR' | 'WATER') => {
    setCaptureTarget(target);
    setShowWebcam(true);
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      // Create a record in Supabase
      const { error } = await supabase.from('rejected_evaluations').insert([{
        air_weight: parseFloat(airWeight) || 0,
        water_weight: parseFloat(waterWeight) || 0,
        specific_gravity: specificGravity,
        estimated_karat: estimatedKarat,
        asking_amount: parseFloat(askingAmount) || 0,
        true_value: parseFloat(trueValue) || 0,
        status: 'REJECTED',
        // In a real app, upload base64 to storage bucket first, then save URL
        air_weight_photo_url: airWeightPhoto ? 'uploaded_to_bucket' : null,
        water_weight_photo_url: waterWeightPhoto ? 'uploaded_to_bucket' : null,
      }]);
      
      if (error) {
        console.error("Error saving rejection:", error);
        alert("Failed to save rejection record.");
      } else {
        alert("Item rejected and recorded.");
        resetForm();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAccept = () => {
    onAccept({
      airWeight: parseFloat(airWeight) || 0,
      waterWeight: parseFloat(waterWeight) || 0,
      askingAmount: parseFloat(askingAmount) || 0,
      trueValue: parseFloat(trueValue) || 0,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setAirWeight('');
    setWaterWeight('');
    setAskingAmount('');
    setTrueValue('');
    setAirWeightPhoto(null);
    setWaterWeightPhoto(null);
    setOcrError(null);
    setMode('MANUAL');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { onOpenChange(v); if(!v) resetForm(); }}>
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] flex flex-col overflow-hidden">
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 shrink-0" />
        
        {showWebcam && captureTarget ? (
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 text-center">Capture {captureTarget === 'AIR' ? 'Air' : 'Water'} Weight</h3>
            <WebcamCapture onCapture={handleCapture} onClose={() => setShowWebcam(false)} />
          </div>
        ) : (
          <>
            <div className="p-6 pb-2 border-b border-slate-100">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-slate-900">
                    Customer Registration
                  </DialogTitle>
                </div>
                <DialogDescription className="font-semibold text-slate-500 text-sm mt-2">
                  Evaluate item weights, determine specific gravity, and calculate value before originating pawn.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'MANUAL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setMode('MANUAL')}
                >
                  Manual Mode
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${mode === 'AUTO' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setMode('AUTO')}
                >
                  <Camera className="w-4 h-4" /> Auto (OCR) Mode
                </button>
              </div>

              {ocrError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {ocrError}
                </div>
              )}

              {/* Weights Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Air Weight (mg)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={airWeight}
                      onChange={(e) => setAirWeight(e.target.value)}
                      placeholder="e.g. 12500"
                      className="font-mono font-bold"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => openCamera('AIR')}
                      className={airWeightPhoto ? 'border-green-500 text-green-600 bg-green-50' : ''}
                      title="Take Photo Proof"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Water Weight (mg)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={waterWeight}
                      onChange={(e) => setWaterWeight(e.target.value)}
                      placeholder="e.g. 11800"
                      className="font-mono font-bold"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => openCamera('WATER')}
                      className={waterWeightPhoto ? 'border-green-500 text-green-600 bg-green-50' : ''}
                      title="Take Photo Proof"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calculations Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Specific Gravity
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {specificGravity > 0 ? specificGravity.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Purity
                  </div>
                  <div className="text-xl font-black text-amber-600">
                    {estimatedKarat}
                  </div>
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Asking (Rs.)</Label>
                  <Input 
                    type="number" 
                    value={askingAmount}
                    onChange={(e) => setAskingAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="font-mono font-bold text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">True Value (Rs.)</Label>
                  <Input 
                    type="number" 
                    value={trueValue}
                    onChange={(e) => setTrueValue(e.target.value)}
                    placeholder="e.g. 55000"
                    className="font-mono font-bold text-lg h-12 border-amber-300 focus-visible:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReject} 
                disabled={isRejecting || isProcessingOcr || (!airWeight && !waterWeight)}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-12"
              >
                {isRejecting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject
              </Button>
              <Button 
                onClick={handleAccept} 
                disabled={isRejecting || isProcessingOcr || !airWeight || !waterWeight || !trueValue}
                className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-black h-12 text-lg shadow-lg shadow-amber-500/20"
              >
                Accept & Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
