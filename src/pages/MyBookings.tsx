import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api'; // we’ll use fetch+DELETE through apiPost little trick or just fetch
import { format } from 'date-fns';
import { de, enUS, arSA } from 'date-fns/locale';
import { Link } from 'react-router-dom';

type EmployeeLite = { name: string };
type Reservation = {
    id: string;
    service: string;
    date: string; // ISO
    employeeId: string;
    employee?: EmployeeLite | null;
};

const MyBookings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { customer } = useAuth();


    const [items, setItems] = React.useState<Reservation[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [busyId, setBusyId] = React.useState<string | null>(null);

    const dateLocale = i18n.language.startsWith('de')
        ? de
        : i18n.language.startsWith('ar')
            ? arSA
            : enUS;

    React.useEffect(() => {
        if (!customer) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                const data = await apiGet('/auth/customer/my-reservations');
                setItems(data);
            } catch (e: any) {
                setError(e.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, [customer]);

    function splitUpcomingPast(all: Reservation[]) {
        const now = new Date();
        const upcoming: Reservation[] = [];
        const past: Reservation[] = [];
        for (const r of all) {
            const d = new Date(r.date);
            if (d >= now) upcoming.push(r);
            else past.push(r);
        }
        // Sort upcoming asc, past desc
        upcoming.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        past.sort((a, b) => +new Date(b.date) - +new Date(a.date));
        return { upcoming, past };
    }

    async function cancel(id: string) {
        if (!confirm(t('confirmCancel') || 'Cancel this booking?')) return;
        try {
            setBusyId(id);
            // Use fetch directly because apiPost is POST; here we need DELETE
            const API = import.meta.env.VITE_API_URL;
            const token = localStorage.getItem('customer_token');
            const res = await fetch(`${API}/auth/customer/my-reservations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e: any) {
            alert(e.message || (t('cancelFailed') as string));
        } finally {
            setBusyId(null);
        }
    }

    if (!customer) {
        return (
            <div className="max-w-3xl mx-auto mt-8 bg-white rounded-lg shadow p-6 text-center">
                <h1 className="text-2xl font-semibold mb-2">{t('myBookings') || 'My bookings'}</h1>
                <p className="text-gray-600 mb-4">{t('loginToSeeBookings') || 'Please login to see your bookings.'}</p>
                <div className="flex justify-center gap-3">
                    <Link to="/login?next=%2Fmy-bookings" className="px-4 py-2 rounded bg-[#4e9f66] text-white hover:bg-[#3e8455]">
                        {t('login') || 'Login'}
                    </Link>
                    <Link to="/register?next=%2Fmy-bookings" className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">
                        {t('register') || 'Register'}
                    </Link>
                </div>
            </div>
        );
    }

    const { upcoming, past } = splitUpcomingPast(items);

    return (
        <div className="max-w-3xl mx-auto mt-8 bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-semibold mb-4">{t('myBookings') || 'My bookings'}</h1>

            {loading && <p className="text-gray-600">{t('loading') || 'Loading…'}</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <>
                    {/* Upcoming */}
                    <h2 className="text-lg font-semibold mt-2 mb-2">{t('upcoming') || 'Upcoming'}</h2>
                    {upcoming.length === 0 ? (
                        <p className="text-gray-600 mb-4">{t('noUpcoming') || 'No upcoming bookings.'}</p>
                    ) : (
                        <ul className="space-y-3 mb-6">
                            {upcoming.map((r) => {
                                const d = new Date(r.date);
                                const dateStr = format(d, 'PPPP p', { locale: dateLocale }); // e.g. “Tuesday, Nov 11, 2025 15:00”
                                return (
                                    <li key={r.id} className="border rounded p-3 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <div className="font-medium">{r.service || t('service') || 'Service'}</div>
                                            <div className="text-sm text-gray-600 truncate">
                                                {dateStr} · {t('with') || 'with'} {r.employee?.name || '—'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => cancel(r.id)}
                                            disabled={busyId === r.id}
                                            className="text-sm px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            {t('cancel') || 'Cancel'}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Past */}
                    <h2 className="text-lg font-semibold mt-2 mb-2">{t('past') || 'Past'}</h2>
                    {past.length === 0 ? (
                        <p className="text-gray-600">{t('noPast') || 'No past bookings.'}</p>
                    ) : (
                        <ul className="space-y-3">
                            {past.map((r) => {
                                const d = new Date(r.date);
                                const dateStr = format(d, 'PPPP p', { locale: dateLocale });
                                return (
                                    <li key={r.id} className="border rounded p-3">
                                        <div className="font-medium">{r.service || t('service') || 'Service'}</div>
                                        <div className="text-sm text-gray-600">
                                            {dateStr} · {t('with') || 'with'} {r.employee?.name || '—'}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default MyBookings;
