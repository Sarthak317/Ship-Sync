import React, { useState, useEffect } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  SignIn, 
  SignUp, 
  useUser 
} from '@clerk/clerk-react';
import { ShipmentForm, ShipmentTable } from './components';
import { Package, Clock, Truck, CheckCircle, TrendingUp, Sparkles, BarChart3, Shield, User, Anchor, ArrowRight, Globe, Zap, Lock, Mail, Phone, MapPin, Github, Linkedin, Twitter } from 'lucide-react';
import Header from './components/layout/Header';
import AnalyticsPage from './components/AnalyticsPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TrackShipment from './components/TrackShipment';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { notifyAdminNewShipment } from './utils/notificationService';

// Main Dashboard Component (User)
const Dashboard = () => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' or 'analytics'

  // Real-time listener for shipments
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const userEmail = user.primaryEmailAddress.emailAddress;
    
    // Create query for user's shipments only
    const q = query(
      collection(db, 'shipments'),
      where('userEmail', '==', userEmail)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shipmentsData = [];
      snapshot.forEach((doc) => {
        shipmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('📦 Loaded shipments:', shipmentsData.map(s => ({ 
        id: s.id, 
        tracking: s.trackingNumber 
      })));
      
      // Sort by creation date, newest first
      shipmentsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setShipments(shipmentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shipments:", error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user]);

  const handleAddShipment = async (newShipment) => {
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;

      const docRef = await addDoc(collection(db, 'shipments'), {
        ...newShipment,
        userEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Shipment added successfully with ID:', docRef.id);

      // Notify admin about new shipment
      await notifyAdminNewShipment(newShipment.trackingNumber, userEmail);
    } catch (error) {
      console.error('❌ Error adding shipment:', error);
      alert('Failed to add shipment. Please try again.');
    }
  };

  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      console.log('🔄 Updating status:', { shipmentId, newStatus });
      
      const shipmentRef = doc(db, 'shipments', shipmentId);
      
      await updateDoc(shipmentRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Status updated successfully!');
    } catch (error) {
      console.error('❌ Error updating status:', error);
      console.error('Failed shipment ID:', shipmentId);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    try {
      console.log('🗑️ Deleting shipment:', shipmentId);
      
      await deleteDoc(doc(db, 'shipments', shipmentId));
      
      console.log('✅ Shipment deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting shipment:', error);
      console.error('Failed shipment ID:', shipmentId);
      alert('Failed to delete shipment. Please try again.');
    }
  };

  const getStatusCounts = () => {
    return {
      total: shipments.length,
      pending: shipments.filter(s => s.status === 'Pending Approval' || s.status === 'Approved').length,
      inTransit: shipments.filter(s => ['In Transit', 'Dispatched', 'Out for Delivery'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'Delivered').length
    };
  };

  const getCompletionRate = () => {
    if (shipments.length === 0) return 0;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    return Math.round((delivered / shipments.length) * 100);
  };

  const counts = getStatusCounts();
  const completionRate = getCompletionRate();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
        <div className="text-center">
          <div className="relative">
            <Package className="w-20 h-20 text-emerald-500 mx-auto mb-6 animate-pulse" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse"></div>
          </div>
          <p className={`text-xl font-light tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Loading your shipments...</p>
        </div>
      </div>
    );
  }

  // Show Analytics Page
  if (currentPage === 'analytics') {
    return (
      <AnalyticsPage 
        shipments={shipments}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  // Show Dashboard
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <Header />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/10'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float-delayed ${isDark ? 'bg-teal-500/5' : 'bg-teal-500/10'}`}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Welcome back, {user?.firstName}
                </h1>
                <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
              <p className={`text-lg font-light ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Manage and track your logistics operations
              </p>
            </div>
            
            <div className={`backdrop-blur-sm rounded-2xl border shadow-2xl p-6 min-w-[200px] animate-slide-in-right ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-500">{completionRate}%</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentPage('analytics')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 group"
              >
                <BarChart3 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-emerald-500/50 hover:shadow-emerald-500/10' : 'bg-white/80 border-slate-200 hover:border-emerald-500/50 hover:shadow-emerald-500/20'}`} style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-slate-200 to-slate-300'}`}>
                <Package className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/50'}`}>
                <span className={`text-2xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{counts.total}</span>
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Shipments</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{counts.total}</p>
          </div>
          
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-amber-500/50 hover:shadow-amber-500/10' : 'bg-white/80 border-slate-200 hover:border-amber-500/50 hover:shadow-amber-500/20'}`} style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-500">{counts.pending}</span>
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Awaiting Dispatch</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{counts.pending}</p>
          </div>
          
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-cyan-500/50 hover:shadow-cyan-500/10' : 'bg-white/80 border-slate-200 hover:border-cyan-500/50 hover:shadow-cyan-500/20'}`} style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-500">{counts.inTransit}</span>
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Routes</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{counts.inTransit}</p>
          </div>
          
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-emerald-500/50 hover:shadow-emerald-500/10' : 'bg-white/80 border-slate-200 hover:border-emerald-500/50 hover:shadow-emerald-500/20'}`} style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-500">{counts.delivered}</span>
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{counts.delivered}</p>
          </div>
        </div>

        {/* Track Shipment Section */}
        <TrackShipment shipments={shipments} />

        <ShipmentForm onAddShipment={handleAddShipment} />
        <ShipmentTable 
          shipments={shipments} 
          onUpdateStatus={handleUpdateStatus}
          onDeleteShipment={handleDeleteShipment}
          readOnly={true}
        />
      </div>
    </div>
  );
};

// Homepage Component
const HomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen shipsync-bg">
      {/* Background layers */}
      <div className="shipsync-mesh"></div>
      <div className="shipsync-spotlight"></div>
      <div className="shipsync-world"></div>
      <div className="shipsync-noise"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-b from-blue-500 to-emerald-500 p-2.5 rounded-xl">
            <Anchor className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold font-['Poppins'] italic">
            <span className="text-blue-400">Ship</span>
            <span className="text-emerald-400">Sync</span>
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all duration-300 font-medium"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/80">Modern Shipment Management</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Track Your Shipments
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Streamline your logistics with our powerful tracking system. 
            Get real-time updates, analytics, and complete control over your shipments.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#tech-stack" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold text-lg border border-white/10 transition-all duration-300">
              Learn More
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-32 scroll-mt-24">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Global Tracking</h3>
            <p className="text-white/50 leading-relaxed">
              Track shipments across the globe with real-time location updates and status notifications.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Instant Updates</h3>
            <p className="text-white/50 leading-relaxed">
              Get instant email notifications when your shipment status changes or requires attention.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Secure & Reliable</h3>
            <p className="text-white/50 leading-relaxed">
              Enterprise-grade security with admin approval system for all new shipments.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-40 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="relative">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Create Account</h3>
                  <p className="text-white/50 text-sm">
                    Sign up with your email using our secure Clerk authentication
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Add Shipment</h3>
                  <p className="text-white/50 text-sm">
                    Enter your shipment details including origin, destination & items
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Admin Approval</h3>
                  <p className="text-white/50 text-sm">
                    Admin reviews and approves your shipment for tracking
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Track & Receive</h3>
                  <p className="text-white/50 text-sm">
                    Monitor your shipment in real-time until delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div id="tech-stack" className="mt-40 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built With Modern Tech
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Powered by industry-leading technologies for reliability and performance
            </p>
          </div>

          {/* Tech Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* React */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-cyan-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-cyan-400" fill="currentColor">
                    <path d="M12 9.861a2.139 2.139 0 100 4.278 2.139 2.139 0 000-4.278zm-5.992 6.394l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046a24.95 24.95 0 011.182-3.046 24.752 24.752 0 01-1.182-3.046zm12.675 7.305l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.48 1.039.877 2.06 1.182 3.046 2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046a24.788 24.788 0 01-1.182 3.046zM5.31 8.945l-.133-.467C4.188 4.992 4.488 2.494 6 1.622c1.483-.856 3.864.155 6.359 2.716l.34.349-.34.349a23.552 23.552 0 00-2.422 2.967l-.135.193-.235.02a23.657 23.657 0 00-3.785.61l-.472.119zm1.896-6.63c-.268 0-.505.058-.705.173-.994.573-1.17 2.565-.485 5.253a25.122 25.122 0 013.233-.501 24.847 24.847 0 012.052-2.544c-1.56-1.519-3.037-2.381-4.095-2.381zm9.589 20.362c-.001 0-.001 0 0 0-1.425 0-3.255-1.073-5.154-3.023l-.34-.349.34-.349a23.53 23.53 0 002.421-2.968l.135-.193.234-.02a23.63 23.63 0 003.787-.609l.472-.119.134.468c.987 3.484.688 5.983-.824 6.854a2.38 2.38 0 01-1.205.308zm-4.096-3.381c1.56 1.519 3.037 2.381 4.095 2.381h.001c.267 0 .505-.058.704-.173.994-.573 1.171-2.566.485-5.254a25.02 25.02 0 01-3.234.501 24.674 24.674 0 01-2.051 2.545zM18.69 8.945l-.472-.119a23.479 23.479 0 00-3.787-.61l-.234-.02-.135-.193a23.414 23.414 0 00-2.421-2.967l-.34-.349.34-.349C14.135 1.778 16.515.767 18 1.622c1.512.872 1.812 3.37.824 6.855l-.134.468zM14.75 7.24c1.142.104 2.227.273 3.234.501.686-2.688.509-4.68-.485-5.253-.988-.571-2.845.304-4.8 2.208A24.849 24.849 0 0114.75 7.24zM7.206 22.677A2.38 2.38 0 016 22.369c-1.512-.871-1.812-3.369-.823-6.854l.132-.468.472.119c1.155.291 2.429.496 3.785.609l.235.02.134.193a23.596 23.596 0 002.422 2.968l.34.349-.34.349c-1.898 1.95-3.728 3.023-5.151 3.023zm-1.19-6.427c-.686 2.688-.509 4.681.485 5.254.987.563 2.843-.305 4.8-2.208a24.998 24.998 0 01-2.052-2.545 24.976 24.976 0 01-3.233-.501zm5.984.628c-.823 0-1.669-.036-2.516-.106l-.235-.02-.135-.193a30.388 30.388 0 01-1.35-2.122 30.354 30.354 0 01-1.166-2.228l-.1-.213.1-.213a30.3 30.3 0 011.166-2.228c.414-.716.869-1.43 1.35-2.122l.135-.193.235-.02a29.785 29.785 0 015.033 0l.234.02.134.193a30.006 30.006 0 012.517 4.35l.101.213-.101.213a29.6 29.6 0 01-2.517 4.35l-.134.193-.234.02c-.847.07-1.694.106-2.517.106zm-2.197-1.084c1.48.111 2.914.111 4.395 0a29.006 29.006 0 002.196-3.798 28.585 28.585 0 00-2.197-3.798 29.031 29.031 0 00-4.394 0 28.477 28.477 0 00-2.197 3.798 29.114 29.114 0 002.197 3.798z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">React</h3>
                <p className="text-white/50 text-sm mb-4">Frontend framework for building interactive user interfaces with component-based architecture</p>
                <span className="text-xs text-cyan-400 font-medium px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">Frontend</span>
              </div>
            </div>

            {/* Firebase */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-amber-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-400" fill="currentColor">
                    <path d="M3.89 15.673L6.255.461A.542.542 0 017.27.289l2.543 4.771zm16.795 3.691L18.433 5.365a.543.543 0 00-.918-.295l-14.2 14.294 7.857 4.428a1.62 1.62 0 001.587 0zm-1.6-13.674l-2.315-4.4a.541.541 0 00-.946 0L3.89 15.673l9.194-5.39z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Firebase</h3>
                <p className="text-white/50 text-sm mb-4">Real-time database for instant shipment updates and cloud storage for reliable data persistence</p>
                <span className="text-xs text-amber-400 font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Database</span>
              </div>
            </div>

            {/* Clerk */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-purple-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Clerk</h3>
                <p className="text-white/50 text-sm mb-4">Complete user authentication with secure login, signup, and session management</p>
                <span className="text-xs text-purple-400 font-medium px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">Authentication</span>
              </div>
            </div>

            {/* Tailwind CSS */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-sky-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-sky-400" fill="currentColor">
                    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Tailwind CSS</h3>
                <p className="text-white/50 text-sm mb-4">Utility-first CSS framework for rapid UI development with modern, responsive designs</p>
                <span className="text-xs text-sky-400 font-medium px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">Styling</span>
              </div>
            </div>

            {/* Resend */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-emerald-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Resend</h3>
                <p className="text-white/50 text-sm mb-4">Email API for sending transactional emails - approval notifications and status updates</p>
                <span className="text-xs text-emerald-400 font-medium px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Email</span>
              </div>
            </div>

            {/* Node.js / Express */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-green-500/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-400" fill="currentColor">
                    <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.151-.023.218.017l2.256 1.339c.082.045.198.045.275 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.053-.193-.137-.242l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68c-.085.049-.139.145-.139.243v10.15c0 .097.054.189.134.235l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675c-.57-.329-.922-.943-.922-1.604V6.921c0-.659.351-1.273.922-1.602l8.795-5.082c.557-.315 1.296-.315 1.848 0l8.794 5.082c.57.329.924.943.924 1.602v10.15c0 .659-.354 1.273-.924 1.604l-8.794 5.078c-.28.163-.6.247-.925.247zm2.722-6.99c-3.863 0-4.67-1.776-4.67-3.267 0-.141.113-.254.255-.254h1.136c.127 0 .233.092.253.216.172 1.163.686 1.75 3.026 1.75 1.862 0 2.655-.421 2.655-1.408 0-.569-.225-1.991-3.117-1.991-2.591 0-4.159-.828-4.159-2.862 0-1.886 1.591-3.01 4.257-3.01 2.993 0 4.478 1.039 4.666 3.27.006.074-.02.148-.068.205-.048.057-.116.088-.188.088h-1.14c-.12 0-.225-.083-.252-.199-.28-1.242-.958-1.64-3.018-1.64-2.222 0-2.481.774-2.481 1.354 0 .703.305.908 3.021 1.305 2.689.392 4.255.946 4.255 2.865 0 2.036-1.695 3.203-4.651 3.203z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Node.js</h3>
                <p className="text-white/50 text-sm mb-4">Backend runtime with Express.js server for handling API requests and email services</p>
                <span className="text-xs text-green-400 font-medium px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">Backend</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-b from-blue-500 to-emerald-500 p-2 rounded-xl">
                  <Anchor className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold font-['Poppins'] italic">
                  <span className="text-blue-400">Ship</span>
                  <span className="text-emerald-400">Sync</span>
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Modern shipment tracking solution for businesses. Track, manage, and optimize your logistics in real-time.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-blue-500/50">
                  <Twitter className="w-4 h-4 text-white/60 hover:text-blue-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-blue-500/50">
                  <Linkedin className="w-4 h-4 text-white/60 hover:text-blue-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-white/30">
                  <Github className="w-4 h-4 text-white/60 hover:text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-white/50 hover:text-white transition-colors text-sm cursor-pointer">Home</a></li>
                <li><a href="#features" className="text-white/50 hover:text-white transition-colors text-sm">Features</a></li>
                <li><a href="#how-it-works" className="text-white/50 hover:text-white transition-colors text-sm">How It Works</a></li>
                <li><a href="#contact" className="text-white/50 hover:text-white transition-colors text-sm">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Help Center</a></li>
                <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Documentation</a></li>
                <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">API Reference</a></li>
                <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div id="contact" className="scroll-mt-24">
              <h4 className="text-white font-semibold mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white/50 text-sm">support@shipsync.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white/50 text-sm">+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-white/50 text-sm">Mumbai, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © 2026 ShipSync. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Footer accent */}
      <div className="shipsync-glow"></div>
    </div>
  );
};

// Login Type Selection Page
const LoginSelection = ({ onSelectUserLogin, onSelectAdminLogin, onBackToHome }) => {
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
      
      <div className="relative z-10 w-full max-w-4xl">
        {/* Back to Home */}
        <button
          onClick={onBackToHome}
          className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200"
        >
          <span>← Back to Home</span>
        </button>
        
        {/* Logo Section */}
        <div className="text-center mb-12">
          {/* Anchor Icon Box */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-b from-blue-500 to-emerald-500 p-5 rounded-2xl shadow-2xl">
              <Anchor className="w-16 h-16 text-white" />
            </div>
          </div>
          
          {/* ShipSync Text */}
          <h1 className="text-5xl font-bold mb-3 font-['Poppins'] italic">
            <span className="text-blue-400">Ship</span>
            <span className="text-emerald-400">Sync</span>
          </h1>
          
          {/* Tagline */}
          <p className="text-slate-300 text-lg tracking-[0.25em] uppercase">
            Shipment Tracking
          </p>
        </div>

        {/* Login Type Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* User Login Card - Glass with subtle accent */}
          <button
            onClick={onSelectUserLogin}
            className="group relative rounded-3xl hover:scale-[1.02] transition-all duration-500 text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/30 hover:bg-white/[0.06] p-10 hover:shadow-[0_8px_40px_rgba(6,182,212,0.15)]"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon with subtle color */}
              <div className="p-5 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 bg-cyan-500/[0.08] border border-cyan-500/20 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/[0.12]">
                <User className="w-12 h-12 text-cyan-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">User Login</h2>
              <p className="text-white/40 mb-6 leading-relaxed">
                Access your personal shipment dashboard and manage your logistics
              </p>
              
              {/* CTA with subtle color */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500/[0.1] border border-cyan-500/20 text-cyan-400 font-semibold group-hover:bg-cyan-500/[0.18] group-hover:border-cyan-400/40 group-hover:gap-3 transition-all duration-300">
                Continue as User
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </button>

          {/* Admin Login Card - Glass with subtle accent */}
          <button
            onClick={onSelectAdminLogin}
            className="group relative rounded-3xl hover:scale-[1.02] transition-all duration-500 text-left bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/30 hover:bg-white/[0.06] p-10 hover:shadow-[0_8px_40px_rgba(244,63,94,0.15)]"
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon with subtle color */}
              <div className="p-5 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 bg-rose-500/[0.08] border border-rose-500/20 group-hover:border-rose-400/40 group-hover:bg-rose-500/[0.12]">
                <Shield className="w-12 h-12 text-rose-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">Admin Portal</h2>
              <p className="text-white/40 mb-6 leading-relaxed">
                Access all shipments and manage the entire platform
              </p>
              
              {/* CTA with subtle color */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500/[0.1] border border-rose-500/20 text-rose-400 font-semibold group-hover:bg-rose-500/[0.18] group-hover:border-rose-400/40 group-hover:gap-3 transition-all duration-300">
                Admin Access
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Secured by <span className="font-semibold text-white/80">Clerk</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Auth Pages Component
const AuthPages = () => {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login-select', 'user', or 'admin'
  const [isSignUp, setIsSignUp] = useState(false);

  // Show Homepage
  if (currentPage === 'home') {
    return (
      <HomePage onGetStarted={() => setCurrentPage('login-select')} />
    );
  }

  // Show login type selection
  if (currentPage === 'login-select') {
    return (
      <LoginSelection
        onSelectUserLogin={() => setCurrentPage('user')}
        onSelectAdminLogin={() => setCurrentPage('admin')}
        onBackToHome={() => setCurrentPage('home')}
      />
    );
  }

  // Show Admin Login
  if (currentPage === 'admin') {
    return <AdminLogin onBackToUserLogin={() => setCurrentPage('login-select')} />;
  }

  // Show User Login (Clerk)
  return (
    <div className="min-h-screen flex items-center justify-center p-4 shipsync-bg">
      {/* Background layers */}
      <div className="shipsync-mesh"></div>
      <div className="shipsync-spotlight"></div>
      <div className="shipsync-world"></div>
      <div className="shipsync-noise"></div>
      <div className="shipsync-glow"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => setCurrentPage('login-select')}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-200"
        >
          <span>← Back to login options</span>
        </button>
        
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2 font-['Poppins'] italic">
            <span className="text-blue-400">Ship</span>
            <span className="text-emerald-400">Sync</span>
          </h1>
          <p className="text-slate-300 text-sm tracking-[0.2em] uppercase">
            Shipment Tracking
          </p>
        </div>

        {/* SINGLE UNIFIED AUTH CONTAINER */}
        <div className="bg-white rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden">
          
          {/* Toggle Buttons */}
          <div className="flex bg-gray-50 border-b">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                !isSignUp
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                isSignUp
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {isSignUp ? (
              <SignUp 
                afterSignUpUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                    card: 'shadow-none bg-transparent border-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
                    footer: 'hidden',
                  }
                }}
              />
            ) : (
              <SignIn 
                afterSignInUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                    card: 'shadow-none bg-transparent border-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
                    footer: 'hidden',
                  }
                }}
              />
            )}
          </div>

          {/* Clerk branding */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-500">
              Secured by <span className="font-semibold">Clerk</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Admin is logged in */}
      {isAdmin && <AdminDashboard />}
      
      {/* User is logged in with Clerk */}
      {!isAdmin && (
        <>
          <SignedIn>
            <Dashboard />
          </SignedIn>
          <SignedOut>
            <AuthPages />
          </SignedOut>
        </>
      )}
    </>
  );
};

export default App;