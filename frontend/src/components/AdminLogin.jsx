import React, { useState } from 'react';
import { Package, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin = ({ onBackToUserLogin }) => {
  const { loginAsAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate fields
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Attempt login
    const result = loginAsAdmin(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      setLoading(false);
    }
    // If successful, AuthContext will handle the redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 shipsync-bg">
      {/* Gradient mesh */}
      <div className="shipsync-mesh"></div>
      
      {/* Top spotlight */}
      <div className="shipsync-spotlight"></div>
      
      {/* Grid pattern */}
      <div className="shipsync-world"></div>
      
      {/* Noise texture */}
      <div className="shipsync-noise"></div>
      
      {/* Bottom fade */}
      <div className="shipsync-glow"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBackToUserLogin}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to User Login</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-full shadow-xl">
              <Lock className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            Admin Portal
          </h1>
          <p className="text-blue-100 text-sm drop-shadow">
            Authorized Access Only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 bg-white"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 bg-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </span>
                ) : (
                  'Login as Admin'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Admin access logs all activities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;