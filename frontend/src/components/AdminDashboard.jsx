import React, { useState, useEffect } from 'react';
import { Package, Clock, Truck, CheckCircle, TrendingUp, Shield, Users as UsersIcon, Zap, Play } from 'lucide-react';
import Header from './layout/Header';
import ShipmentTable from './ShipmentTable';
import RejectionModal from './RejectionModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { notifyUserStatusChange } from '../utils/notificationService';
import { sendApprovalEmail, sendRejectionEmail, sendDeliveryEmail } from '../utils/emailService';
import { STATUS_FLOW, getNextStatus } from '../utils/warehouseConfig';

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const { adminEmail } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemoShipment, setSelectedDemoShipment] = useState(null);
  
  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    shipment: null
  });

  // Real-time listener for ALL shipments (admin view)
  useEffect(() => {
    // Query ALL shipments without user filter
    const q = query(
      collection(db, 'shipments'),
      orderBy('createdAt', 'desc')
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
      
      console.log('🔐 Admin loaded all shipments:', shipmentsData.length);
      
      setShipments(shipmentsData);
      
      // Update selectedDemoShipment if it still exists
      setSelectedDemoShipment(prev => {
        if (prev) {
          const updated = shipmentsData.find(s => s.id === prev.id);
          return updated || null;
        }
        return null;
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shipments:", error);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Admin can update shipment status
  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      // Find the shipment to get userEmail and trackingNumber
      const shipment = shipments.find(s => s.id === shipmentId);

      const shipmentRef = doc(db, 'shipments', shipmentId);
      await updateDoc(shipmentRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: new Date().toISOString()
        })
      });
      console.log(`✅ Admin updated shipment ${shipmentId} to ${newStatus}`);

      // Notify user about status change
      if (shipment && shipment.userEmail) {
        await notifyUserStatusChange(shipment.trackingNumber, shipment.userEmail, newStatus);
        
        // Send approval email when status is Approved
        if (newStatus === 'Approved') {
          const emailResult = await sendApprovalEmail(shipment.userEmail, shipment);
          if (emailResult.success) {
            console.log('📧 Approval email sent!');
          }
        }
        
        // Send delivery email when status is Delivered
        if (newStatus === 'Delivered') {
          const emailResult = await sendDeliveryEmail(shipment.userEmail, shipment);
          if (emailResult.success) {
            console.log('📦 Delivery email sent!');
          }
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Demo Mode: Advance to next status
  const handleDemoNextStatus = async (shipment) => {
    const nextStatus = getNextStatus(shipment.status);
    if (nextStatus) {
      await handleUpdateStatus(shipment.id, nextStatus);
    }
  };

  // Demo Mode: Set specific status (with special handling for Out for Delivery)
  const handleDemoSetStatus = async (shipment, status) => {
    // If setting to "Out for Delivery", also set expected delivery to today for demo
    if (status === 'Out for Delivery') {
      try {
        const shipmentRef = doc(db, 'shipments', shipment.id);
        await updateDoc(shipmentRef, {
          expectedDeliveryDate: new Date().toISOString(),
          isManualOverride: true // Mark as manual so cron doesn't interfere
        });
        console.log('📅 Set delivery date to today for demo tracking');
      } catch (error) {
        console.error('Error updating delivery date:', error);
      }
    }
    await handleUpdateStatus(shipment.id, status);
  };

  // Toggle manual override for a shipment
  const handleToggleManualOverride = async (shipmentId, enabled) => {
    try {
      const shipmentRef = doc(db, 'shipments', shipmentId);
      await updateDoc(shipmentRef, {
        isManualOverride: enabled,
        updatedAt: serverTimestamp()
      });
      console.log(`🔧 Manual override ${enabled ? 'enabled' : 'disabled'} for ${shipmentId}`);
    } catch (error) {
      console.error('Error toggling manual override:', error);
    }
  };

  // Handle rejection with modal
  const handleRejectClick = (shipment) => {
    setRejectionModal({ isOpen: true, shipment });
  };

  // Handle rejection confirmation
  const handleRejectConfirm = async (reason) => {
    const shipment = rejectionModal.shipment;
    if (!shipment) return;

    try {
      const shipmentRef = doc(db, 'shipments', shipment.id);
      await updateDoc(shipmentRef, {
        status: 'Rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      console.log(`❌ Admin rejected shipment ${shipment.id}`);

      // Notify user and send rejection email
      if (shipment.userEmail) {
        await notifyUserStatusChange(shipment.trackingNumber, shipment.userEmail, 'Rejected');
        const emailResult = await sendRejectionEmail(shipment.userEmail, shipment, reason);
        if (emailResult.success) {
          console.log('📧 Rejection email sent!');
        }
      }
    } catch (error) {
      console.error('Error rejecting shipment:', error);
      alert('Failed to reject shipment. Please try again.');
    }
  };

  // Admin can delete any shipment
  const handleDeleteShipment = async (shipmentId) => {
    try {
      const shipmentRef = doc(db, 'shipments', shipmentId);
      await deleteDoc(shipmentRef);
      console.log(`🗑️ Admin deleted shipment ${shipmentId}`);
    } catch (error) {
      console.error('Error deleting shipment:', error);
      alert('Failed to delete shipment. Please try again.');
    }
  };

 const getStatusCounts = () => {
    return {
      total: shipments.length,
      pendingApproval: shipments.filter(s => s.status === 'Pending Approval').length,
      approved: shipments.filter(s => s.status === 'Approved').length,
      rejected: shipments.filter(s => s.status === 'Rejected').length,
      inTransit: shipments.filter(s => ['In Transit', 'Dispatched', 'Out for Delivery'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'Delivered').length
    };
  };

  const getUniqueUsers = () => {
    const uniqueEmails = new Set(shipments.map(s => s.userEmail).filter(Boolean));
    return uniqueEmails.size;
  };

  const getCompletionRate = () => {
    if (shipments.length === 0) return 0;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    return Math.round((delivered / shipments.length) * 100);
  };

  const counts = getStatusCounts();
  const completionRate = getCompletionRate();
  const totalUsers = getUniqueUsers();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
        <div className="text-center">
          <div className="relative">
            <Shield className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
            <div className="absolute inset-0 bg-red-500/20 blur-3xl animate-pulse"></div>
          </div>
          <p className={`text-xl font-light tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <Header isAdmin={true} />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${isDark ? 'bg-red-500/5' : 'bg-red-500/10'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float-delayed ${isDark ? 'bg-orange-500/5' : 'bg-orange-500/10'}`}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Admin Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Admin Portal
                </h1>
              </div>
              <p className={`text-lg font-light ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Logged in as: <span className="font-semibold text-red-500">{adminEmail}</span>
              </p>
            </div>
            
            <div className={`backdrop-blur-sm rounded-2xl border shadow-2xl p-6 min-w-[200px] animate-slide-in-right ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Success Rate</p>
                  <p className="text-3xl font-bold text-red-500">{completionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {/* Total Users */}
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-red-500/50 hover:shadow-red-500/10' : 'bg-white/80 border-slate-200 hover:border-red-500/50 hover:shadow-red-500/20'}`} style={{animationDelay: '0.05s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-500">{totalUsers}</span>
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Users</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalUsers}</p>
          </div>

          {/* Total Shipments */}
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
          
          {/* Pending */}
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-amber-500/50 hover:shadow-amber-500/10' : 'bg-white/80 border-slate-200 hover:border-amber-500/50 hover:shadow-amber-500/20'}`} style={{animationDelay: '0.15s'}}>
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
          
          {/* In Transit */}
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-cyan-500/50 hover:shadow-cyan-500/10' : 'bg-white/80 border-slate-200 hover:border-cyan-500/50 hover:shadow-cyan-500/20'}`} style={{animationDelay: '0.2s'}}>
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
          
          {/* Delivered */}
          <div className={`group backdrop-blur-sm rounded-2xl border p-6 hover:shadow-2xl transition-all duration-300 animate-fade-in-up ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-emerald-500/50 hover:shadow-emerald-500/10' : 'bg-white/80 border-slate-200 hover:border-emerald-500/50 hover:shadow-emerald-500/20'}`} style={{animationDelay: '0.25s'}}>
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

        {/* Demo Mode Control Panel */}
        <div className={`backdrop-blur-sm rounded-2xl border shadow-xl p-6 mb-10 animate-fade-in ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Quick Status Manager
            </h2>
          </div>

          {/* Shipment Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Select Shipment to Control
              </label>
              <select
                value={selectedDemoShipment?.id || ''}
                onChange={(e) => {
                  const shipment = shipments.find(s => s.id === e.target.value);
                  setSelectedDemoShipment(shipment || null);
                }}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${isDark ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Choose a shipment...</option>
                {shipments.filter(s => s.status !== 'Rejected').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} - {s.senderName} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedDemoShipment && (
              <>
                {/* Current Status Display */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Current Status
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-300'}`}>
                    <div className={`w-3 h-3 rounded-full ${
                      selectedDemoShipment.status === 'Delivered' ? 'bg-green-500' :
                      selectedDemoShipment.status === 'Out for Delivery' ? 'bg-blue-500' :
                      selectedDemoShipment.status === 'Dispatched' ? 'bg-purple-500' :
                      selectedDemoShipment.status === 'In Transit' ? 'bg-cyan-500' :
                      selectedDemoShipment.status === 'Approved' ? 'bg-emerald-500' :
                      'bg-amber-500'
                    }`}></div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {selectedDemoShipment.status}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Quick Actions
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDemoNextStatus(selectedDemoShipment)}
                      disabled={selectedDemoShipment.status === 'Delivered'}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                        selectedDemoShipment.status === 'Delivered'
                          ? 'bg-slate-500/50 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-105'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      Next Status
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status Flow Buttons - Only allow forward progression */}
          {selectedDemoShipment && (
            <div className="mt-6 pt-6 border-t border-slate-700/30">
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Status Progression
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map((status, index) => {
                  const currentIndex = STATUS_FLOW.indexOf(selectedDemoShipment.status);
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isNext = index === currentIndex + 1;
                  const isFuture = index > currentIndex + 1;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => isNext && handleDemoSetStatus(selectedDemoShipment, status)}
                      disabled={!isNext}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                          : isCompleted
                          ? isDark ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default' : 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                          : isNext
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 cursor-pointer animate-pulse'
                          : isDark ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="w-4 h-4" />}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-white" />}
                      {isNext && <Play className="w-4 h-4" />}
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* All Shipments Table - Admin can update status */}
        <ShipmentTable 
          shipments={shipments} 
          onUpdateStatus={handleUpdateStatus}
          onDeleteShipment={handleDeleteShipment}
          onRejectClick={handleRejectClick}
          readOnly={false}
        />
      </div>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, shipment: null })}
        onConfirm={handleRejectConfirm}
        shipment={rejectionModal.shipment}
      />
    </div>
  );
};

export default AdminDashboard;
