import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';

// --- helpers ---
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isStrongEnough = (v: string) => v.length >= 6;

function toE164DE(input: string): string | null {
    if (!input.trim()) return null;
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('49')) return `+${digits}`;
    if (digits.startsWith('0')) return `+49${digits.slice(1)}`;
    if (digits.startsWith('1') || digits.startsWith('15') || digits.startsWith('16') || digits.startsWith('17')) {
        return `+49${digits}`;
    }
    if (input.trim().startsWith('+')) return input.trim();
    return `+49${digits}`;
}

const Register: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/booking';
    const { refreshMe } = useAuth();

    // ---- states ----
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [phone, setPhone] = React.useState('');
    const [step, setStep] = React.useState<'form' | 'verify'>('form');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [code, setCode] = React.useState('');
    const [regPayload, setRegPayload] = React.useState<{
        name: string; email: string; password: string; phoneE164: string;
    } | null>(null);

    // ---- handlers ----

    async function onSubmitForm(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError(t('nameRequired') || 'Name is required.');
        if (!isEmail(email)) return setError(t('invalidEmail') || 'Please enter a valid email.');
        if (!isStrongEnough(password)) return setError(t('register.weakPassword') || 'Password must be at least 6 characters.');
        if (password !== confirmPassword) return setError(t('register.passwordsDoNotMatch') || 'Passwords do not match.');

        const phoneE164 = toE164DE(phone) ?? undefined;
        if (!phoneE164) return setError(t('register.phoneRequired') || 'Phone is required.');

        const payload = { name: name.trim(), email: email.trim(), password, phoneE164 };

        try {
            setBusy(true);

            // 1) Check duplicates first
            await apiPost('/auth/customer/register/precheck', {
                email: payload.email,
                phoneE164: payload.phoneE164,
            });

            // 2) Send SMS
            await apiPost('/verify-phone/start', {
                phone: payload.phoneE164,
                lang: 'de',
            });

            // 3) Move to verify step
            setRegPayload(payload);
            setStep('verify');
        } catch (e: any) {
            const msg =
                typeof e?.message === 'string'
                    ? e.message
                    : t('register.verificationFailed') || 'Verification failed.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    async function onSubmitCode(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!regPayload) {
            setError(t('register.sessionExpired') || 'Session expired, please start again.');
            setStep('form');
            return;
        }

        try {
            setBusy(true);

            // 1) Verify OTP and get proof token
            const checkResp = await apiPost('/verify-phone/check', {
                phone: regPayload.phoneE164,
                code: code.trim(),
                lang: 'de',
                purpose: 'registration',
            });
            const otpToken: string | undefined = checkResp?.otpToken;
            if (!otpToken) throw new Error(t('register.verificationFailed') || 'Verification failed.');

            // 2) Complete registration
            const regResp = await apiPost('/auth/customer/register', {
                ...regPayload,
                otpToken,
            });

            const token: string | undefined = regResp?.token;
            if (!token) throw new Error(t('register.registrationFailed') || 'Registration failed.');

            // 3) Save session + redirect
            localStorage.setItem('customer_token', token);
            await refreshMe();
            navigate(next, { replace: true });
        } catch (e: any) {
            const msg =
                typeof e?.message === 'string'
                    ? e.message
                    : t('register.verificationFailed') || 'Verification failed.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    async function onResend() {
        setError(null);
        try {
            setBusy(true);
            const phoneE164 = regPayload?.phoneE164 ?? (toE164DE(phone) ?? undefined);
            if (!phoneE164) {
                setError(t('phoneRequired') || 'Phone is required.');
                return;
            }
            await apiPost('/verify-phone/start', { phone: phoneE164, lang: 'de' });
        } catch (e: any) {
            const msg =
                typeof e?.message === 'string'
                    ? e.message
                    : t('register.verificationFailed') || 'Verification failed.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    // ---- UI ----
    return (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow p-6">
            {step === 'form' ? (
                <>
                    <h1 className="text-2xl font-semibold mb-1">{t('register.register') || 'Register'}</h1>
                    <p className="text-sm text-gray-600 mb-6">
                        {t('register.createAccountBenefit') || 'Create an account for one-click bookings.'}
                    </p>

                    {error && (
                        <div className="mb-4 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmitForm} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('register.fullName') || 'Full name'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('register.fullNamePlaceholder') || 'e.g., Max Mustermann'}
                                className="w-full border rounded px-3 py-2 shadow-sm"
                                autoComplete="name"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('register.email') || 'Email'}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full border rounded px-3 py-2 shadow-sm"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password + Confirm Password */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('register.password') || 'Password'}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('register.minChars', { count: 6 }) || 'At least 6 characters'}
                                className="w-full border rounded px-3 py-2 shadow-sm pr-10"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-8 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('register.confirmPassword') || 'Confirm Password'}
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('register.confirmPasswordPlaceholder') || 'Re-enter your password'}
                                className="w-full border rounded px-3 py-2 shadow-sm pr-10"
                                autoComplete="new-password"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('register.phoneNumber') || 'Phone'}
                            </label>
                            <div className="flex items-center border rounded px-3 py-2 shadow-sm">
                                <img src="https://flagcdn.com/w40/de.png" alt="Germany" className="w-5 h-4 mr-2" />
                                <span className="mr-2 text-sm text-gray-700">+49</span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t('register.phonePlaceholder') || '157 1234567'}
                                    className="flex-1 outline-none"
                                    autoComplete="tel"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('register.phoneRequiredSms') || 'Phone is required for SMS verification.'}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={busy}
                            className={`w-full py-2.5 rounded font-semibold text-white ${
                                busy ? 'bg-gray-300' : 'bg-[#4e9f66] hover:bg-[#3e8455]'
                            } transition`}
                        >
                            {busy ? (t('register.registering') || 'Registering…') : (t('register.register') || 'Register')}
                        </button>
                    </form>

                    <div className="text-sm text-gray-600 mt-4">
                        {t('register.alreadyHaveAccount') || 'Already have an account?'}{' '}
                        <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-[#3e8455] underline">
                            {t('register.login') || 'Login'}
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-semibold mb-1">{t('register.verifyPhone') || 'Verify your phone'}</h1>
                    <p className="text-sm text-gray-600 mb-4">
                        {t('register.smsCodeSent') || 'We have sent you an SMS verification code.'}
                    </p>

                    {error && (
                        <div className="mb-4 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmitCode} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('register.enterCode') || 'Enter code'}
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={t('register.codePlaceholder') || '123456'}
                            className="w-full border rounded px-3 py-2 shadow-sm"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={busy || !code.trim()}
                            className="w-full py-2.5 rounded font-semibold text-white bg-[#4e9f66] hover:bg-[#3e8455] disabled:opacity-50"
                        >
                            {busy ? (t('register.verifying') || 'Verifying…') : (t('register.verify') || 'Verify')}
                        </button>
                    </form>

                    <button onClick={onResend} className="mt-3 text-sm underline" disabled={busy}>
                        {t('register.resendCode') || 'Resend code'}
                    </button>
                </>
            )}
        </div>
    );
};

export default Register;
