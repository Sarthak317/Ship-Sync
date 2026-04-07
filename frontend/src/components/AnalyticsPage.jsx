import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Package, ShoppingBag, Layers, ArrowLeft } from 'lucide-react';
import Header from './layout/Header';
import { useTheme } from '../context/ThemeContext';

const AnalyticsPage = ({ shipments, onBack }) => {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState(30); // 7, 30, or 90 days

  // Filter shipments by time range
  const filteredShipments = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - timeRange));
    
    return shipments.filter(shipment => {
      const shipmentDate = shipment.createdAt?.toDate?.() || new Date(shipment.shipmentDate);
      return shipmentDate >= cutoffDate;
    });
  }, [shipments, timeRange]);

  // Calculate shipments over time (for simple visualization)
  const shipmentsOverTime = useMemo(() => {
    const dataMap = {};
    
    filteredShipments.forEach(shipment => {
      const date = shipment.createdAt?.toDate?.() || new Date(shipment.shipmentDate);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = 0;
      }
      dataMap[dateKey]++;
    });

    return Object.keys(dataMap).map(date => ({
      date,
      shipments: dataMap[date]
    })).slice(-10);
  }, [filteredShipments]);

  // Brand distribution
  const brandDistribution = useMemo(() => {
    const brandMap = {};
    
    filteredShipments.forEach(shipment => {
      const brand = shipment.brand || 'Unknown';
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });

    return Object.keys(brandMap).map(brand => ({
      name: brand,
      value: brandMap[brand],
      percentage: ((brandMap[brand] / filteredShipments.length) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value);
  }, [filteredShipments]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = {};
    
    filteredShipments.forEach(shipment => {
      const category = shipment.category || 'Unknown';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    return Object.keys(categoryMap).map(category => ({
      name: category,
      shipments: categoryMap[category],
      percentage: ((categoryMap[category] / filteredShipments.length) * 100).toFixed(1)
    }));
  }, [filteredShipments]);

  // Calculate trend
  const trend = useMemo(() => {
    const currentPeriodCount = filteredShipments.length;
    
    const now = new Date();
    const previousCutoff = new Date(now.setDate(now.getDate() - (timeRange * 2)));
    const previousPeriodEnd = new Date(now.setDate(now.getDate() + timeRange));
    
    const previousPeriodShipments = shipments.filter(shipment => {
      const shipmentDate = shipment.createdAt?.toDate?.() || new Date(shipment.shipmentDate);
      return shipmentDate >= previousCutoff && shipmentDate < previousPeriodEnd;
    });

    const previousCount = previousPeriodShipments.length;
    
    if (previousCount === 0) return { percentage: 0, isPositive: true };
    
    const percentage = ((currentPeriodCount - previousCount) / previousCount * 100).toFixed(1);
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage >= 0
    };
  }, [filteredShipments, shipments, timeRange]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const statusMap = {
      'Pending': 0,
      'In Transit': 0,
      'Delivered': 0
    };
    
    filteredShipments.forEach(shipment => {
      if (statusMap.hasOwnProperty(shipment.status)) {
        statusMap[shipment.status]++;
      }
    });

    return Object.keys(statusMap).map(status => ({
      name: status,
      count: statusMap[status],
      percentage: filteredShipments.length > 0 
        ? ((statusMap[status] / filteredShipments.length) * 100).toFixed(1)
        : 0
    }));
  }, [filteredShipments]);

  const COLORS = {
    'Pending': '#f59e0b',
    'In Transit': '#06b6d4',
    'Delivered': '#10b981'
  };

  const maxShipments = Math.max(...shipmentsOverTime.map(d => d.shipments), 1);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <Header />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/10'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-float-delayed ${isDark ? 'bg-teal-500/5' : 'bg-teal-500/10'}`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`mb-6 flex items-center gap-2 transition-colors duration-200 group ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header with Time Range Selector */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Analytics Dashboard</h1>
              <p className={`text-lg font-light ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Performance insights and trends</p>
            </div>
          </div>

          {/* Time Range Buttons */}
          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
            <Calendar className={`w-4 h-4 ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  timeRange === days
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {/* Trend Indicator Card */}
        <div className={`backdrop-blur-sm rounded-2xl p-8 shadow-2xl mb-8 animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Shipments (Last {timeRange} days)</p>
              <p className={`text-5xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{filteredShipments.length}</p>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Out of {shipments.length} total shipments</p>
            </div>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl ${
              trend.isPositive ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
              <div>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>vs previous period</p>
                <span className={`text-2xl font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {trend.isPositive ? '+' : '-'}{trend.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Shipments Over Time - Simple Bar Visualization */}
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-emerald-500" />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Shipments Over Time</h3>
            </div>
            {shipmentsOverTime.length > 0 ? (
              <div className="space-y-3">
                {shipmentsOverTime.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.date}</span>
                      <span className="text-sm font-semibold text-emerald-500">{item.shipments}</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/50"
                        style={{ width: `${(item.shipments / maxShipments) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No shipment data available
              </div>
            )}
          </div>

          {/* Brand Distribution */}
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.3s'}}>
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-cyan-500" />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Brand Distribution</h3>
            </div>
            {brandDistribution.length > 0 ? (
              <div className="space-y-4">
                {brandDistribution.map((brand, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{brand.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{brand.value}</span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({brand.percentage}%)</span>
                      </div>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`}>
                      <div 
                        className="h-full rounded-full transition-all duration-500 group-hover:shadow-lg"
                        style={{ 
                          width: `${brand.percentage}%`,
                          backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'][index % 6]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`h-64 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No brand data available
              </div>
            )}
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-5 h-5 text-amber-500" />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Category Breakdown</h3>
            </div>
            {categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {categoryBreakdown.map((category, index) => (
                  <div 
                    key={index} 
                    className={`rounded-xl p-4 border hover:border-emerald-500/50 transition-all duration-200 hover:shadow-lg group ${isDark ? 'bg-slate-700/30 border-slate-600/50' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{category.name}</p>
                    <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{category.shipments}</p>
                    <p className="text-emerald-500 text-sm font-semibold">{category.percentage}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`h-48 flex items-center justify-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No category data available
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-2xl animate-fade-in-up transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-white/80 border border-slate-200'}`} style={{animationDelay: '0.5s'}}>
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-purple-500" />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Status Overview</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {statusBreakdown.map((status, index) => (
                <div 
                  key={index}
                  className={`rounded-xl p-4 border hover:shadow-lg transition-all duration-200 group ${isDark ? 'bg-slate-700/30 border-slate-600/50' : 'bg-slate-50 border-slate-200'}`}
                  style={{ borderColor: `${COLORS[status.name]}40` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mb-3"
                    style={{ backgroundColor: COLORS[status.name] }}
                  ></div>
                  <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{status.name}</p>
                  <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{status.count}</p>
                  <p className="text-sm font-semibold" style={{ color: COLORS[status.name] }}>
                    {status.percentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;