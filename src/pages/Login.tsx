import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const Login: React.FC = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/booking';

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!isEmail(email)) {
            setError(t('login.invalidEmail') || 'Please enter a valid email address.');
            return;
        }
        if (!password.trim()) {
            setError(t('login.passwordRequired') || 'Password is required.');
            return;
        }

        try {
            setBusy(true);
            await login(email.trim(), password);
            navigate(next, { replace: true });
        } catch (e: any) {
            const msg =
                typeof e?.message === 'string'
                    ? e.message
                    : t('login.loginFailed') || 'Login failed.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-semibold mb-1">{t('login.login') || 'Login'}</h1>
            <p className="text-sm text-gray-600 mb-6">
                {t('login.loginSubtitle') || 'Sign in to book in one click.'}
            </p>

            {error && (
                <div className="mb-4 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
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

                {/* Password */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('register.password') || 'Password'}
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border rounded px-3 py-2 shadow-sm pr-10"
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-8 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={busy}
                    className={`w-full py-2.5 rounded font-semibold text-white ${
                        busy ? 'bg-gray-300' : 'bg-[#4e9f66] hover:bg-[#3e8455]'
                    } transition`}
                >
                    {busy ? (t('login.loggingIn') || 'Logging in…') : (t('login.login') || 'Login')}
                </button>
                <div className="text-sm text-gray-600 mt-3">
                    <Link to="/forgot-password" className="text-[#3e8455] underline">
                        {t('forgotPassword') || 'Forgot password?'}
                    </Link>
                </div>
            </form>

            <div className="text-sm text-gray-600 mt-4">
                {t('login.noAccount') || "Don't have an account?"}{' '}
                <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-[#3e8455] underline">
                    {t('register.register') || 'Register'}
                </Link>
            </div>
        </div>
    );
};

export default Login;
