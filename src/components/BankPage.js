import React, { useState, useMemo } from 'react';
import { db, addDoc, collection, deleteDoc, doc } from '../firebase';
import { Plus, Trash2, Users, Building2, TrendingUp, Wallet, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import DateFilter from './DateFilter';
import { DataContext } from './DataContext';

const BankPage = () => {
  const { user, bankDeposits, loading, error } = useContext(DataContext);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [depositor, setDepositor] = useState('');
  const [bank, setBank] = useState('');
  const [showAddDepositorModal, setShowAddDepositorModal] = useState(false);
  const [newDepositorName, setNewDepositorName] = useState('');
  const [depositors, setDepositors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    type: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const itemsPerPage = 8;

  const ugandanBanks = [
    'Stanbic Bank Uganda',
    'Centenary Bank',
    'DFCU Bank',
    'Equity Bank Uganda',
    'Standard Chartered Bank Uganda',
    'Absa Bank Uganda',
    'Cairo Bank Uganda',
    'Bank of Africa Uganda',
    'Orient Bank',
    'Post Bank Uganda',
  ];

  const bankOptions = useMemo(() => {
    return ugandanBanks.map((bankName) => ({
      id: bankName,
      name: bankName,
    }));
  }, []);

  // Update depositors based on bankDeposits
  useMemo(() => {
    if (bankDeposits && Array.isArray(bankDeposits)) {
      setDepositors([...new Set(bankDeposits.map((d) => d.depositor).filter(Boolean))]);
    }
  }, [bankDeposits]);

  const depositorColors = useMemo(() => {
    const colors = [
      'bg-blue-100 border-blue-200 text-blue-800',
      'bg-green-100 border-green-200 text-green-800',
      'bg-purple-100 border-purple-200 text-purple-800',
      'bg-orange-100 border-orange-200 text-orange-800',
      'bg-pink-100 border-pink-200 text-pink-800',
      'bg-indigo-100 border-indigo-200 text-indigo-800',
      'bg-yellow-100 border-yellow-200 text-yellow-800',
      'bg-red-100 border-red-200 text-red-800',
    ];
    
    const colorMap = {};
    depositors.forEach((depositor, index) => {
      colorMap[depositor] = colors[index % colors.length];
    });
    return colorMap;
  }, [depositors]);

  const depositorOptions = useMemo(() => {
    if (!depositors || !Array.isArray(depositors)) return [];
    return depositors.map((depositorName) => ({
      id: depositorName,
      name: depositorName,
    }));
  }, [depositors]);

  const filteredDeposits = useMemo(() => {
    return (bankDeposits || []).filter(deposit => {
      if (!deposit || deposit.isDepositorOnly) return false;
      
      if (!dateFilter.startDate || !dateFilter.endDate) return true;
      
      const depositDate = new Date(deposit.date);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      
      return depositDate >= startDate && depositDate <= endDate;
    });
  }, [bankDeposits, dateFilter]);

  const metrics = useMemo(() => {
    const validDeposits = filteredDeposits;
    const totalAmount = validDeposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
    const totalDeposits = validDeposits.length;
    const uniqueDepositors = new Set(validDeposits.map(d => d.depositor).filter(Boolean)).size;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthDeposits = validDeposits.filter(deposit => {
      const depositDate = new Date(deposit.date);
      return depositDate.getMonth() === currentMonth && depositDate.getFullYear() === currentYear;
    });
    const thisMonthAmount = thisMonthDeposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0);

    return {
      totalAmount,
      totalDeposits,
      uniqueDepositors,
      thisMonthAmount,
      thisMonthDeposits: thisMonthDeposits.length,
    };
  }, [filteredDeposits]);

  const sortedDeposits = useMemo(() => {
    return [...filteredDeposits].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredDeposits, sortBy, sortOrder]);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDeposits.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDeposits, currentPage]);

  const totalPages = Math.ceil(sortedDeposits.length / itemsPerPage);

  const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!amount || !date || !user || !depositor || !bank) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/bankDeposits`), {
        amount: parseFloat(amount),
        date,
        depositor,
        bank,
        createdAt: new Date().toISOString(),
      });
      setAmount('');
      setDate('');
      setDepositor('');
      setBank('');
    } catch (error) {
      console.error('Error adding deposit:', error);
    }
  };

  const handleDeleteDeposit = async (id) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/bankDeposits`, id));
    } catch (error) {
      console.error('Error deleting deposit:', error);
    }
  };

  const handleAddNewDepositor = async () => {
    if (!newDepositorName.trim() || !user) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/bankDeposits`), {
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        depositor: newDepositorName.trim(),
        bank: 'Stanbic Bank Uganda',
        createdAt: new Date().toISOString(),
        isDepositorOnly: true,
      });
      
      setDepositor(newDepositorName.trim());
      setNewDepositorName('');
      setShowAddDepositorModal(false);
    } catch (error) {
      console.error('Error adding depositor:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
        {error}
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-slate-600">Please log in to view bank deposits.</div>;
  }

  return (
    <div className="space-y-8 max-w-[100vw] overflow-x-hidden bg-white">
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
              Bank Deposits
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl leading-relaxed">
              Monitor your bank deposits, manage transactions, and track financial activities with our comprehensive platform.
            </p>
          </div>
        </div>
      </div>

      <DateFilter
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        showDateFilter={showDateFilter}
        setShowDateFilter={setShowDateFilter}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{dateFilter.type === 'all' ? 'Total Amount' : `Amount for ${dateFilter.type}`}</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">This Month</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.thisMonthAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Deposits</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.totalDeposits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Depositors</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.uniqueDepositors}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-4">Add New Deposit</h3>
        <form onSubmit={handleAddDeposit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (UGX)"
              className="p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <div className="relative">
              <AutocompleteInput
                options={depositorOptions}
                value={depositor}
                onChange={setDepositor}
                placeholder="Select or type depositor"
                allowNew={true}
                icon={<Users className="w-5 h-5 text-slate-400" />}
              />
              <button
                type="button"
                onClick={() => setShowAddDepositorModal(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Add new depositor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <AutocompleteInput
              options={bankOptions}
              value={bank}
              onChange={setBank}
              placeholder="Select bank"
              allowNew={false}
              icon={<Building2 className="w-5 h-5 text-slate-400" />}
            />
          </div>
          <button
            type="submit"
            disabled={!amount || !date || !depositor || !bank}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add Deposit
          </button>
        </form>
      </div>

      {showAddDepositorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Add New Depositor</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newDepositorName}
                onChange={(e) => setNewDepositorName(e.target.value)}
                placeholder="Depositor name"
                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddDepositorModal(false);
                    setNewDepositorName('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewDepositor}
                  disabled={!newDepositorName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Depositor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Deposits History</h3>
              <p className="text-slate-600">
                Showing {paginatedDeposits.length} of {sortedDeposits.length} deposits
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="depositor">Sort by Depositor</option>
                <option value="bank">Sort by Bank</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm hover:bg-slate-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {paginatedDeposits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg mb-2">
                {dateFilter.type !== 'all' ? 'No deposits found for selected period' : 'No deposits found'}
              </p>
              <p className="text-slate-400">
                {dateFilter.type !== 'all' ? 'Try adjusting your date filter' : 'Add your first deposit above to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    depositorColors[deposit.depositor] || 'bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">
                        {formatCurrency(deposit.amount)}
                      </div>
                      <div className="text-sm opacity-80">
                        {formatDate(deposit.date)}
                      </div>
                      <div className="text-sm font-medium">
                        {deposit.depositor}
                      </div>
                      <div className="text-xs opacity-70 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {deposit.bank}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDeposit(deposit.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors duration-200"
                      title="Delete deposit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankPage;