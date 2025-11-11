const API = import.meta.env.VITE_API_URL;

function authHeader(): Record<string, string> {
    const token = localStorage.getItem('customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
    const ct = res.headers.get('content-type') || '';
    if (res.ok) {
        return ct.includes('application/json') ? res.json() : res.text();
    }

    // Extract a human-friendly error message
    let message = 'Request failed';
    try {
        if (ct.includes('application/json')) {
            const data = await res.json();
            message = data.error || data.message || message;
        } else {
            const txt = await res.text();
            try {
                const data = JSON.parse(txt);
                message = data.error || data.message || txt;
            } catch {
                message = txt;
            }
        }
    } catch {
        // keep default message
    }
    throw new Error(message);
}

export async function apiGet(path: string) {
    const res = await fetch(`${API}${path}`, { headers: { ...authHeader() } });
    return handleResponse(res);
}

export async function apiPost(path: string, body?: any) {
    const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
}

export async function apiPatch(path: string, body?: any) {
    const res = await fetch(`${API}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}
