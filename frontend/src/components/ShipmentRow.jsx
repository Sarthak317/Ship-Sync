import React from 'react';
import { Truck, CheckCircle, Clock, Trash2, ArrowRight, XCircle, ClipboardCheck } from 'lucide-react';

const ShipmentRow = ({ shipment, onUpdateStatus, onDeleteShipment, onRejectClick, isDark = true, readOnly = false }) => {
  // Get status icon based on current status
 const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending Approval':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'Approved':
        return <ClipboardCheck className="w-4 h-4 text-blue-400" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'In Transit':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get status badge styling
   const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Approval':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-amber-500/20';
      case 'Approved':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-blue-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-300 border-red-500/30 shadow-red-500/20';
      case 'In Transit':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-cyan-500/20';
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  // Determine next status in workflow
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending Approval':
        return 'Approved';
      case 'Approved':
        return 'In Transit';
      case 'In Transit':
        return 'Delivered';
      default:
        return currentStatus;
    }
  };

  // Check if status can be advanced
  const canAdvanceStatus = shipment.status !== 'Delivered' && shipment.status !== 'Rejected';

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete shipment ${shipment.trackingNumber}?`)) {
      onDeleteShipment(shipment.id);
    }
  };

  // Handle old vs new data format
  const displayBrand = shipment.brand || 'N/A';
  const displayCategory = shipment.category || (shipment.customerName ? `Customer: ${shipment.customerName}` : 'N/A');
  const displayProduct = shipment.clothingType || shipment.productName || 'N/A';
  const displaySize = shipment.size || '-';
  const displayAge = shipment.age || '-';
  const displayQuantity = shipment.quantity || '-';

  return (
    <tr className={`group transition duration-200 ${isDark ? 'hover:bg-slate-800/40 border-b border-slate-700/30' : 'hover:bg-slate-50 border-b border-slate-100'}`}>
      {/* Tracking Number */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`font-mono text-xs px-2 py-1 rounded-md border group-hover:border-emerald-500/50 transition-colors duration-200 ${isDark ? 'bg-slate-700/50 text-slate-300 border-slate-600/50' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {shipment.trackingNumber}
        </span>
      </td>

      {/* Brand */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{displayBrand}</span>
      </td>

      {/* Category */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{displayCategory}</span>
      </td>

      {/* Product/Clothing Type */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{displayProduct}</span>
      </td>

      {/* Size */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-xs font-medium text-cyan-500">{displaySize}</span>
      </td>

      {/* Age */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-xs font-medium text-purple-500">{displayAge}</span>
      </td>

      {/* Quantity */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-xs font-semibold text-emerald-500">{displayQuantity}</span>
      </td>

      {/* Shipment Date */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(shipment.shipmentDate)}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {getStatusIcon(shipment.status)}
          <span className={`px-2 py-1 inline-flex text-[10px] font-semibold rounded-md border shadow-sm ${getStatusColor(shipment.status)}`}>
            {shipment.status}
          </span>
        </div>
      </td>
      
      {/* Actions */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {/* Status Update Buttons - Only shown when NOT readOnly (admin only) */}
          {!readOnly && (
            <>
              {/* Special buttons for Pending Approval status */}
              {shipment.status === 'Pending Approval' ? (
                <>
                  {/* Approve Button */}
                  <button
                    onClick={() => onUpdateStatus(shipment.id, 'Approved')}
                    className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg transition duration-200 border border-emerald-500/30 hover:border-emerald-500/50 group/btn"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                  </button>
                  {/* Reject Button - Opens Modal */}
                  <button
                    onClick={() => onRejectClick ? onRejectClick(shipment) : onUpdateStatus(shipment.id, 'Rejected')}
                    className="text-orange-500 hover:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 p-2 rounded-lg transition duration-200 border border-orange-500/30 hover:border-orange-500/50 group/btn"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
                  </button>
                </>
              ) : canAdvanceStatus ? (
                <button
                  onClick={() => onUpdateStatus(shipment.id, getNextStatus(shipment.status))}
                  className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg transition duration-200 border border-emerald-500/30 hover:border-emerald-500/50 group/btn"
                  title={getNextStatus(shipment.status)}
                >
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
                </button>
              ) : (
                <span className="text-emerald-500 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30" title="Completed">
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
            </>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition duration-200 border border-red-500/30 hover:border-red-500/50 group/del"
            title="Delete shipment"
          >
            <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ShipmentRow;