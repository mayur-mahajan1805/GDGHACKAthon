import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, UserPlus, LogIn, ShieldCheck, Building2, MapPin, BadgeCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const DEMO_EMAIL = 'official@voice2action.gov';
const DEMO_PASSWORD = 'demo1234';

const DEPARTMENTS = [
  { id: 'road', label: 'Road Maintenance & Infrastructure' },
  { id: 'water', label: 'Water Supply & Sanitation' },
  { id: 'electricity', label: 'Electricity & Power Grid' },
  { id: 'waste', label: 'Waste Management & Cleanliness' },
  { id: 'health', label: 'Public Health & Medical Services' },
  { id: 'general', label: 'General Administration & HQ' },
];

const WARDS = [
  'Ward 1 - North District',
  'Ward 2 - South District',
  'Ward 3 - Central District',
  'Ward 4 - East District',
  'Ward 5 - West District',
  'All Wards / Central HQ',
];

const DESIGNATIONS = [
  'Field Inspector / Officer',
  'Ward Engineer',
  'Assistant Executive Engineer',
  'Department Supervisor',
  'Administrative / Chief Officer',
];

export function LoginPage() {
  const { signIn, signUp, loading, error: authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('road');
  const [ward, setWard] = useState(WARDS[0]);
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters.');
        return;
      }
      if (!name.trim()) {
        setValidationError('Please enter your full name.');
        return;
      }

      signUp({
        name: name.trim(),
        employeeId: employeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department,
        ward,
        designation,
        email: email.trim(),
        password,
      });
    } else {
      signIn(email.trim(), password);
    }
  }

  function fillDemo() {
    setIsSignUp(false);
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  const activeError = validationError || authError;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-8">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      <div className={`relative w-full transition-all duration-300 ${isSignUp ? 'max-w-xl' : 'max-w-md'}`}>
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
            <ShieldCheck size={14} />
            <span>Government Officials Secure Portal</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="14" cy="14" r="3.5" fill="white"/>
                <path d="M14 10V7M14 21V18M10 14H7M21 14H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Voice2Action</h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Municipal Governance & Citizen Issue Response System
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setValidationError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                !isSignUp
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={15} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setValidationError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                isSignUp
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} />
              Register Official
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REGISTER FORM FIELDS */}
            {isSignUp ? (
              <>
                {/* Section 1: Official Identity */}
                <div className="border-b border-slate-800 pb-3 mb-1">
                  <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase flex items-center gap-1.5 mb-3">
                    <BadgeCheck size={13} /> Personal & Employee Info
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Full Officer Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Officer Rajesh Sharma"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Employee / Badge ID
                      </label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. GOV-2026-894"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Department & Ward Jurisdiction */}
                <div className="border-b border-slate-800 pb-3 mb-1">
                  <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase flex items-center gap-1.5 mb-3">
                    <Building2 size={13} /> Jurisdiction & Department
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Department Category <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Assigned Ward / Zone <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          {WARDS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Official Designation <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          {DESIGNATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Credentials */}
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase flex items-center gap-1.5 mb-3">
                    <Lock size={13} /> Account Credentials
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Official Email Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="officer.name@yourdept.gov"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* SIGN IN FORM FIELDS */
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="official@voice2action.gov"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 pl-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error Message Box */}
            {activeError && (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-2.5 mt-2">
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{activeError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-blue-600/25 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {isSignUp ? 'Creating Official Account…' : 'Authenticating…'}
                </span>
              ) : isSignUp ? (
                'Complete Official Registration'
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Quick Demo Fill Section */}
          {!isSignUp && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Quick Hackathon Demo Account</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                  Default Admin
                </span>
              </div>
              <button
                id="demo-fill"
                type="button"
                onClick={fillDemo}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-slate-300 transition-colors font-mono text-center"
              >
                {DEMO_EMAIL} / {DEMO_PASSWORD}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Voice2Action · Encrypted Municipal Official Access · Hackathon 2026
        </p>
      </div>
    </div>
  );
}
