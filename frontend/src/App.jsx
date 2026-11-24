import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ChotuChatbot from './components/ChotuChatbot';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import StudioDashboard from './pages/StudioDashboard';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-slate-900">
          <Navbar />
          <CartDrawer />
          <ChotuChatbot />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/studio" element={<StudioDashboard />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
            BazaarOne General Store • Spring Boot Modular Monolith Microservices + Kafka + Razorpay
          </footer>
        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}
