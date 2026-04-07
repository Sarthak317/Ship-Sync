import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative group p-3 rounded-xl transition-all duration-500 ease-out
        ${isDark 
          ? 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/50 hover:border-emerald-500/50' 
          : 'bg-gradient-to-br from-amber-100 to-orange-200 hover:from-amber-200 hover:to-orange-300 border border-amber-300/50 hover:border-amber-400/50'
        }
        shadow-lg hover:shadow-xl transform hover:scale-110
        ${isDark ? 'hover:shadow-emerald-500/20' : 'hover:shadow-amber-500/30'}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Glow effect */}
      <div className={`
        absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isDark ? 'bg-emerald-500/20' : 'bg-amber-500/30'}
      `}></div>
      
      {/* Icon container with rotation animation */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun icon */}
        <Sun 
          className={`
            absolute w-5 h-5 transition-all duration-500 ease-out
            ${isDark 
              ? 'opacity-0 rotate-90 scale-0 text-amber-400' 
              : 'opacity-100 rotate-0 scale-100 text-amber-600'
            }
          `}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`
            absolute w-5 h-5 transition-all duration-500 ease-out
            ${isDark 
              ? 'opacity-100 rotate-0 scale-100 text-emerald-400' 
              : 'opacity-0 -rotate-90 scale-0 text-slate-400'
            }
          `}
        />
      </div>

      {/* Sparkle effects on hover */}
      <div className={`
        absolute -top-1 -right-1 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300
        ${isDark ? 'bg-emerald-400' : 'bg-amber-400'}
        animate-pulse
      `}></div>
      <div className={`
        absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100
        ${isDark ? 'bg-teal-400' : 'bg-orange-400'}
        animate-pulse
      `}></div>
    </button>
  );
};

export default ThemeToggle;
