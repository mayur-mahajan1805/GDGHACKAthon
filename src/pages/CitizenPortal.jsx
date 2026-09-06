import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  MapPin,
  Camera,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Shield,
  Loader2,
  Send,
  Droplets,
  Zap,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Volume2,
  Sliders,
  Copy,
  Check,
  X,
  BellRing,
  Wand2,
  CheckCircle
} from 'lucide-react';
import { createCitizenComplaint, fetchComplaintByTrackingId } from '../utils/complaintService';
import { WARD_COORDINATES } from '../utils/wardCoordinates';
import { LocationPickerMap } from '../components/map/LocationPickerMap';

const CATEGORIES = [
  { id: 'road', name: 'Roads & Potholes', icon: MapPin, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'water', name: 'Water Supply', icon: Droplets, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'electricity', name: 'Electricity / Streetlights', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { id: 'waste', name: 'Garbage & Sanitation', icon: Trash2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'health', name: 'Public Health & Sewage', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'education', name: 'Civic Schools & Infra', icon: Building2, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'other', name: 'General Community Issue', icon: FileText, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'
];

export function CitizenPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'track'
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3, 4
  const descriptionRef = useRef(null);

  // Register Form State
  const [formData, setFormData] = useState({
    category: 'road',
    ward: 'Ward 3',
    address: 'Near Central Market, Ward 3',
    lat: WARD_COORDINATES['Ward 3'].lat,
    lng: WARD_COORDINATES['Ward 3'].lng,
    text: '',
    photo_url: '',
    citizen_name: '',
    citizen_phone: '',
    urgency_score: 75,
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [syncStatus, setSyncStatus] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Track Ticket State
  const [trackIdInput, setTrackIdInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedData, setTrackedData] = useState(null);
  const [trackError, setTrackError] = useState(null);

  // Trigger Toast Notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Quick Demo Auto-Fill
  const handleQuickFill = () => {
    setFormData({
      category: 'road',
      ward: 'Ward 3',
      address: 'Central Market Main Gate, Ward 3',
      lat: 28.61392,
      lng: 77.20902,
      text: 'Deep pothole filled with rainwater causing vehicle damage near Ward 3 market junction. Urgent repair needed.',
      photo_url: 'https://images.unsplash.com/photo-1581093804475-577d72e35330?w=400',
      citizen_name: 'Rahul Sharma',
      citizen_phone: '+91 98765 43210',
      urgency_score: 85,
    });
    setCurrentStep(4);
    setValidationError(null);
    triggerToast('⚡ Sample complaint loaded! Click "Submit Complaint Officially" in the bottom bar.');
  };

  // Select Category & advance
  const handleCategorySelect = (catId) => {
    const catObj = CATEGORIES.find(c => c.id === catId);
    setFormData(prev => ({ ...prev, category: catId }));
    triggerToast(`Selected Category: ${catObj?.name || catId}`);
    setCurrentStep(2);
  };

  // Ward Change Handler: Auto-centers map to ward center
  const handleWardChange = (newWard) => {
    const coords = WARD_COORDINATES[newWard] || WARD_COORDINATES['Ward 1'];
    setFormData((prev) => ({
      ...prev,
      ward: newWard,
      lat: coords.lat,
      lng: coords.lng,
      address: `Near Main Junction, ${newWard}`,
    }));
  };

  const handleLocationChange = ({ lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      lat,
      lng,
      address: prev.address || `Pin Location: ${lat}, ${lng}`,
    }));
  };

  const handleVoiceSimulate = () => {
    setIsRecording(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        text: (prev.text ? prev.text + ' ' : '') + 'Large dangerous pothole causing major skidding and accidents. Requires urgent patching work.',
      }));
      setValidationError(null);
      setIsRecording(false);
      triggerToast('AI Voice transcription captured successfully!');
    }, 1800);
  };

  const handleSubmitComplaint = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.text.trim()) {
      setCurrentStep(3);
      setValidationError('Please enter a description of the problem before submitting.');
      triggerToast('⚠️ Please enter a problem description!');
      setTimeout(() => descriptionRef.current?.focus(), 100);
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      const res = await createCitizenComplaint(formData);
      setSubmittedTicket(res.tracking_id);
      setSyncStatus(res.firestoreSaved);
      setSyncError(res.firestoreError);
      setShowSuccessModal(true);
      triggerToast(`🎉 Complaint registered! Tracking ID: ${res.tracking_id}`);
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      triggerToast('❌ Error submitting complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedTicket) {
      navigator.clipboard.writeText(submittedTicket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackIdInput.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedData(null);

    try {
      const result = await fetchComplaintByTrackingId(trackIdInput);
      if (result) {
        setTrackedData(result);
      } else {
        setTrackError(`No complaint found with Tracking ID "${trackIdInput.toUpperCase()}". Please check your ID and try again.`);
      }
    } catch (err) {
      console.error(err);
      setTrackError('Failed to search complaint. Please try again later.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative pb-28 overflow-y-auto overflow-x-hidden">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl shadow-cyan-500/20 flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 max-w-md">
          <BellRing className="w-5 h-5 text-cyan-400 shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-semibold pr-2 leading-tight">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight block leading-tight">
                CivicVoice <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60 ml-1">Citizen Portal</span>
              </span>
              <span className="text-xs text-slate-400">Public Grievance & Complaint Service</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              Register Complaint
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1.5" />
              Track Status
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Official Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* TAB 1: REGISTER COMPLAINT */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            {/* Hero Banner with Quick Fill Button (Shown on Step 1) */}
            {currentStep === 1 && (
              <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-cyan-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-cyan-950 border border-cyan-800/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3" /> Direct Official Integration
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-100 leading-tight">
                    Report a Public Grievance
                  </h1>
                </div>

                {/* Quick Fill Button */}
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                  Fill Sample Complaint
                </button>
              </div>
            )}

            {/* Interactive Step Wizard Stepper */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { step: 1, name: 'Category' },
                { step: 2, name: 'Location Pin' },
                { step: 3, name: 'Details' },
                { step: 4, name: 'Submit' },
              ].map(({ step, name }) => {
                const isActive = currentStep === step;
                const isDone = currentStep > step || (step === 3 && Boolean(formData.text));

                return (
                  <button
                    type="button"
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40 font-bold'
                        : isDone
                        ? 'bg-slate-900 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[11px] ${
                      isActive ? 'bg-cyan-500 text-slate-950' : isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isDone && !isActive ? '✓' : step}
                    </span>
                    <span className="text-[11px] font-medium">{name}</span>
                  </button>
                );
              })}
            </div>

            {/* STEPPER WIZARD CONTAINER */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              {/* STEP 1: CATEGORY SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-bold">1</span>
                    Step 1 of 4: Select Issue Category
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.category === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500 shadow-xl shadow-cyan-500/10'
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${cat.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & MAP PINNING */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-bold">2</span>
                    Step 2 of 4: Pin Location on Map
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Select Ward Zone</label>
                      <select
                        value={formData.ward}
                        onChange={(e) => handleWardChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {WARDS.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Street Address / Landmark</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. Near Central Market Gate 2, Ward 3"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <LocationPickerMap
                    lat={formData.lat}
                    lng={formData.lng}
                    ward={formData.ward}
                    onChangeLocation={handleLocationChange}
                  />
                </div>
              )}

              {/* STEP 3: DETAILS & URGENCY */}
              {currentStep === 3 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-bold">3</span>
                      Step 3 of 4: Describe Problem & Severity
                    </h3>
                    <button
                      type="button"
                      onClick={handleVoiceSimulate}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
                      }`}
                    >
                      {isRecording ? <Volume2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                      {isRecording ? 'Listening (AI Voice)...' : 'AI Voice Input'}
                    </button>
                  </div>

                  {validationError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div>
                    <textarea
                      ref={descriptionRef}
                      rows={3}
                      required
                      value={formData.text}
                      onChange={(e) => {
                        setFormData({ ...formData, text: e.target.value });
                        if (e.target.value.trim()) setValidationError(null);
                      }}
                      placeholder="Please explain the problem in detail (e.g. Large pothole on main road near school causing accidents, severe water leakage)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Urgency Slider */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        Urgency & Priority Rating
                      </span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                        formData.urgency_score >= 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        formData.urgency_score >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {formData.urgency_score >= 80 ? 'CRITICAL (High Priority)' : formData.urgency_score >= 50 ? 'MEDIUM (Normal)' : 'LOW (Routine)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={95}
                      step={5}
                      value={formData.urgency_score}
                      onChange={(e) => setFormData({ ...formData, urgency_score: Number(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                  </div>

                  {/* Photo Attachment URL */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      Photo URL (Optional evidence picture)
                    </label>
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or image link"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: CONTACT & REVIEW SUBMIT */}
              {currentStep === 4 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px] font-bold">4</span>
                    Step 4 of 4: Contact & Register Complaint
                  </h3>

                  {/* Summary Overview Card */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Category: <strong className="text-cyan-300 uppercase font-mono">{formData.category}</strong></span>
                      <span>Ward: <strong className="text-slate-200">{formData.ward}</strong></span>
                    </div>
                    <div className="text-slate-300 pt-0.5">
                      <span className="text-slate-500 block text-[11px]">Description:</span>
                      <p className="text-xs font-medium text-slate-100 bg-slate-900/60 p-2 rounded-lg border border-slate-800 mt-1">
                        "{formData.text || 'No description provided'}"
                      </p>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1.5 pt-0.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formData.address} ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})</span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Your Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.citizen_name}
                        onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number (For SMS updates)</label>
                      <input
                        type="tel"
                        value={formData.citizen_phone}
                        onChange={(e) => setFormData({ ...formData, citizen_phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TRACK STATUS */}
        {activeTab === 'track' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Search Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                Track Complaint Status
              </h2>
              <p className="text-sm text-slate-400">
                Enter your unique Tracking ID (e.g., <code className="text-cyan-300 font-mono">V2A-001</code>) to check live progress.
              </p>

              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={trackIdInput}
                  onChange={(e) => setTrackIdInput(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. V2A-001)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-wider focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={trackingLoading || !trackIdInput.trim()}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </form>
            </div>

            {/* Error state */}
            {trackError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Tracked Ticket Card */}
            {trackedData && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">TRACKING ID</span>
                    <h3 className="text-2xl font-black text-cyan-400 font-mono">{trackedData.tracking_id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">CURRENT STATUS</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 ${
                      trackedData.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      trackedData.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      trackedData.status === 'assigned' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {trackedData.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {['new', 'assigned', 'in_progress', 'resolved'].map((st, idx) => {
                      const statusOrder = ['new', 'assigned', 'in_progress', 'resolved'];
                      const currentIdx = statusOrder.indexOf(trackedData.status);
                      const stepIdx = statusOrder.indexOf(st);
                      const isCompleted = currentIdx >= stepIdx;

                      return (
                        <div key={st} className="space-y-2 relative z-10">
                          <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs ${
                            isCompleted
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className={`text-xs block font-semibold capitalize ${isCompleted ? 'text-cyan-300' : 'text-slate-500'}`}>
                            {st.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Category: <strong className="text-slate-200 capitalize">{trackedData.category}</strong></span>
                    <span>Ward: <strong className="text-slate-200">{trackedData.ward}</strong></span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    "{trackedData.text || trackedData.summary}"
                  </p>
                  {trackedData.address && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{trackedData.address} (GPS: {trackedData.lat?.toFixed(4)}, {trackedData.lng?.toFixed(4)})</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* STICKY BOTTOM ACTION BAR FOR WIZARD NAVIGATION — ALWAYS VISIBLE! */}
      {activeTab === 'register' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 shadow-2xl p-3 sm:p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(s => s - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Select a category above to continue</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 3 && !formData.text.trim()) {
                      setValidationError('Please enter a description before proceeding.');
                      triggerToast('⚠️ Please enter a problem description!');
                      descriptionRef.current?.focus();
                      return;
                    }
                    setValidationError(null);
                    setCurrentStep(s => s + 1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
                >
                  {currentStep === 1 && 'Next: Location Pin ➔'}
                  {currentStep === 2 && 'Next: Issue Details ➔'}
                  {currentStep === 3 && 'Next: Review & Submit ➔'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitComplaint}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering Complaint...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Register Complaint Officially
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL DIALOG ON SUCCESSFUL COMPLAINT REGISTRATION */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-emerald-500/10 space-y-6 relative animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-slate-100">Complaint Registered!</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Your grievance has been successfully recorded in the municipal database and pinned on the Official Ward Map.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-2 relative group">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Your Unique Tracking ID</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black text-cyan-400 font-mono tracking-widest">{submittedTicket}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Sync Warning Notice if Firestore Rules Blocked Write */}
            {!syncStatus && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 text-left text-xs text-amber-200 space-y-1">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Firestore Rules Update Required for Live Map Sync
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Your complaint was saved locally, but Firestore rules prevented live database write (<code className="text-amber-200">{syncError}</code>).
                  To show complaints live on the Official Dashboard, update Firestore Security Rules in Firebase Console to allow <code className="text-amber-200">read, create, update: if request.auth != null;</code>.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTrackIdInput(submittedTicket);
                  setActiveTab('track');
                  setShowSuccessModal(false);
                  fetchComplaintByTrackingId(submittedTicket).then(res => setTrackedData(res));
                }}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Track Ticket Status
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCurrentStep(1);
                  setFormData({
                    category: 'road',
                    ward: 'Ward 3',
                    address: 'Near Central Market, Ward 3',
                    lat: WARD_COORDINATES['Ward 3'].lat,
                    lng: WARD_COORDINATES['Ward 3'].lng,
                    text: '',
                    photo_url: '',
                    citizen_name: '',
                    citizen_phone: '',
                    urgency_score: 75,
                  });
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                File Another Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
