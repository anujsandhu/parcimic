import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Activity, Map, MessageCircle, Clock, User,
  Menu, X, ChevronDown, LogOut, Shield, Pill
} from 'lucide-react';

const NAV = [
  { to: '/',            label: 'Home',        icon: Activity,      exact: true },
  { to: '/assistant',   label: 'Ask AI',      icon: MessageCircle             },
  { to: '/medications', label: 'Medications', icon: Pill                      },
  { to: '/emergency',   label: 'Emergency',   icon: Map                       },
  { to: '/history',     label: 'History',     icon: Clock                     },
];

export default function Layout() {
  const { user, signOut }   = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [mob, setMob]       = useState(false);
  const [drop, setDrop]     = useState(false);
  const dropRef             = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMob(false); }, [location.pathname]);

  const handleSignOut = async () => {
    try { await signOut(); toast.success('Signed out'); navigate('/'); }
    catch { toast.error('Sign out failed'); }
    setDrop(false);
  };

  const initial = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-container mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">Parcimic</span>
            </NavLink>

            {/* Desktop nav — centered */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon, exact }) => (
                <NavLink key={to} to={to} end={exact}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
                  <Icon size={16} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/check')}
                className="btn-primary btn btn-sm hidden sm:inline-flex">
                Start Check
              </button>

              {user ? (
                <div className="relative" ref={dropRef}>
                  <button onClick={() => setDrop(!drop)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                      : <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{initial}</div>
                    }
                    <ChevronDown size={13} className={`text-gray-400 transition-transform duration-150 ${drop ? 'rotate-180' : ''}`} />
                  </button>

                  {drop && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      {[
                        { to: '/profile',  icon: User,  label: 'Profile' },
                        { to: '/history',  icon: Clock, label: 'My History' },
                        { to: '/medications', icon: Pill, label: 'Medications' },
                      ].map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} onClick={() => setDrop(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon size={15} className="text-gray-400" strokeWidth={1.75} /> {label}
                        </NavLink>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                          <LogOut size={15} strokeWidth={1.75} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/profile" className="btn btn-secondary btn-sm hidden sm:inline-flex">
                  <User size={15} strokeWidth={1.75} /> Sign In
                </NavLink>
              )}

              <button onClick={() => setMob(!mob)}
                className="md:hidden btn-ghost p-2 rounded-lg">
                {mob ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-100 bg-white px-4 overflow-hidden transition-all duration-200"
          style={{ maxHeight: mob ? '420px' : '0', paddingTop: mob ? '12px' : '0', paddingBottom: mob ? '12px' : '0' }}>
          <div className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink key={to} to={to} end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }>
                <Icon size={17} strokeWidth={1.75} /> {label}
              </NavLink>
            ))}
            <div className="pt-2">
              <button onClick={() => navigate('/check')} className="btn-primary btn w-full">
                Start Check
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-container mx-auto w-full px-6 py-8 pb-24 md:pb-10">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`
            }>
            <Icon size={20} strokeWidth={1.75} />
            {label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>

      {/* Overlay */}
      <div className="fixed inset-0 z-40"
        style={{ display: mob || drop ? 'block' : 'none' }}
        onClick={() => { setMob(false); setDrop(false); }} />
    </div>
  );
}
