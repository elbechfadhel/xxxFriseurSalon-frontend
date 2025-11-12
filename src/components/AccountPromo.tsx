// src/components/AccountPromo.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Clock, Smartphone, UserPlus } from 'lucide-react';

const AccountPromo: React.FC = () => {
    const { customer } = useAuth();
    const { t } = useTranslation();
    const { pathname, search } = useLocation();
    const next = encodeURIComponent(pathname + (search || ''));

    if (customer) return null;

    return (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 md:px-6 md:py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: headline + bullets */}
                <div>
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-emerald-700" />
                        <h3 className="text-lg font-semibold text-emerald-900">
                            {t('accountPromo.title') || 'Create an account for faster booking'}
                        </h3>
                    </div>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-emerald-900/90">
                        <li className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {t('accountPromo.b1') || '1-click repeat bookings'}
                        </li>
                        <li className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> {t('accountPromo.b2') || 'No SMS code needed'}
                        </li>
                        <li className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> {t('accountPromo.b3') || 'View & manage your bookings'}
                        </li>
                    </ul>
                </div>

                {/* Right: CTAs */}
                <div className="flex gap-2">
                    <Link
                        to={`/register?next=${next}`}
                        className="px-4 py-2 rounded-md bg-[#4e9f66] text-white hover:bg-[#3e8455] font-medium"
                    >
                        {t('register.register') || 'Register'}
                    </Link>
                    <Link
                        to={`/login?next=${next}`}
                        className="px-4 py-2 rounded-md border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-medium"
                    >
                        {t('register.login') || 'Login'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccountPromo;
