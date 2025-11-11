import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { apiPost, apiPatch } from '@/lib/api';

// Same phone normalizer you use elsewhere
function toE164DE(input: string): string | null {
    if (!input?.trim()) return null;
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('49')) return `+${digits}`;
    if (digits.startsWith('0')) return `+49${digits.slice(1)}`;
    if (digits.startsWith('1') || digits.startsWith('15') || digits.startsWith('16') || digits.startsWith('17')) {
        return `+49${digits}`;
    }
    if (input.trim().startsWith('+')) return input.trim();
    return `+49${digits}`;
}

const Profile: React.FC = () => {
    const { t } = useTranslation();
    const { customer, refreshMe } = useAuth();

    // ---- hooks must be at top level (no conditional calls) ----
    const [name, setName] = React.useState(customer?.name ?? '');
    const [saving, setSaving] = React.useState(false);
    const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
    const [errMsg, setErrMsg] = React.useState<string | null>(null);

    const [editingPhone, setEditingPhone] = React.useState(false);
    const [newPhone, setNewPhone] = React.useState('');
    const [otpStep, setOtpStep] = React.useState<'idle' | 'code'>('idle');
    const [code, setCode] = React.useState('');
    const [phoneBusy, setPhoneBusy] = React.useState(false);
    const [phoneMsg, setPhoneMsg] = React.useState<string | null>(null);
    const [phoneErr, setPhoneErr] = React.useState<string | null>(null);

    const [curPwd, setCurPwd] = React.useState('');
    const [newPwd, setNewPwd] = React.useState('');
    const [newPwd2, setNewPwd2] = React.useState('');
    const [pwdBusy, setPwdBusy] = React.useState(false);
    const [pwdMsg, setPwdMsg] = React.useState<string | null>(null);
    const [pwdErr, setPwdErr] = React.useState<string | null>(null);

    // Keep local name in sync if customer changes (e.g., after refreshMe)
    React.useEffect(() => {
        setName(customer?.name ?? '');
    }, [customer?.name]);

    // ---- actions ----
    async function saveProfile(e: React.FormEvent) {
        e.preventDefault();
        setInfoMsg(null);
        setErrMsg(null);
        if (!name.trim()) {
            setErrMsg(t('nameRequired') || 'Name is required.');
            return;
        }
        try {
            setSaving(true);
            await apiPatch('/auth/customer/me', { name: name.trim() });
            await refreshMe();
            setInfoMsg(t('profileSaved') || 'Profile saved.');
        } catch (e: any) {
            setErrMsg(e?.message || (t('profileSaveFailed') as string));
        } finally {
            setSaving(false);
        }
    }

    async function startPhoneUpdate(e: React.FormEvent) {
        e.preventDefault();
        setPhoneErr(null);
        setPhoneMsg(null);
        const phoneE164 = toE164DE(newPhone) ?? undefined;
        if (!phoneE164) {
            setPhoneErr(t('phoneRequired') || 'Phone number is required.');
            return;
        }
        try {
            setPhoneBusy(true);
            await apiPost('/verify-phone/start', { phone: phoneE164, lang: 'de' });
            setOtpStep('code');
            setPhoneMsg(t('smsCodeSent') || 'Verification code sent via SMS.');
        } catch (e: any) {
            setPhoneErr(e?.message || (t('sendCodeFailed') as string));
        } finally {
            setPhoneBusy(false);
        }
    }

    async function confirmPhoneUpdate(e: React.FormEvent) {
        e.preventDefault();
        setPhoneErr(null);
        setPhoneMsg(null);
        const phoneE164 = toE164DE(newPhone) ?? undefined;
        if (!phoneE164) {
            setPhoneErr(t('phoneRequired') || 'Phone number is required.');
            return;
        }
        if (!code.trim()) {
            setPhoneErr(t('enterCode') || 'Please enter the code.');
            return;
        }
        try {
            setPhoneBusy(true);
            const r = await apiPost('/verify-phone/check', {
                phone: phoneE164,
                code: code.trim(),
                lang: 'de',
                purpose: 'phone_update',
            });
            const otpToken: string | undefined = r?.otpToken;
            if (!otpToken) throw new Error(t('verificationFailed') || 'Verification failed.');

            await apiPatch('/auth/customer/me', { phoneE164, otpToken });
            await refreshMe();

            setPhoneMsg(t('phoneUpdated') || 'Phone updated.');
            setEditingPhone(false);
            setOtpStep('idle');
            setNewPhone('');
            setCode('');
        } catch (e: any) {
            setPhoneErr(e?.message || (t('verificationFailed') as string));
        } finally {
            setPhoneBusy(false);
        }
    }

    async function changePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwdMsg(null);
        setPwdErr(null);

        if (!curPwd.trim()) {
            setPwdErr(t('currentPasswordRequired') || 'Current password is required.');
            return;
        }
        if (!newPwd || newPwd.length < 6) {
            setPwdErr(t('weakPassword') || 'Password must be at least 6 characters.');
            return;
        }
        if (newPwd !== newPwd2) {
            setPwdErr(t('passwordsDoNotMatch') || 'Passwords do not match.');
            return;
        }

        try {
            setPwdBusy(true);
            await apiPost('/auth/customer/change-password', {
                currentPassword: curPwd,
                newPassword: newPwd,
            });
            setPwdMsg(t('passwordChanged') || 'Password changed successfully.');
            setCurPwd('');
            setNewPwd('');
            setNewPwd2('');
        } catch (e: any) {
            setPwdErr(e?.message || (t('changePasswordFailed') as string));
        } finally {
            setPwdBusy(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow p-6 space-y-8">
            {/* Header */}
            <h1 className="text-2xl font-semibold">{t('profile') || 'Profile'}</h1>

            {/* Not logged in */}
            {!customer ? (
                <div>
                    <p className="text-gray-600">{t('loginToSeeProfile') || 'Please login to view your profile.'}</p>
                </div>
            ) : (
                <>
                    {/* Basic Info */}
                    <section>
                        <h2 className="text-lg font-medium mb-3">{t('profileInfo') || 'Profile information'}</h2>

                        {infoMsg && <div className="mb-3 text-green-600 text-sm">{infoMsg}</div>}
                        {errMsg && <div className="mb-3 text-red-600 text-sm">{errMsg}</div>}

                        <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('fullName') || 'Full name'}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border rounded px-3 py-2 shadow-sm"
                                    autoComplete="name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('email') || 'Email'}
                                </label>
                                <input
                                    type="email"
                                    value={customer.email}
                                    readOnly
                                    className="w-full border rounded px-3 py-2 shadow-sm bg-gray-50"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('phoneNumber') || 'Phone number'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={customer.phoneE164 || ''}
                                        readOnly
                                        className="w-full border rounded px-3 py-2 shadow-sm bg-gray-50"
                                    />
                                    {customer.phoneVerified ? (
                                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      {t('verified') || 'Verified'}
                    </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      {t('notVerified') || 'Not verified'}
                    </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingPhone((v) => !v);
                                            setOtpStep('idle');
                                            setPhoneErr(null);
                                            setPhoneMsg(null);
                                        }}
                                        className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                                    >
                                        {t('change') || 'Change'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`px-4 py-2 rounded font-semibold text-white ${
                                        saving ? 'bg-gray-300' : 'bg-[#4e9f66] hover:bg-[#3e8455]'
                                    }`}
                                >
                                    {saving ? (t('saving') || 'Saving…') : (t('save') || 'Save')}
                                </button>
                            </div>
                        </form>

                        {/* Phone Update */}
                        {editingPhone && (
                            <div className="mt-5 border-t pt-5">
                                <h3 className="text-base font-medium mb-2">{t('updatePhone') || 'Update phone number'}</h3>

                                {phoneErr && <div className="mb-2 text-sm text-red-600">{phoneErr}</div>}
                                {phoneMsg && <div className="mb-2 text-sm text-green-600">{phoneMsg}</div>}

                                {otpStep === 'idle' ? (
                                    <form onSubmit={startPhoneUpdate} className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('phoneNumber') || 'Phone number'}
                                        </label>
                                        <div className="flex items-center border rounded px-3 py-2 shadow-sm max-w-md">
                                            <img src="https://flagcdn.com/w40/de.png" alt="Germany" className="w-5 h-4 mr-2" />
                                            <span className="mr-2 text-sm text-gray-700">+49</span>
                                            <input
                                                type="tel"
                                                value={newPhone}
                                                onChange={(e) => setNewPhone(e.target.value)}
                                                placeholder={t('phonePlaceholder') || '157 1234567'}
                                                className="flex-1 outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={phoneBusy}
                                            className={`px-4 py-2 rounded font-semibold text-white ${
                                                phoneBusy ? 'bg-gray-300' : 'bg-[#4e9f66] hover:bg-[#3e8455]'
                                            }`}
                                        >
                                            {t('sendVerificationCode') || 'Send Code'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={confirmPhoneUpdate} className="space-y-3 max-w-md">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {t('enterCode') || 'Enter code'}
                                        </label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder={t('codePlaceholder') || '123456'}
                                            className="w-full border rounded px-3 py-2 shadow-sm"
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="submit"
                                                disabled={phoneBusy || !code.trim()}
                                                className="px-4 py-2 rounded font-semibold text-white bg-[#4e9f66] hover:bg-[#3e8455] disabled:opacity-50"
                                            >
                                                {t('verifyAndSave') || 'Verify & Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpStep('idle');
                                                    setCode('');
                                                    setPhoneErr(null);
                                                    setPhoneMsg(null);
                                                }}
                                                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                                            >
                                                {t('back') || 'Back'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Change Password */}
                    <section>
                        <h2 className="text-lg font-medium mb-3">{t('changePassword') || 'Change password'}</h2>

                        {pwdErr && <div className="mb-2 text-sm text-red-600">{pwdErr}</div>}
                        {pwdMsg && <div className="mb-2 text-sm text-green-600">{pwdMsg}</div>}

                        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('currentPassword') || 'Current password'}
                                </label>
                                <input
                                    type="password"
                                    value={curPwd}
                                    onChange={(e) => setCurPwd(e.target.value)}
                                    className="w-full border rounded px-3 py-2 shadow-sm"
                                    autoComplete="current-password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('newPassword') || 'New password'}
                                </label>
                                <input
                                    type="password"
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    className="w-full border rounded px-3 py-2 shadow-sm"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('confirmPassword') || 'Confirm password'}
                                </label>
                                <input
                                    type="password"
                                    value={newPwd2}
                                    onChange={(e) => setNewPwd2(e.target.value)}
                                    className="w-full border rounded px-3 py-2 shadow-sm"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={pwdBusy}
                                    className={`px-4 py-2 rounded font-semibold text-white ${
                                        pwdBusy ? 'bg-gray-300' : 'bg-[#4e9f66] hover:bg-[#3e8455]'
                                    }`}
                                >
                                    {pwdBusy ? (t('saving') || 'Saving…') : (t('save') || 'Save')}
                                </button>
                            </div>
                        </form>
                    </section>
                </>
            )}
        </div>
    );
};

export default Profile;
