import React from "react";
import { format, parseISO } from "date-fns";
import { Calendar, X, Filter } from "lucide-react";

const DateFilter = ({ dateFilter, setDateFilter, showDateFilter, setShowDateFilter }) => {
  const handleDateFilterChange = (type) => {
    const today = new Date().toISOString().split("T")[0];
    setDateFilter(prev => ({
      ...prev,
      type,
      startDate: type === 'custom' ? prev.startDate : (type === 'today' ? today : ''),
      endDate: type === 'custom' ? prev.endDate : (type === 'today' ? today : '')
    }));
    if (type !== 'custom') {
      setShowDateFilter(false);
    }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter.type) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return dateFilter.startDate && dateFilter.endDate 
          ? `${format(parseISO(dateFilter.startDate), 'MMM dd')} - ${format(parseISO(dateFilter.endDate), 'MMM dd')}`
          : 'Custom Range';
      default:
        return 'All Time';
    }
  };

  const getFilterBadgeColor = () => {
    switch (dateFilter.type) {
      case 'today':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'week':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'month':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'custom':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg border border-white/20 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            dateFilter.type !== 'all' 
              ? `${getFilterBadgeColor()} text-white` 
              : 'bg-white text-slate-700 hover:bg-gray-50'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            {dateFilter.type !== 'all' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-75 font-medium">Filter</span>
            <span className="text-sm font-bold">{getDateFilterLabel()}</span>
          </div>
        </button>
      </div>
      
      {showDateFilter && (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 mb-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                Date Filter
              </h4>
              <button
                onClick={() => setShowDateFilter(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDateFilterChange('all')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  dateFilter.type === 'all'
                    ? 'bg-slate-100 text-slate-800 shadow-md border-2 border-slate-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleDateFilterChange('today')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  dateFilter.type === 'today'
                    ? 'bg-blue-100 text-blue-800 shadow-md border-2 border-blue-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilterChange('week')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  dateFilter.type === 'week'
                    ? 'bg-emerald-100 text-emerald-800 shadow-md border-2 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleDateFilterChange('month')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  dateFilter.type === 'month'
                    ? 'bg-purple-100 text-purple-800 shadow-md border-2 border-purple-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-purple-50 border border-slate-200'
                }`}
              >
                This Month
              </button>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => handleDateFilterChange('custom')}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 mb-4 ${
                  dateFilter.type === 'custom'
                    ? 'bg-orange-100 text-orange-800 shadow-md border-2 border-orange-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-orange-50 border border-slate-200'
                }`}
              >
                Custom Date Range
              </button>
              
              {dateFilter.type === 'custom' && (
                <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">From Date</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">To Date</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowDateFilter(false)}
              className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition-all duration-200 hover:shadow-lg"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;