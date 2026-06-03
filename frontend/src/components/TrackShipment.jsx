import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Truck, CheckCircle, Clock, Navigation, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { WAREHOUSE, STATUS_FLOW, getStatusIndex, getProgressPercentage, STATE_COORDINATES } from '../utils/warehouseConfig';
import { db } from '../firebase/config';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { sendDeliveryEmail } from '../utils/emailService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Live Tracking Map Component (when Out for Delivery) - Leaflet Map Integration
const LiveTrackingMap = ({ shipment, isDark }) => {
  const [vehiclePosition, setVehiclePosition] = useState(15); // Start at 15%
  const [isDelivered, setIsDelivered] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const deliveryTriggered = useRef(false);

  // Dynamically calculate remaining KMS and ETA based on vehicle position (keeps them perfectly in sync)
  const remainingKms = Math.max(0, Math.round(45 * (1 - vehiclePosition / 100)));
  const remainingEta = Math.max(1, Math.round(25 * (1 - vehiclePosition / 100)));

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const truckMarkerRef = useRef(null);

  // Get coordinates for origin (Gurgaon) and destination (state coordinates)
  const origin = WAREHOUSE.coordinates; // { lat: 28.4595, lng: 77.0266 }
  const destinationState = shipment.deliveryAddress?.state || 'Delhi';
  const destination = STATE_COORDINATES[destinationState] || STATE_COORDINATES['Delhi'];

  // Custom Leaflet markers using DivIcon (fully responsive HTML/SVG, avoids Vite bundle path issues)
  const warehouseIcon = L.divIcon({
    html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;"><span style="font-size: 16px;">🏢</span></div>`,
    className: 'custom-div-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const destinationIcon = L.divIcon({
    html: `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;"><span style="font-size: 16px;">📍</span></div>`,
    className: 'custom-div-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const truckIcon = L.divIcon({
    html: `<div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.7); display: flex; align-items: center; justify-content: center; position: relative;"><span style="font-size: 22px; transform: scaleX(-1); display: inline-block;">🚚</span></div>`,
    className: 'custom-div-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

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

  // Simulate vehicle movement - ~2 minutes for demo
  useEffect(() => {
    if (isDelivered) return;
    
    const interval = setInterval(() => {
      setVehiclePosition(prev => {
        if (prev >= 95) {
          triggerDelivery();
          return 100;
        }
        return prev + 1.0 + Math.random() * 0.5; // Slightly faster for Leaflet maps to look active
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isDelivered]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      // Create map instance
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true
      }).setView([20.5937, 78.9629], 5);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add Gurgaon Warehouse origin marker
      L.marker([origin.lat, origin.lng], { icon: warehouseIcon })
        .bindPopup(`<b>Origin:</b> ${WAREHOUSE.name}<br/>Sector 44, Gurgaon`)
        .addTo(mapRef.current);

      // Add Destination marker
      L.marker([destination.lat, destination.lng], { icon: destinationIcon })
        .bindPopup(`<b>Destination:</b> ${shipment.deliveryAddress?.city || destinationState}`)
        .addTo(mapRef.current);

      // Draw polyline connecting origin and destination
      L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 8'
      }).addTo(mapRef.current);

      // Fit map to show both markers with some padding
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        truckMarkerRef.current = null;
      }
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Update truck position marker dynamically on the map
  useEffect(() => {
    if (!mapRef.current) return;

    // Linearly interpolate coordinates along the path
    const currentLat = origin.lat + (destination.lat - origin.lat) * (vehiclePosition / 100);
    const currentLng = origin.lng + (destination.lng - origin.lng) * (vehiclePosition / 100);

    if (!truckMarkerRef.current) {
      truckMarkerRef.current = L.marker([currentLat, currentLng], { icon: truckIcon })
        .bindPopup('<b>ShipSync Delivery Truck</b><br/>In Transit')
        .addTo(mapRef.current);
    } else {
      truckMarkerRef.current.setLatLng([currentLat, currentLng]);
    }
  }, [vehiclePosition, origin.lat, origin.lng, destination.lat, destination.lng]);

  const destinationCity = shipment.deliveryAddress?.city || 'Destination';

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
            Your shipment has been delivered to {destinationCity} ({destinationState})
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
              {vehiclePosition >= 95 ? 'Arriving now!' : `Arriving in ~${remainingEta} mins`}
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

      {/* Actual Interactive Leaflet Map container */}
      <div className={`relative h-64 sm:h-80 w-full dark-map`}>
        <div ref={mapContainerRef} className="h-full w-full z-10" />

        {/* ETA card overlay */}
        <div className={`absolute top-4 left-4 px-4 py-3 rounded-xl shadow-lg ${isDark ? 'bg-slate-800/95 border border-slate-700' : 'bg-white/95 border border-slate-200'} backdrop-blur-sm z-30`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estimated arrival</p>
              <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{vehiclePosition >= 95 ? 'Arriving' : `${remainingEta} mins`}</p>
            </div>
          </div>
        </div>

        {/* Distance remaining */}
        <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${isDark ? 'bg-slate-800/95 border border-slate-700' : 'bg-white/95 border border-slate-200'} backdrop-blur-sm z-30`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {vehiclePosition >= 95 ? 'Arrived' : `${remainingKms} km remaining`}
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
            📍 Heading to {destinationCity}, {destinationState}
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
