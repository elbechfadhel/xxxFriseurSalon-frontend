import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-calendar/dist/Calendar.css';
import TimeSlotSelection from '@/components/TimeSlotSelection';
import { useTranslation } from 'react-i18next';
import { de, enUS } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import EmployeeSelector from '@/pages/EmployeeSelector.tsx';
import Turnstile from 'react-turnstile';

import EmployeeService from "@/services/EmployeeService.ts";
import { Absence, fetchAbsences, findAbsence } from "@/services/AbsenceService.ts";



interface Employee {
    id: string;
    name: string;
}

// --- helpers ---
const isValidGermanPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').replace(/^0/, '');
    return /^1[5-7,6,9][0-9]{6,9}$/.test(digits);
};

async function isSlotStillFree(apiBase: string, employeeId: string, slotISO: string) {
    const dayStr = new Date(slotISO).toISOString().slice(0, 10);
    const res = await fetch(`${apiBase}/reservations/availability?date=${dayStr}&employeeId=${employeeId}`);
    if (!res.ok) return false;
    const takenISO: string[] = await res.json();
    return !takenISO.includes(new Date(slotISO).toISOString());
}

const BookingPage: React.FC = () => {
    const { t, i18n } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');

    const [busy, setBusy] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | null>(null);

    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const API_BASE = import.meta.env.VITE_API_URL;
    const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;
    const getLocale = () => (i18n.language?.startsWith('de') ? de : enUS);



    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await EmployeeService.getAll();
                setEmployees(data);
            } catch (err) {
                console.error('Failed to load employees:', err);
            }
        };

        fetchEmployees();
    }, []);

    // Barber absences: shown as a banner, absent days are not selectable
    const [absences, setAbsences] = useState<Absence[]>([]);
    useEffect(() => {
        fetchAbsences()
            .then(setAbsences)
            .catch((err) => console.error('Failed to load absences:', err));
    }, []);

    const selectedAbsence =
        selectedEmployee && selectedDate ? findAbsence(absences, selectedEmployee, selectedDate) : undefined;

    // A slot picked before switching to an absent barber/day must not be booked
    useEffect(() => {
        if (selectedAbsence) setSelectedDateTime(null);
    }, [selectedAbsence]);

    const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? '';
    const fmtAbsenceDay = (ymd: string) =>
        new Intl.DateTimeFormat(i18n.language?.startsWith('ar') ? 'ar' : i18n.language?.startsWith('en') ? 'en-GB' : 'de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
        }).format(new Date(ymd + 'T12:00:00'));
    const absenceText = (a: Absence) => {
        const what = t(`absence.reasons.${a.reason}`, { defaultValue: 'im Urlaub' });
        const name = employeeName(a.employeeId);
        return a.startDate === a.endDate
            ? t('absence.single', { name, what, date: fmtAbsenceDay(a.startDate), defaultValue: '{{name}} ist am {{date}} {{what}}.' })
            : t('absence.range', {
                  name,
                  what,
                  from: fmtAbsenceDay(a.startDate),
                  to: fmtAbsenceDay(a.endDate),
                  defaultValue: '{{name}} ist vom {{from}} bis {{to}} {{what}}.',
              });
    };

    // One line per period; when every barber is away for the same period the salon is closed
    const absenceBanner = (() => {
        const groups = new Map<string, Absence[]>();
        absences.forEach((a) => {
            const key = `${a.startDate}|${a.endDate}`;
            groups.set(key, [...(groups.get(key) ?? []), a]);
        });
        return Array.from(groups.values()).flatMap((group) => {
            const allAway = employees.length > 0 && employees.every((e) => group.some((a) => a.employeeId === e.id));
            if (!allAway) return group.map((a) => ({ key: a.id, text: absenceText(a) }));
            const { startDate, endDate } = group[0];
            const text =
                startDate === endDate
                    ? t('absence.salonClosedSingle', { date: fmtAbsenceDay(startDate), defaultValue: 'Der Salon ist am {{date}} geschlossen.' })
                    : t('absence.salonClosedRange', {
                          from: fmtAbsenceDay(startDate),
                          to: fmtAbsenceDay(endDate),
                          defaultValue: 'Der Salon ist vom {{from}} bis {{to}} geschlossen.',
                      });
            return [{ key: `${startDate}|${endDate}`, text }];
        });
    })();

    // Barbers absent on the selected day, for the label under their photo
    const absentOnSelectedDay: Record<string, string> = {};
    if (selectedDate) {
        employees.forEach((e) => {
            const a = findAbsence(absences, e.id, selectedDate);
            if (a) absentOnSelectedDay[e.id] = t(`absence.labels.${a.reason}`, { defaultValue: 'Urlaub' });
        });
    }





    const clearNotice = () => {
        setNotification(null);
        setNotificationType(null);
    };

    // --------- Guest (captcha, no SMS) ----------
    const handleBookAsGuest = async () => {
        clearNotice();

        if (!selectedDateTime || !selectedEmployee || !customerName.trim()) {
            setNotification((t('bookingInfoMissing') as string) || 'Please complete the booking info first.');
            setNotificationType('error');
            return;
        }

        if (!isValidGermanPhone(phone)) {
            setNotification((t('invalidPhone') as string) || 'Bitte gib eine gültige deutsche Nummer ein.');
            setNotificationType('error');
            return;
        }

        if (!captchaToken) {
            setNotification((t('captchaRequired') as string) || 'Please complete the security check.');
            setNotificationType('error');
            return;
        }

        try {
            setBusy(true);

            // 1) Recheck slot availability
            const free = await isSlotStillFree(API_BASE, selectedEmployee, selectedDateTime);
            if (!free) {
                setNotification((t('booking.slotTaken') as string) || 'This time slot has just been taken. Please pick another.');
                setNotificationType('error');
                setSelectedDateTime(null);
                setResetTrigger((p) => p + 1);
                return;
            }

            // 2) Normalize phone to E.164 (+49…)
            const national = phone.replace(/[^\d]/g, '');
            const fullPhone = `+49${national}`;

            // 3) Create reservation (guest + captcha)
            const bookingRes = await fetch(`${API_BASE}/reservations/reservations-captcha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone: fullPhone,
                    service: 'Haircut',
                    date: selectedDateTime,
                    employeeId: selectedEmployee,
                    captchaToken,
                }),
            });

            if (!bookingRes.ok) {
                const errText = await bookingRes.text();
                console.error('Booking failed:', bookingRes.status, errText);
                if (bookingRes.status === 409 && errText.includes('EMPLOYEE_ABSENT')) {
                    setNotification(
                        t('absence.bookingRefused', {
                            defaultValue: 'Der Barber ist an diesem Tag nicht da. Bitte wähle einen anderen Tag oder Barber.',
                        })
                    );
                    setNotificationType('error');
                    setSelectedDateTime(null);
                    setResetTrigger((p) => p + 1);
                    return;
                }
                throw new Error('Failed to book');
            }

            setNotification((t('bookingConfirmed') as string) || 'Your booking is confirmed!');
            setNotificationType('success');

            // reset form for guest
            setCustomerName('');
            setPhone('');
            setCaptchaToken(null);
            setSelectedDateTime(null);
            setSelectedEmployee(null);
            setSelectedDate(new Date());
            setResetTrigger((p) => p + 1);
        } catch (err) {
            console.error('handleBookAsGuest error:', err);
            setNotification((t('bookingError') as string) || 'Booking failed. Please try again.');
            setNotificationType('error');
        } finally {
            setBusy(false);
        }
    };

    // Cloudflare Turnstile supported examples: 'auto', 'de', 'en', 'ar', ...
    const getTurnstileLang = (lng: string): string => {
        if (!lng) return 'auto';

        const l = lng.toLowerCase();

        if (l.startsWith('de')) return 'de';
        if (l.startsWith('en')) return 'en';
        if (l.startsWith('ar')) return 'ar';

        // fallback to auto (browser language)
        return 'auto';
    };
    const turnstileLang = getTurnstileLang(i18n.language);
    // --------- Validation flags ----------
    const isBookingInfoValidGuest =
        !!selectedDateTime && !!selectedEmployee && !!customerName.trim() && isValidGermanPhone(phone);

    return (
        <div className="px-4 py-8">
            {/* Heading Section */}
            <div className="w-full flex flex-col items-center text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
                    {t('bookAppointmentTitle')}
                </h1>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl">
                    {t('bookAppointmentDesc')}
                </p>
            </div>

            {/* Barber absences */}
            {absenceBanner.length > 0 && (
                <div className="max-w-6xl mx-auto mb-6 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-orange-900">
                    {absenceBanner.map((line) => (
                        <p key={line.key} className="text-sm md:text-base font-medium">
                            {line.text}
                        </p>
                    ))}
                </div>
            )}

            {/* Container */}
            <div className="max-w-6xl bg-white rounded-lg shadow-md flex flex-col md:flex-row gap-6 p-6 mx-auto">
                {/* Left panel - Date Picker */}
                <div className="w-full md:w-[320px] shrink-0 text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('pickDate')}</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => setSelectedDate(date)}
                        locale={getLocale()}
                        dateFormat="P"
                        className="rounded-lg border shadow-md p-2 w-full"
                        inline
                        minDate={new Date()}
                        filterDate={(d: Date) =>
                            d.getDay() !== 0 && !(selectedEmployee && findAbsence(absences, selectedEmployee, d))
                        }
                    />
                </div>

                {/* Right panel */}
                <div className="flex-1">
                    {/* Employee Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('chooseBarber')}</label>
                        <div className="flex gap-4 flex-nowrap overflow-x-auto">
                            <EmployeeSelector
                                employees={employees}
                                selectedEmployee={selectedEmployee}
                                absentLabels={absentOnSelectedDay}
                                onChange={(id) => {
                                    setSelectedEmployee(id);
                                    setResetTrigger((prev) => prev + 1);
                                }}
                            />
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedEmployee && (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('pickTime')}
                            </label>
                            {selectedAbsence ? (
                                <div className="rounded border border-orange-300 bg-orange-50 px-4 py-6 text-center text-orange-900">
                                    <p className="font-medium">{absenceText(selectedAbsence)}</p>
                                    <p className="text-sm mt-1">
                                        {t('absence.pickOther', {
                                            defaultValue: 'Bitte wähle einen anderen Tag oder einen anderen Barber.',
                                        })}
                                    </p>
                                </div>
                            ) : (
                                <TimeSlotSelection
                                    selectedDate={selectedDate || new Date()}
                                    selectedEmployeeId={selectedEmployee}
                                    onSlotSelected={setSelectedDateTime}
                                    resetTrigger={resetTrigger}
                                />
                            )}
                        </>
                    )}

                    {/* Customer Info */}
                    <div className="mt-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder={t('fullNamePlaceholder') as string}
                                className={`w-full border rounded px-3 py-2 shadow-sm ${
                                    !customerName.trim() ? 'border-red-500' : ''
                                }`}
                            />
                            {!customerName.trim() && (
                                <p className="text-red-500 text-sm mt-1">{t('nameRequired')}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('phoneNumber')}
                            </label>
                            <div className="flex items-center border rounded px-3 py-2 shadow-sm">
                                <img src="https://flagcdn.com/w40/de.png" alt="Germany" className="w-5 h-4 mr-2" />
                                <span className="mr-2 text-sm text-gray-700">+49</span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t('phonePlaceholder') as string}
                                    className="flex-1 outline-none"
                                />
                            </div>
                            {!isValidGermanPhone(phone) && phone && (
                                <p className="text-sm text-red-500 mt-1">{t('invalidPhone')}</p>
                            )}
                        </div>
                    </div>

                    {/* Notifications */}
                    {notification && (
                        <div
                            className={`mb-6 p-2 font-bold border ${
                                notificationType === 'success'
                                    ? 'border-green-500 text-green-500'
                                    : notificationType === 'error'
                                        ? 'border-red-500 text-red-500'
                                        : 'border-blue-500 text-blue-500'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="ml-2 text-sm">{notification}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 mb-2">
                        <div className="space-y-4">
                            <Turnstile
                                sitekey={TURNSTILE_SITE_KEY}
                                key={turnstileLang}
                                onVerify={(token) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(null)}
                                onError={() => setCaptchaToken(null)}
                                language={turnstileLang}
                            />
                            <button
                                onClick={handleBookAsGuest}
                                disabled={!isBookingInfoValidGuest || busy || !captchaToken}
                                className={`w-full py-3 rounded-lg text-lg font-semibold ${
                                    !isBookingInfoValidGuest || busy || !captchaToken
                                        ? 'bg-gray-200 text-gray-500 border border-gray-300 shadow-inner cursor-not-allowed'
                                        : 'bg-[#4e9f66] hover:bg-[#3e8455] text-white'
                                }`}
                            >
                                {busy
                                    ? ((t('booking.sending') as string) || 'Booking…')
                                    : ((t('confirmBooking') as string) || 'Confirm booking')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
