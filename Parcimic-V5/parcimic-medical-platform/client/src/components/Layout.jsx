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
    <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden flex-none z-[60] bg-white border-b border-gray-200 shadow-sm relative">
        <div className="px-3 sm:px-4">
          <div className="flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center gap-2.5">
              <img
                src="/assets/logos/parcimic-logo.png"
                alt="Parcimic AI"
                className="h-8 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="flex flex-col -space-y-0.5">
                <span className="font-bold text-gray-900 text-base leading-tight">Parcimic</span>
                <span className="text-[10px] font-semibold text-brand-600 leading-tight">AI Health Assistant</span>
              </div>
            </NavLink>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={dropRef} style={{ zIndex: 9999 }}>
                  <button onClick={() => setDrop(!drop)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation min-h-10 relative"
                    style={{ zIndex: 9999 }}>
                    {user.photoURL
                      ? <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      : null
                    }
                    <div className={`w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-200 ${user.photoURL ? 'hidden' : ''}`}>
                      {initial}
                    </div>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform duration-150 ${drop ? 'rotate-180' : ''}`} />
                  </button>

                  {drop && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 animate-fade-in"
                      style={{ zIndex: 10000, position: 'absolute' }}>
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
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                          style={{ position: 'relative', zIndex: 10001 }}>
                          <Icon size={15} className="text-gray-400" strokeWidth={1.75} /> {label}
                        </NavLink>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors touch-manipulation text-left"
                          style={{ position: 'relative', zIndex: 10001 }}>
                          <LogOut size={15} strokeWidth={1.75} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/profile" className="btn btn-secondary btn-sm px-3">
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop Top Navbar ── */}
      <header className="hidden lg:block flex-none z-[60] bg-white border-b border-gray-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <NavLink to="/" className="flex items-center gap-3 shrink-0">
              <img
                src="/assets/logos/parcimic-logo.png"
                alt="Parcimic AI"
                className="h-9 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="flex flex-col -space-y-0.5">
                <span className="font-bold text-gray-900 text-lg leading-tight">Parcimic</span>
                <span className="text-[11px] font-semibold text-brand-600 leading-tight">AI Health Assistant</span>
              </div>
            </NavLink>

            <nav className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon, exact }) => (
                <NavLink key={to} to={to} end={exact}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
                  <Icon size={16} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/check')}
                className="btn-primary btn btn-sm xl:btn">
                Start Check
              </button>

              {user ? (
                <div className="relative" ref={dropRef} style={{ zIndex: 9999 }}>
                  <button onClick={() => setDrop(!drop)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                    style={{ zIndex: 9999 }}>
                    {user.photoURL
                      ? <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      : null
                    }
                    <div className={`w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-gray-200 ${user.photoURL ? 'hidden' : ''}`}>
                      {initial}
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${drop ? 'rotate-180' : ''}`} />
                  </button>

                  {drop && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 animate-fade-in"
                      style={{ zIndex: 10000, position: 'absolute' }}>
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
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          style={{ position: 'relative', zIndex: 10001 }}>
                          <Icon size={15} className="text-gray-400" strokeWidth={1.75} /> {label}
                        </NavLink>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
                          style={{ position: 'relative', zIndex: 10001 }}>
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

      {/* ── Main Content ── */}
      <main className={`flex-1 overflow-y-auto ${
        location.pathname === '/assistant' || location.pathname === '/emergency' 
          ? 'overflow-hidden' 
          : ''
      }`}>
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden flex-none z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 safe-area-bottom">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `min-w-0 flex flex-col items-center justify-center gap-1 px-1 py-2.5 transition-all touch-manipulation ${
                  isActive ? 'text-brand-600 bg-brand-50/50' : 'text-gray-400 hover:text-gray-600'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.35 : 1.75} />
                  <span className={`max-w-full truncate text-[10px] font-semibold leading-none ${isActive ? 'text-brand-600' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Dropdown overlay */}
      {drop && (
        <div className="fixed inset-0" style={{ zIndex: 9990 }} onClick={() => setDrop(false)} />
      )}
    </div>
  );
}
