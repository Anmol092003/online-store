import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, ShieldCheck, PackageCheck, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Navbar() {
  const { user, logoutUser, cartCount, setIsCartOpen } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const canManageCatalog = user && (user.role === 'ADMIN' || user.role === 'SUB_ADMIN');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-slate-900">
            <span className="w-8 h-8 rounded-xl bg-[#1E6B52] text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </span>
            <span>
              Bazaar<span className="text-[#1E6B52]">One</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-[#1E6B52] transition-colors">All Aisles</Link>
            {user && (
              <Link to="/orders" className="hover:text-[#1E6B52] transition-colors flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4" /> My Orders
              </Link>
            )}
            {canManageCatalog && (
              <Link
                to="/studio"
                className="text-[#1E6B52] hover:text-[#16523F] font-semibold flex items-center gap-1.5 bg-[#1E6B52]/10 px-3.5 py-1.5 rounded-full"
              >
                <ShieldCheck className="w-4 h-4" />
                {user.role === 'ADMIN' ? 'Admin Control Center' : 'Catalog Manager'}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-500">{user.role}</span>
              </div>
              {canManageCatalog && (
                <Link
                  to="/studio"
                  className="md:hidden p-2 rounded-full bg-[#1E6B52]/10 text-[#1E6B52]"
                  title="Dashboard"
                >
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E6B52] text-white text-sm font-semibold hover:bg-[#16523F] transition shadow-xs"
            aria-label={cartCount > 0 ? `Open basket with ${cartCount} items` : 'Open basket'}
          >
            <span className="relative inline-flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full border-2 border-[#1E6B52] shadow-xs leading-none">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">Basket</span>
          </button>
        </div>
      </div>
    </header>
  );
}
