import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // ⬅️ add useNavigate
import Footer from './Footer';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext'; // ⬅️ add

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { customer, logout } = useAuth(); // ⬅️ from AuthContext



    const navLinkClass = (path: string) =>
        `text-white ${pathname === path ? 'font-bold underline' : ''}`;

    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">
            {/* Header Navigation */}
            <header className="bg-[#636A6D] shadow-sm border-b border-gray-100">
                <div className="mx-auto px-4 py-2 flex items-center justify-between">
                    {/* Center: Navigation */}
                    <nav className="flex space-x-4 rtl:space-x-reverse text-sm md:text-base relative">
                        <Link to="/" className={navLinkClass('/')}>
                            {t('home')}
                        </Link>
                        <Link to="/booking" className={navLinkClass('/booking')}>
                            {t('booking')}
                        </Link>
                        <Link to="/feedback" className={navLinkClass('/feedback')}>
                            {t('adminFeedbacks.title')}
                        </Link>
                    </nav>

                    {/* Right: Account + Language */}
                    <div className="flex items-center space-x-3">
                        {!customer ? (
                            <>


                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                {/* Tiny avatar/initial */}
                                <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs">
                                    {customer.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:block text-white text-sm">
                  {t('hi') || 'Hi'}, {customer.name.split(' ')[0]}
                </span>

                                <Link
                                    to="/my-bookings"
                                    className="text-white/90 hover:text-white text-sm"
                                >
                                    {t('myBookings') || 'My bookings'}
                                </Link>
                                <Link
                                    to="/me"
                                    className="text-white/90 hover:text-white text-sm"
                                >
                                    {t('profile') || 'Profile'}
                                </Link>
                                <button
                                    onClick={() => { logout(); navigate('/logout'); }}
                                    className="text-white/90 hover:text-white text-sm px-2 py-1 rounded border border-white/20 hover:bg-white/10"
                                >
                                    {t('logout') || 'Logout'}
                                </button>
                            </div>
                        )}

                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow px-4 md:px-6 py-4">{children}</main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Layout;
