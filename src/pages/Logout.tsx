import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Logout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/';

    React.useEffect(() => {
        logout();
        navigate(next, { replace: true });
    }, [logout, navigate, next]);

    return null; // or a tiny spinner if you prefer
};

export default Logout;
