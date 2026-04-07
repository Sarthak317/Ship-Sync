import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Truck, CheckCircle, Clock, Navigation, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { WAREHOUSE, STATUS_FLOW, getStatusIndex, getProgressPercentage } from '../utils/warehouseConfig';
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { sendDeliveryEmail } from '../utils/emailService';

const TrackShipment = ({ shipments }) => {
  const { isDark } = useTheme();
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Filter only approved/in-progress shipments (not pending or rejected)
  const trackableShipments = shipments.filter(s => 
    s.status !== 'Pending Approval' && s.status !== 'Rejected'
  );

  useEffect(() => {
    if (selectedShipmentId) {
      const shipment = shipments.find(s => s.id === selectedShipmentId);
      setSelectedShipment(shipment);
    } else {
      setSelectedShipment(null);
    }
  }, [selectedShipmentId, shipments]);

  // Status icons mapping
  const statusIcons = {
    'Pending Approval': Clock,
    'Approved': CheckCircle,
    'In Transit': Truck,
    'Dispatched': Package,
    'Out for Delivery': Navigation,
    'Delivered': CheckCircle
  };

  // Status colors
  const statusColors = {
    'Pending Approval': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    'Approved': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    'In Transit': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    'Dispatched': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    'Out for Delivery': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    'Delivered': 'text-green-400 bg-green-500/20 border-green-500/30'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Track Shipment</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monitor your shipment in real-time</p>
        </div>
      </div>

      {/* Shipment Selector */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Select Shipment
        </label>
        <select
          value={selectedShipmentId}
          onChange={(e) => setSelectedShipmentId(e.target.value)}
          className={`w-full p-3 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-slate-900/50 border-slate-700 text-white' 
              : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <option value="">-- Select a shipment to track --</option>
          {trackableShipments.map(shipment => (
            <option key={shipment.id} value={shipment.id}>
              {shipment.trackingNumber} - {shipment.brand} {shipment.clothingType} ({shipment.status})
            </option>
          ))}
        </select>
      </div>

      {/* No trackable shipments */}
      {trackableShipments.length === 0 && (
        <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No shipments to track yet.</p>
          <p className="text-sm">Your approved shipments will appear here.</p>
        </div>
      )}

      {/* Selected Shipment Details */}
      {selectedShipment && (
        <div className="space-y-6">
          {/* Tracking Number & Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tracking Number</p>
              <p className={`text-2xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {selectedShipment.trackingNumber}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${statusColors[selectedShipment.status]}`}>
              <span className="font-semibold">{selectedShipment.status}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${getProgressPercentage(selectedShipment.status)}%` }}
              />
            </div>
            <p className={`text-right text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {getProgressPercentage(selectedShipment.status)}% Complete
            </p>
          </div>

          {/* Status Timeline */}
          <div className="relative">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Shipment Journey
            </h3>
            
            <div className="space-y-0">
              {STATUS_FLOW.filter(s => s !== 'Pending Approval').map((status, index) => {
                const currentIndex = getStatusIndex(selectedShipment.status);
                const statusIndex = getStatusIndex(status);
                const isCompleted = statusIndex <= currentIndex;
                const isCurrent = status === selectedShipment.status;
                const StatusIcon = statusIcons[status];
                
                // Find timestamp from status history
                const historyEntry = selectedShipment.statusHistory?.find(h => h.status === status);
                
                return (
                  <div key={status} className="flex gap-4">
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : isCurrent
                            ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                            : isDark 
                              ? 'bg-slate-800 border-slate-600 text-slate-500'
                              : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      {index < STATUS_FLOW.length - 2 && (
                        <div className={`w-0.5 h-16 ${
                          isCompleted ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                    
                    {/* Status details */}
                    <div className="flex-1 pb-6">
                      <p className={`font-semibold ${
                        isCompleted || isCurrent 
                          ? isDark ? 'text-white' : 'text-slate-800'
                          : isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {status}
                      </p>
                      {historyEntry && (
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(historyEntry.timestamp)}
                        </p>
                      )}
                      {!isCompleted && !isCurrent && (
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Pending
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Address */}
          {selectedShipment.deliveryAddress && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Delivery Address</span>
              </div>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {selectedShipment.deliveryAddress.street}<br />
                {selectedShipment.deliveryAddress.city}, {selectedShipment.deliveryAddress.state}<br />
                {selectedShipment.deliveryAddress.pincode}
              </p>
            </div>
          )}

          {/* Map - Only show when Out for Delivery */}
          {selectedShipment.status === 'Out for Delivery' && (
            <LiveTrackingMap 
              shipment={selectedShipment} 
              isDark={isDark} 
            />
          )}

          {/* Expected Delivery */}
          {selectedShipment.expectedDeliveryDate && selectedShipment.status !== 'Delivered' && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                📅 Expected Delivery: <span className="font-semibold">{formatDate(selectedShipment.expectedDeliveryDate)}</span>
              </p>
            </div>
          )}

          {/* Delivered Message */}
          {selectedShipment.status === 'Delivered' && (
            <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
              <CheckCircle className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                🎉 Shipment Delivered Successfully!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Live Tracking Map Component (when Out for Delivery) - Google Maps Style
const LiveTrackingMap = ({ shipment, isDark }) => {
  const [vehiclePosition, setVehiclePosition] = useState(15); // Start at 15%
  const [eta, setEta] = useState(25);
  const [isDelivered, setIsDelivered] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const deliveryTriggered = useRef(false);

  // Auto-trigger delivery when truck reaches destination
  const triggerDelivery = async () => {
    if (deliveryTriggered.current || isDelivering) return;
    deliveryTriggered.current = true;
    setIsDelivering(true);

    try {
      console.log('🚚 Truck arrived! Triggering delivery...');
      
      // Update status to Delivered in Firebase
      const shipmentRef = doc(db, 'shipments', shipment.id);
      await updateDoc(shipmentRef, {
        status: 'Delivered',
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'Delivered',
          timestamp: new Date().toISOString()
        })
      });
      
      // Send delivery email with invoice
      if (shipment.userEmail) {
        const emailResult = await sendDeliveryEmail(shipment.userEmail, shipment);
        if (emailResult.success) {
          console.log('📧 Delivery email with invoice sent!');
        }
      }
      
      setIsDelivered(true);
      console.log('✅ Delivery completed!');
    } catch (error) {
      console.error('Error triggering delivery:', error);
      deliveryTriggered.current = false;
    }
    setIsDelivering(false);
  };

  // Simulate vehicle movement - ~2 minutes for demo (ideal for viva)
  useEffect(() => {
    if (isDelivered) return;
    
    const interval = setInterval(() => {
      setVehiclePosition(prev => {
        if (prev >= 95) {
          // Truck arrived - trigger delivery!
          triggerDelivery();
          return 100;
        }
        return prev + 0.7 + Math.random() * 0.3; // ~2 min total journey
      });
      setEta(prev => Math.max(0, prev - 1));
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(interval);
  }, [isDelivered]);

  const destinationCity = shipment.deliveryAddress?.city || 'Destination';

  // Show delivered state
  if (isDelivered) {
    return (
      <div className={`rounded-2xl overflow-hidden shadow-xl ${isDark ? 'border border-green-500/50 bg-slate-800' : 'border border-green-300 bg-white'}`}>
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            🎉 Package Delivered!
          </h3>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your shipment has been delivered to {destinationCity}
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            📧 Delivery confirmation email with invoice sent!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl ${isDark ? 'border border-slate-700' : 'border border-slate-200'}`}>
      {/* Map Header - Google Maps style */}
      <div className={`px-5 py-4 flex items-center justify-between ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {isDelivering ? 'Completing delivery...' : 'Your delivery is on the way'}
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {vehiclePosition >= 95 ? 'Arriving now!' : `Arriving in ~${Math.max(1, Math.round(eta * (1 - vehiclePosition/100)))} mins`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>Live</span>
        </div>
      </div>

      {/* Google Maps Style Map */}
      <div className="relative h-56 sm:h-72" style={{ background: isDark ? '#1a1f2e' : '#e5e3df' }}>
        {/* Map base with road pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: isDark 
            ? `linear-gradient(90deg, transparent 49.5%, #2d3748 49.5%, #2d3748 50.5%, transparent 50.5%),
               linear-gradient(0deg, transparent 49.5%, #2d3748 49.5%, #2d3748 50.5%, transparent 50.5%)`
            : `linear-gradient(90deg, transparent 49.5%, #d1d5db 49.5%, #d1d5db 50.5%, transparent 50.5%),
               linear-gradient(0deg, transparent 49.5%, #d1d5db 49.5%, #d1d5db 50.5%, transparent 50.5%)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Main road - Google Maps blue route style */}
        <svg className="absolute inset-0" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid slice">
          {/* Road shadow */}
          <path
            d="M 40 180 C 120 180 140 80 220 90 C 300 100 320 160 400 140 C 440 130 460 100 480 95"
            fill="none"
            stroke={isDark ? '#1e293b' : '#9ca3af'}
            strokeWidth="18"
            strokeLinecap="round"
          />
          {/* Main road */}
          <path
            d="M 40 180 C 120 180 140 80 220 90 C 300 100 320 160 400 140 C 440 130 460 100 480 95"
            fill="none"
            stroke={isDark ? '#3b82f6' : '#4285f4'}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Traveled path highlight */}
          <path
            d="M 40 180 C 120 180 140 80 220 90 C 300 100 320 160 400 140 C 440 130 460 100 480 95"
            fill="none"
            stroke={isDark ? '#60a5fa' : '#4285f4'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${vehiclePosition * 5} 1000`}
            opacity="0.8"
          />
        </svg>

        {/* Origin marker - Google Maps red pin style */}
        <div className="absolute" style={{ left: '8%', top: '65%', transform: 'translate(-50%, -100%)' }}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500 -mt-1" />
            <div className={`mt-2 px-2 py-1 rounded shadow-md text-xs font-semibold ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
              {WAREHOUSE.city}
            </div>
          </div>
        </div>

        {/* Destination marker - Google Maps green pin */}
        <div className="absolute" style={{ right: '4%', top: '30%', transform: 'translate(50%, -100%)' }}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-green-500 -mt-1" />
            <div className={`mt-2 px-2 py-1 rounded shadow-md text-xs font-semibold ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
              {destinationCity}
            </div>
          </div>
        </div>

        {/* Moving delivery vehicle - pulsing blue dot like Google Maps */}
        <div 
          className="absolute transition-all duration-[4000ms] ease-linear"
          style={{ 
            left: `${8 + (vehiclePosition * 0.88)}%`,
            top: `${65 - (vehiclePosition * 0.35) + Math.sin(vehiclePosition / 15) * 8}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-14 h-14 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
            <div className="w-full h-full rounded-full bg-blue-500/30 animate-ping" />
          </div>
          {/* Vehicle icon */}
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/40 flex items-center justify-center border-4 border-white">
            <span className="text-xl">🚚</span>
          </div>
        </div>

        {/* ETA card overlay */}
        <div className={`absolute top-4 left-4 px-4 py-3 rounded-xl shadow-lg ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estimated arrival</p>
              <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{eta} min</p>
            </div>
          </div>
        </div>

        {/* Distance remaining */}
        <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-sm`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {Math.max(1, Math.round(15 * (1 - vehiclePosition / 100)))} km away
          </p>
        </div>
      </div>

      {/* Bottom info bar - Delivery partner */}
      <div className={`px-5 py-4 flex items-center gap-4 ${isDark ? 'bg-slate-800' : 'bg-white'} border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">👤</span>
        </div>
        <div className="flex-1">
          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>ShipSync Delivery Partner</p>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            📍 Heading to {destinationCity}
          </p>
        </div>
        <div className="flex gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
            📞
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            💬
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackShipment;
