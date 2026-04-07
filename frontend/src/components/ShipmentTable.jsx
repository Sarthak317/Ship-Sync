import React, { useState } from 'react';
import { Package, Search, Filter, ArrowUpDown, Sparkles, Download } from 'lucide-react';
import ShipmentRow from './ShipmentRow';
import { useTheme } from '../context/ThemeContext';

// Export to CSV function
const exportToCSV = (shipments, filename = 'shipments') => {
  if (shipments.length === 0) {
    alert('No shipments to export!');
    return;
  }

  // Define CSV headers
  const headers = [
    'Tracking Number',
    'Brand',
    'Category',
    'Clothing Type',
    'Size',
    'Age Group',
    'Quantity',
    'Phone Number',
    'Shipment Date',
    'Status',
    'User Email',
    'Created At'
  ];

  // Convert shipments to CSV rows
  const rows = shipments.map(shipment => [
    shipment.trackingNumber || '',
    shipment.brand || '',
    shipment.category || '',
    shipment.clothingType || '',
    shipment.size || '',
    shipment.age || '',
    shipment.quantity || '',
    shipment.phoneNumber || '',
    shipment.shipmentDate || '',
    shipment.status || '',
    shipment.userEmail || '',
    shipment.createdAt?.toDate?.() 
      ? shipment.createdAt.toDate().toLocaleString() 
      : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ShipmentTable = ({ shipments, onUpdateStatus, onDeleteShipment, onRejectClick, readOnly = false }) => {
  const { isDark } = useTheme();
  // Table state management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('shipmentDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter shipments based on search term and status
  const filteredShipments = shipments.filter(shipment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      shipment.trackingNumber.toLowerCase().includes(searchLower) ||
      (shipment.brand && shipment.brand.toLowerCase().includes(searchLower)) ||
      (shipment.category && shipment.category.toLowerCase().includes(searchLower)) ||
      (shipment.clothingType && shipment.clothingType.toLowerCase().includes(searchLower)) ||
      (shipment.size && shipment.size.toLowerCase().includes(searchLower)) ||
      (shipment.age && shipment.age.toLowerCase().includes(searchLower)) ||
      (shipment.customerName && shipment.customerName.toLowerCase().includes(searchLower)) ||
      (shipment.productName && shipment.productName.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort filtered shipments
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle date sorting
    if (sortField === 'shipmentDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSortField('shipmentDate');
    setSortDirection('desc');
  };

  return (
    <div className={`backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.6s'}}>
      {/* Table Header */}
      <div className={`p-6 border-b ${isDark ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Shipment Registry
                <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ({filteredShipments.length} of {shipments.length})
                </span>
              </h2>
              <p className={`text-sm font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track and manage all logistics bookings</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Export CSV Button */}
            <button
              onClick={() => exportToCSV(sortedShipments, 'shipments_export')}
              className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30' : 'text-blue-600 hover:text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30'}`}
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'All') && (
              <button
                onClick={clearFilters}
                className="text-sm text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative group">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-hover:text-emerald-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search by tracking, brand, category, size, age..."
              className={`w-full pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-300 ${isDark ? 'bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 hover:border-slate-600' : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400 hover:border-slate-400'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative group">
            <Filter className="w-4 h-4 absolute left-4 top-4 text-slate-400 group-hover:text-emerald-500 transition-colors duration-200 pointer-events-none" />
            <select
              className={`pl-12 pr-10 py-4 rounded-xl appearance-none min-w-48 transition duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer ${isDark ? 'bg-slate-900/50 border border-slate-700 text-white hover:border-slate-600' : 'bg-white border border-slate-300 text-slate-800 hover:border-slate-400'}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
          {/* Table Header */}
          <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
            <tr>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('trackingNumber')}
              >
                <div className="flex items-center gap-1">
                  Tracking
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('trackingNumber')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('brand')}
              >
                <div className="flex items-center gap-1">
                  Brand
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('brand')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('category')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('clothingType')}
              >
                <div className="flex items-center gap-1">
                  Type
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('clothingType')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center gap-1">
                  Size
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('size')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-1">
                  Age
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('age')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center gap-1">
                  Qty
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('quantity')}</span>
                </div>
              </th>
              <th
                className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer transition duration-200 group ${isDark ? 'text-slate-300 hover:bg-slate-700/30' : 'text-slate-600 hover:bg-slate-100'}`}
                onClick={() => handleSort('shipmentDate')}
              >
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className={`w-3 h-3 group-hover:text-emerald-500 transition-colors duration-200 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className="text-emerald-500">{getSortIndicator('shipmentDate')}</span>
                </div>
              </th>
              <th className={`px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Status
              </th>
              <th className={`px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Actions
              </th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className={`divide-y ${isDark ? 'divide-slate-700/30' : 'divide-slate-100'}`}>
            {sortedShipments.length > 0 ? (
              sortedShipments.map((shipment) => (
                <ShipmentRow
                  key={shipment.id}
                  shipment={shipment}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteShipment={onDeleteShipment}
                  onRejectClick={onRejectClick}
                  isDark={isDark}
                  readOnly={readOnly}
                />
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      <div className={`absolute inset-0 blur-2xl ${isDark ? 'bg-slate-600/20' : 'bg-slate-300/30'}`}></div>
                      <Package className={`w-20 h-20 relative ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {searchTerm || statusFilter !== 'All' 
                        ? 'No matching shipments found' 
                        : 'No shipments yet'}
                    </h3>
                    <p className={`font-light ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search or filters'
                        : 'Book your first shipment using the form above'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShipmentTable;