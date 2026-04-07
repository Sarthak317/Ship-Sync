import React from 'react';
import { Package, Zap, Shield, LogOut, Anchor } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from '../NotificationBell';

const Header = ({ isAdmin: isAdminProp = false }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const { isAdmin, adminEmail, logoutAdmin } = useAuth();

  const isAdminMode = isAdminProp || isAdmin;

  return (
    <header className={`
      ${isDark 
        ? isAdminMode 
          ? 'bg-slate-900/90 border-red-500/30'
          : 'bg-slate-900/80 border-slate-700/50'
        : isAdminMode
          ? 'bg-white/95 border-red-500/20'
          : 'bg-white/90 border-slate-200'
      } 
      backdrop-blur-xl border-b shadow-xl sticky top-0 z-50 transition-colors duration-300
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <div className="flex items-center group">
            {isAdminMode ? (
              <>
                <div className="flex items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                  {/* Anchor Icon */}
                  <div className="bg-gradient-to-b from-blue-500 to-emerald-500 p-2 rounded-xl">
                    <Anchor className="w-6 h-6 text-white" />
                  </div>
                  {/* Text Logo */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold font-['Poppins'] italic leading-tight">
                        <span className="text-blue-500">Ship</span>
                        <span className="text-emerald-500">Sync</span>
                      </h1>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold`}>
                        Admin
                      </span>
                    </div>
                    <p className={`text-[10px] tracking-[0.15em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      System Administration
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                  {/* Anchor Icon */}
                  <div className="bg-gradient-to-b from-blue-500 to-emerald-500 p-2 rounded-xl">
                    <Anchor className="w-6 h-6 text-white" />
                  </div>
                  {/* Text Logo */}
                  <div>
                    <h1 className="text-2xl font-bold font-['Poppins'] italic leading-tight">
                      <span className="text-blue-500">Ship</span>
                      <span className="text-emerald-500">Sync</span>
                    </h1>
                    <p className={`text-[10px] tracking-[0.15em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Shipment Tracking
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right side - Notifications, Theme Toggle and User Menu */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell
              userEmail={isAdminMode ? null : user?.primaryEmailAddress?.emailAddress}
              isAdmin={isAdminMode}
            />

            {/* Theme Toggle Button */}
            <ThemeToggle />
            
            {isAdminMode ? (
              /* Admin Info and Logout */
              <>
                <div className={`hidden md:block text-right ${isDark ? '' : 'border-l border-slate-200 pl-4'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Administrator
                  </p>
                  <p className={`text-xs font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {adminEmail}
                  </p>
                </div>
                
                <button
                  onClick={logoutAdmin}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300' : 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700'}`}
                  title="Logout Admin"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-semibold hidden md:block">Logout</span>
                </button>
              </>
            ) : (
              /* User Info with Clerk */
              <>
                <div className={`hidden md:block text-right ${isDark ? '' : 'border-l border-slate-200 pl-4'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={`text-xs font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-lg group-hover:bg-emerald-500/30 transition-all duration-300 rounded-full"></div>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: `w-12 h-12 ring-2 ${isDark ? 'ring-slate-700' : 'ring-slate-300'} hover:ring-emerald-500 transition-all duration-300`
                      }
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;