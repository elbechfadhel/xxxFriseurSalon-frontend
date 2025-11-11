import React from 'react';
import { useTranslation } from 'react-i18next';
import { apiPost } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

// --- helpers (same behavior as Register) ---
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

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = React.useState<'request' | 'verify'>('request');
    const [phone, setPhone] = React.useState('');
    const [code, setCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [message, setMessage] = React.useState<string | null>(null);

    async function handleRequest(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const phoneE164 = toE164DE(phone) ?? undefined;
        if (!phoneE164) {
            setError(t('phoneRequired') || 'Phone number is required.');
            return;
        }

        try {
            setBusy(true);
            await apiPost('/verify-phone/start', { phone: phoneE164, lang: 'de' });
            setStep('verify');
            setMessage(t('register.smsCodeSent') || 'Verification code sent via SMS.');
        } catch (e: any) {
            setError(e.message || (t('sendCodeFailed') as string));
        } finally {
            setBusy(false);
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const phoneE164 = toE164DE(phone) ?? undefined;
        if (!phoneE164) {
            setError(t('phoneRequired') || 'Phone number is required.');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setError(t('weakPassword') || 'Password must be at least 6 characters.');
            return;
        }

        try {
            setBusy(true);
            await apiPost('/auth/customer/reset-password', { phone: phoneE164, code, newPassword });
            setMessage(t('passwordResetSuccess') || 'Password updated successfully.');
            setTimeout(() => navigate('/login'), 1200);
        } catch (e: any) {
            setError(e.message || (t('resetFailed') as string));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-semibold mb-1">{t('forgotPassword') || 'Forgot Password'}</h1>
            <p className="text-sm text-gray-600 mb-6">
                {t('forgotPasswordDesc') || 'Enter your phone number to reset your password.'}
            </p>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
            {message && <div className="mb-4 text-sm text-green-600">{message}</div>}

            {step === 'request' ? (
                <form onSubmit={handleRequest} className="space-y-4">
                    {/* Phone input styled like Register.tsx */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('phoneNumber') || 'Phone number'}
                        </label>
                        <div className="flex items-center border rounded px-3 py-2 shadow-sm">
                            <img src="https://flagcdn.com/w40/de.png" alt="Germany" className="w-5 h-4 mr-2" />
                            <span className="mr-2 text-sm text-gray-700">+49</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t('phonePlaceholder') || '157 1234567'}
                                className="flex-1 outline-none"
                                autoComplete="tel"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('register.phoneRequiredSms') || 'We’ll normalize it as +49… for SMS.'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-2.5 rounded font-semibold text-white bg-[#4e9f66] hover:bg-[#3e8455] disabled:opacity-50"
                    >
                        {t('sendVerificationCode') || 'Send Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('enterCode') || 'Enter Code'}
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={t('codePlaceholder') || '123456'}
                            className="w-full border rounded px-3 py-2 shadow-sm"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('newPassword') || 'New Password'}
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border rounded px-3 py-2 shadow-sm"
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-2.5 rounded font-semibold text-white bg-[#4e9f66] hover:bg-[#3e8455] disabled:opacity-50"
                    >
                        {t('resetPassword') || 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;
