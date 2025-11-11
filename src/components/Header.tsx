// src/components/Header.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { customer, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const next = encodeURIComponent(pathname || '/');

    return (
        <header className="w-full border-b bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/images/logo-xxx.png" className="h-8" alt="Logo" />
                    <span className="font-semibold">XXX Friseursalon</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <Link to="/booking" className="text-sm font-medium hover:text-[#3e8455]">Booking</Link>

                    {!customer ? (
                        <>
                            <Link
                                to={`/login?next=${next}`}
                                className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
                            >
                                Login
                            </Link>
                            <Link
                                to={`/register?next=${next}`}
                                className="text-sm px-3 py-1.5 rounded bg-[#4e9f66] text-white hover:bg-[#3e8455]">
                                Register
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Hi, {customer.name.split(' ')[0]}</span>
                            <button
                                onClick={() => { logout(); navigate('/'); }}
                                className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
                            >
                                Logout
                            </button>
                            <Link to="/me" className="text-sm hover:text-[#3e8455]">Profile</Link>
                            <Link to="/my-bookings" className="text-sm hover:text-[#3e8455]">My bookings</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
