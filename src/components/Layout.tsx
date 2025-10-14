import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { pathname } = useLocation();





    const navLinkClass = (path: string) =>
        `text-white  ${
            pathname === path ? 'font-bold underline' : ''
        }`;

    // Close dropdown when clicking outside


    return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900">
            {/* Header Navigation */}
            <header className="bg-[#636A6D] shadow-sm border-b border-gray-100">
                <div className="mx-auto px-4 py-2 flex items-center justify-between">
                    {/* Left: Logo */}
                   {/* <div className="flex items-center space-x-4">
                        <img
                            src="/images/logo-xxx.png"
                            alt="XXX Friseursalon Logo"
                            className="w-[70px] h-[70px] object-contain"
                        />
                    </div>*/}

                    {/* Center: Navigation */}
                    <nav className="flex space-x-4 rtl:space-x-reverse text-sm md:text-base relative">
                        <Link to="/" className={navLinkClass('/')}>
                            {t('home')}
                        </Link>
                      {/*  <Link to="/services" className={navLinkClass('/services')}>
                            {t('services.menu')}
                        </Link>*/}
                        <Link to="/booking" className={navLinkClass('/booking')}>
                            {t('booking')}
                        </Link>
                        <Link to="/feedback" className={navLinkClass('/feedback')}>
                            {t('adminFeedbacks.title')}
                        </Link>

                    </nav>

                    {/* Right: Language Switcher */}
                    <div className="flex items-center space-x-4">
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
