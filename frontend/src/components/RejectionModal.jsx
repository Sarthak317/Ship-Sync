import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const REJECTION_REASONS = [
  'Invalid Date - The shipment date provided is incorrect or in the past',
  'Incorrect Quantity - The quantity specified does not match our records',
  'Product Unavailable - The requested product is currently out of stock',
  'Incomplete Information - Required details are missing from the request',
  'Duplicate Request - This shipment request already exists in our system'
];

const RejectionModal = ({ isOpen, onClose, onConfirm, shipment }) => {
  const { isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedReason) {
      alert('Please select a rejection reason');
      return;
    }
    onConfirm(selectedReason);
    setSelectedReason('');
    onClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl animate-fade-in ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Reject Shipment
              </h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {shipment?.trackingNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Select Rejection Reason <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-2">
            {REJECTION_REASONS.map((reason, index) => (
              <label
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedReason === reason
                    ? isDark 
                      ? 'bg-red-500/20 border-2 border-red-500' 
                      : 'bg-red-50 border-2 border-red-500'
                    : isDark
                      ? 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                      : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="rejection-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 w-4 h-4 text-red-500 focus:ring-red-500"
                />
                <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {reason}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              selectedReason
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-red-500/50 text-white/50 cursor-not-allowed'
            }`}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
