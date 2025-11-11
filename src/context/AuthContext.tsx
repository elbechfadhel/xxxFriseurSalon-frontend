import React from 'react';
import { apiGet, apiPost } from '@/lib/api';

type Customer = { id: string; email: string; name: string; phoneE164?: string | null; phoneVerified?: boolean;  };
type AuthContextType = {
    customer: Customer | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string; phoneE164?: string }) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [token, setToken] = React.useState<string | null>(localStorage.getItem('customer_token'));

    React.useEffect(() => {
        if (token) refreshMe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function refreshMe() {
        try {
            const me = await apiGet('/auth/customer/me');
            setCustomer(me);
        } catch {
            setCustomer(null);
            setToken(null);
            localStorage.removeItem('customer_token');
        }
    }

    async function login(email: string, password: string) {
        const { token, customer } = await apiPost('/auth/customer/login', { email, password });
        localStorage.setItem('customer_token', token);
        setToken(token);
        setCustomer(customer);
    }

    async function register(data: { name: string; email: string; password: string; phoneE164?: string }) {
        const { token, customer } = await apiPost('/auth/customer/register', data);
        localStorage.setItem('customer_token', token);
        setToken(token);
        setCustomer(customer);
    }

    function logout() {
        localStorage.removeItem('customer_token');
        setToken(null);
        setCustomer(null);
    }

    return (
        <AuthContext.Provider value={{ customer, token, login, register, logout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);
