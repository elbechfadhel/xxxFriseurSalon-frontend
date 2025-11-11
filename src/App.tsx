import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';

import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';



import PrivacyPolicy from "@/components/PrivacyPolicy.tsx";
import FeedbackPage from "./pages/FeedbackPage.tsx";
import {AuthProvider} from "@/context/AuthContext.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import Logout from "./pages/Logout.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import MyBookings from "./pages/MyBookings.tsx";
import Profile from "./pages/Profile.tsx";



const App: React.FC = () => {
    return (
        <Router>
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
            <AuthProvider>


            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/me" element={<Profile />} />
                   {/* <Route
                        path="/admin/services/*"
                        element={<ProtectedRoute><AdminServices /></ProtectedRoute>}
                    />*/}
                </Routes>
            </Layout>
            </AuthProvider>
        </Router>
    );
};

export default App;
