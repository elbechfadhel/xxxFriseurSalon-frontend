// Barber absences (whole days, salon-local dates "YYYY-MM-DD", both inclusive)
export interface Absence {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    reason: string; // "urlaub" | "krankheit" | "feiertag"
}

const API_BASE = import.meta.env.VITE_API_URL;

// Current and upcoming absences
export async function fetchAbsences(): Promise<Absence[]> {
    const res = await fetch(`${API_BASE}/absences`);
    if (!res.ok) throw new Error(`absences ${res.status}`);
    return res.json();
}

// Local calendar day of a Date as "YYYY-MM-DD"
export const toLocalYmd = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function findAbsence(absences: Absence[], employeeId: string, date: Date): Absence | undefined {
    const day = toLocalYmd(date);
    return absences.find((a) => a.employeeId === employeeId && a.startDate <= day && day <= a.endDate);
}
