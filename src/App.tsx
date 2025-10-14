import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';

import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';



import PrivacyPolicy from "@/components/PrivacyPolicy.tsx";
import FeedbackPage from "./pages/FeedbackPage.tsx";



const App: React.FC = () => {
    return (
        <Router>
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />



            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />



                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                   {/* <Route
                        path="/admin/services/*"
                        element={<ProtectedRoute><AdminServices /></ProtectedRoute>}
                    />*/}
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;
