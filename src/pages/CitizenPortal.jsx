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
  CheckCircle,
  Activity,
  Calendar,
  Layers,
  Phone,
  User,
  Info
} from 'lucide-react';
import { createCitizenComplaint, fetchComplaintByTrackingId } from '../utils/complaintService';
import { WARD_COORDINATES } from '../utils/wardCoordinates';
import { LocationPickerMap } from '../components/map/LocationPickerMap';

const CATEGORIES = [
  {
    id: 'road',
    name: 'Roads & Potholes',
    desc: 'Potholes, broken tarmac, cave-ins & damaged walkways',
    icon: MapPin,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    glowColor: 'group-hover:border-amber-500/50 group-hover:shadow-amber-500/10',
    accentColor: '#f59e0b',
  },
  {
    id: 'water',
    name: 'Water Supply & Leakage',
    desc: 'Supply cuts, pipe burst, low pressure & contamination',
    icon: Droplets,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    glowColor: 'group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/10',
    accentColor: '#06b6d4',
  },
  {
    id: 'electricity',
    name: 'Power & Streetlights',
    desc: 'Dark streetlights, blown transformers & dangling cables',
    icon: Zap,
    badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    glowColor: 'group-hover:border-yellow-500/50 group-hover:shadow-yellow-500/10',
    accentColor: '#eab308',
  },
  {
    id: 'waste',
    name: 'Garbage & Sanitation',
    desc: 'Uncollected trash, illegal dumping & overflowing bins',
    icon: Trash2,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    glowColor: 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10',
    accentColor: '#10b981',
  },
  {
    id: 'health',
    name: 'Public Health & Sewage',
    desc: 'Sewage overflow, stagnant water & dengue vector risk',
    icon: AlertTriangle,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    glowColor: 'group-hover:border-rose-500/50 group-hover:shadow-rose-500/10',
    accentColor: '#f43f5e',
  },
  {
    id: 'education',
    name: 'Civic Infrastructure',
    desc: 'Municipal schools, community shelters & public assets',
    icon: Building2,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    glowColor: 'group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10',
    accentColor: '#6366f1',
  },
  {
    id: 'other',
    name: 'General Civic Issue',
    desc: 'Public toilets, noise violations & general grievances',
    icon: FileText,
    badgeColor: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    glowColor: 'group-hover:border-slate-500/50 group-hover:shadow-slate-500/10',
    accentColor: '#94a3b8',
  },
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
      text: 'Deep dangerous pothole filled with rainwater causing severe vehicle skidding and 2-wheeler accidents near Ward 3 market junction. Immediate road patching required.',
      photo_url: 'https://images.unsplash.com/photo-1581093804475-577d72e35330?w=600',
      citizen_name: 'Rahul Sharma',
      citizen_phone: '+91 98765 43210',
      urgency_score: 85,
    });
    setCurrentStep(4);
    setValidationError(null);
    triggerToast('⚡ Sample complaint auto-loaded! Review & submit in Step 4.');
  };

  // Select Category & advance
  const handleCategorySelect = (catId) => {
    setFormData(prev => ({ ...prev, category: catId }));
    const catObj = CATEGORIES.find(c => c.id === catId);
    triggerToast(`Category selected: ${catObj?.name || catId}`);
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
        text: (prev.text ? prev.text + ' ' : '') + 'Large dangerous pothole causing major vehicle skidding and traffic obstruction. Urgent repair needed by ward engineering team.',
      }));
      setValidationError(null);
      setIsRecording(false);
      triggerToast('🎙️ AI voice transcription captured & converted to text!');
    }, 1600);
  };

  const handleSubmitComplaint = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.text.trim()) {
      setCurrentStep(3);
      setValidationError('Please enter a description of the grievance before submitting.');
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
        setTrackError(`No complaint found with Tracking ID "${trackIdInput.toUpperCase()}". Please check your code.`);
      }
    } catch (err) {
      console.error(err);
      setTrackError('Failed to retrieve ticket status. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative pb-32 overflow-y-auto overflow-x-hidden">
      {/* Ambient background glow elements */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 max-w-md">
          <BellRing className="w-5 h-5 text-cyan-400 shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-semibold pr-2 leading-tight">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white cursor-pointer ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Civic Branding */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CivicVoice
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Official Citizen Portal
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Municipal Grievance Redressal & GIS Dispatch Platform
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </div>

            <div className="h-5 w-px bg-slate-800 hidden md:block" />

            {/* Official Dashboard Access */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Official Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* ============================================================ */}
        {/* TAB 1: REGISTER GRIEVANCE WIZARD */}
        {/* ============================================================ */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            
            {/* Hero Header Section */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-cyan-950/20 backdrop-blur-xl p-5 sm:p-7 shadow-2xl">
              {/* Subtle background radial light */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/90 border border-cyan-700/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Government of NCT · Municipal Cell
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" /> 24x7 AI Ingestion
                    </span>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                    Citizen Grievance Redressal Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Submit public infrastructure and utility complaints directly to your ward engineer. Every complaint is geotagged, assigned an SLA, and tracked live.
                  </p>
                </div>

                {/* Auto-Fill Demo Button */}
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/30 transition-all shrink-0 active:scale-95 cursor-pointer group"
                >
                  <Wand2 className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                  <span>Fill Sample Complaint</span>
                </button>
              </div>

              {/* Feature Highlights Row */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-5 pt-4 border-t border-slate-800/80 text-[11px] sm:text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Auto-routed to Ward Officers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>GPS Geotagged on City Map</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Live SMS & Tracking ID</span>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
              {/* Connected glow line */}
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-800 hidden sm:block">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-sm shadow-cyan-500/50"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                {[
                  { step: 1, label: 'Category', icon: Layers },
                  { step: 2, label: 'Location Pin', icon: MapPin },
                  { step: 3, label: 'Details & Voice', icon: FileText },
                  { step: 4, label: 'Review & Submit', icon: CheckCircle },
                ].map(({ step, label, icon: StepIcon }) => {
                  const isActive = currentStep === step;
                  const isDone = currentStep > step || (step === 3 && Boolean(formData.text));

                  return (
                    <button
                      type="button"
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                          : isDone
                          ? 'bg-slate-900/60 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isDone && !isActive ? '✓' : step}
                      </div>
                      <div className="text-left hidden sm:block">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block leading-none">Step {step}</span>
                        <span className="text-xs font-bold block">{label}</span>
                      </div>
                      <span className="text-[11px] font-semibold sm:hidden">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Wizard Active Content Box */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
              
              {/* STEP 1: CATEGORY SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">1</span>
                        Select Grievance Category
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Choose the primary civic domain for automated dispatch to the appropriate municipal department.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.category === cat.id;

                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`group p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? 'bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-500/15 -translate-y-0.5'
                              : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700 text-slate-400 hover:text-slate-200 hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cat.badgeColor} shadow-inner`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full">
                                Selected ✓
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-100 block leading-tight group-hover:text-white">
                              {cat.name}
                            </span>
                            <span className="text-[11px] text-slate-400 leading-normal block">
                              {cat.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION PINNING */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">2</span>
                      Geotag Grievance Location
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select your municipal Ward and click on the interactive GIS map or drag the pin to pinpoint the exact issue.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Municipal Ward / Zone
                      </label>
                      <select
                        value={formData.ward}
                        onChange={(e) => handleWardChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 cursor-pointer"
                      >
                        {WARDS.map((w) => (
                          <option key={w} value={w}>{w} - Central Municipality</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Street Address / Landmark
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. Opposite Community Health Center, Gate 2"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  {/* Leaflet Location Picker */}
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
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">3</span>
                        Describe Grievance & Urgency
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Provide a clear description or use AI speech-to-text to dictate your grievance in your regional dialect.
                      </p>
                    </div>

                    {/* AI Voice Dictation */}
                    <button
                      type="button"
                      onClick={handleVoiceSimulate}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-cyan-400 border-cyan-800/60 shadow-lg shadow-cyan-950/30'
                      }`}
                    >
                      {isRecording ? <Volume2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                      <span>{isRecording ? 'Listening (AI Transcription)...' : 'AI Voice Dictation'}</span>
                    </button>
                  </div>

                  {validationError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Detailed Problem Description <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      ref={descriptionRef}
                      rows={4}
                      required
                      value={formData.text}
                      onChange={(e) => {
                        setFormData({ ...formData, text: e.target.value });
                        if (e.target.value.trim()) setValidationError(null);
                      }}
                      placeholder="Describe the problem, hazard level, and how long it has persisted (e.g. Major pothole causing 2-wheeler skidding, overflowing sewage water outside residences)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed"
                    />
                  </div>

                  {/* Urgency Rating Slider */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        Citizen Severity Assessment
                      </span>
                      <span className={`font-bold font-mono px-2.5 py-1 rounded-full text-[11px] border ${
                        formData.urgency_score >= 80 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        formData.urgency_score >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        Score: {formData.urgency_score}/100 · {formData.urgency_score >= 80 ? 'CRITICAL (Priority Action)' : formData.urgency_score >= 50 ? 'MEDIUM (Standard)' : 'LOW (Routine)'}
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
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Low (Minor inconvenience)</span>
                      <span>Moderate (Normal turnaround)</span>
                      <span className="text-rose-400 font-semibold">Critical Hazard (Immediate)</span>
                    </div>
                  </div>

                  {/* Optional Photo Attachment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      Evidence Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or cloud image link"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CITIZEN CONTACT */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">4</span>
                      Review Grievance & Citizen Contact
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Confirm all information before registering with the municipal database.
                    </p>
                  </div>

                  {/* Executive Grievance Summary Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${selectedCategoryObj.badgeColor}`}>
                          {selectedCategoryObj.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                          {formData.ward}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-cyan-300">
                        GPS: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Description:</span>
                      <p className="text-xs sm:text-sm font-medium text-slate-100 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                        "{formData.text || 'No description provided'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{formData.address}</span>
                    </div>
                  </div>

                  {/* Citizen Contact Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Citizen Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.citizen_name}
                        onChange={(e) => setFormData({ ...formData, citizen_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Mobile Number (For SMS Tracking Updates)
                      </label>
                      <input
                        type="tel"
                        value={formData.citizen_phone}
                        onChange={(e) => setFormData({ ...formData, citizen_phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: LIVE TRACK STATUS */}
        {/* ============================================================ */}
        {activeTab === 'track' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Search Box */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Search className="w-6 h-6 text-cyan-400" />
                  Live Grievance Status Tracker
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Enter your unique municipal Tracking ID (e.g. <code className="text-cyan-300 font-mono">V2A-001</code>) to view live action updates from ward engineers.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  value={trackIdInput}
                  onChange={(e) => setTrackIdInput(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. V2A-001)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono tracking-widest focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={trackingLoading || !trackIdInput.trim()}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search Ticket</span>
                </button>
              </form>
            </div>

            {/* Error Message */}
            {trackError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Ticket Progression Details */}
            {trackedData && (
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Municipal Tracking ID</span>
                    <h3 className="text-3xl font-black text-cyan-400 font-mono tracking-wider">{trackedData.tracking_id}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Workflow Stage</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 border ${
                      trackedData.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      trackedData.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      trackedData.status === 'assigned' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {trackedData.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Stepper Timeline */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {['new', 'assigned', 'in_progress', 'resolved'].map((st, idx) => {
                      const statusOrder = ['new', 'assigned', 'in_progress', 'resolved'];
                      const currentIdx = statusOrder.indexOf(trackedData.status);
                      const stepIdx = statusOrder.indexOf(st);
                      const isCompleted = currentIdx >= stepIdx;

                      return (
                        <div key={st} className="space-y-2 relative z-10">
                          <div className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                            isCompleted
                              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className={`text-xs block font-bold capitalize ${isCompleted ? 'text-cyan-300' : 'text-slate-500'}`}>
                            {st.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Details Summary */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span>Category: <strong className="text-slate-200 capitalize">{trackedData.category}</strong></span>
                    <span>Ward: <strong className="text-slate-200">{trackedData.ward}</strong></span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                    "{trackedData.text || trackedData.summary}"
                  </p>
                  {trackedData.address && (
                    <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{trackedData.address} (GPS: {trackedData.lat?.toFixed(4)}, {trackedData.lng?.toFixed(4)})</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* FLOATING GLASS ACTION BAR FOR WIZARD NAVIGATION */}
      {/* ============================================================ */}
      {activeTab === 'register' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/90 shadow-2xl p-3 sm:p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(s => s - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 border border-slate-700/80 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Step 1: Choose an issue category above to begin
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 3 && !formData.text.trim()) {
                      setValidationError('Please enter a problem description before proceeding.');
                      triggerToast('⚠️ Problem description is required!');
                      descriptionRef.current?.focus();
                      return;
                    }
                    setValidationError(null);
                    setCurrentStep(s => s + 1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer active:scale-95"
                >
                  {currentStep === 1 && <span>Next: Geotag Location ➔</span>}
                  {currentStep === 2 && <span>Next: Issue Details ➔</span>}
                  {currentStep === 3 && <span>Next: Review & Submit ➔</span>}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitComplaint}
                  disabled={submitting}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting to Municipal DB...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Grievance Officially</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POPUP MODAL ON COMPLAINT REGISTRATION */}
      {/* ============================================================ */}
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white">Grievance Registered!</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your complaint has been formally logged into the municipal database and pinned on the Official City GIS Map.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-2 relative group shadow-inner">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Your Official Tracking ID</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black text-cyan-400 font-mono tracking-widest">{submittedTicket}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

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
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Track Ticket Live</span>
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
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95"
              >
                <span>File Another Issue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
