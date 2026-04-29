import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Home, BarChart3, MessageCircle, Pill, MapPin,
  ChevronDown, LogOut, User, Clock, Activity
} from 'lucide-react';

const NAV = [
  { to: '/',            label: 'Home',        icon: Home,          exact: true },
  { to: '/timeline',    label: 'Timeline',    icon: BarChart3                  },
  { to: '/assistant',   label: 'Ask',         icon: MessageCircle              },
  { to: '/medications', label: 'Medications', icon: Pill                       },
  { to: '/emergency',   label: 'Emergency',   icon: MapPin                     },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [drop, setDrop]   = useState(false);
  const dropRef           = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setDrop(false); }, [location.pathname]);

  const handleSignOut = async () => {
    try { await signOut(); toast.success('Signed out'); navigate('/'); }
    catch { toast.error('Sign out failed'); }
    setDrop(false);
  };

  const initial = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2">
              <img
                src="/assets/logos/parcimic-logo.png"
                alt="Parcimic"
                className="h-7 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-bold text-gray-900 text-base">Parcimic</span>
            </NavLink>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={dropRef}>
                  <button onClick={() => setDrop(!drop)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
                      : <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{initial}</div>
                    }
                    <ChevronDown size={12} className={`text-gray-400 transition-transform duration-150 ${drop ? 'rotate-180' : ''}`} />
                  </button>

                  {drop && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      {[
                        { to: '/profile',  icon: User,     label: 'Profile' },
                        { to: '/history',  icon: Clock,    label: 'History' },
                        { to: '/check',    icon: Activity, label: 'New Check' },
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
                <NavLink to="/profile" className="btn btn-secondary text-sm px-3 py-1.5">
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop Top Navbar ── */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 shrink-0">
              <img
                src="/assets/logos/parcimic-logo.png"
                alt="Parcimic"
                className="h-8 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-bold text-gray-900 text-lg">Parcimic</span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon, exact }) => (
                <NavLink key={to} to={to} end={exact}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
                  <Icon size={16} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/check')}
                className="btn-primary btn">
                Start Check
              </button>

              {user ? (
                <div className="relative" ref={dropRef}>
                  <button onClick={() => setDrop(!drop)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                      : <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{initial}</div>
                    }
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${drop ? 'rotate-180' : ''}`} />
                  </button>

                  {drop && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      {[
                        { to: '/profile',  icon: User,     label: 'Profile' },
                        { to: '/history',  icon: Clock,    label: 'History' },
                        { to: '/check',    icon: Activity, label: 'New Check' },
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
                <NavLink to="/profile" className="btn btn-secondary">
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className={`flex-1 w-full ${
        location.pathname === '/assistant'
          ? 'p-0 overflow-hidden'
          : 'pb-20 lg:pb-8'
      }`}>
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ONLY ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors touch-manipulation ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Dropdown overlay */}
      {drop && (
        <div className="fixed inset-0 z-40" onClick={() => setDrop(false)} />
      )}
    </div>
  );
}
