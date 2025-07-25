import React, { useState, useContext } from 'react';
import { Plus } from 'lucide-react';
import BankDepositForm from './BankDepositForm'; // Hypothetical component
import BankDepositTable from './BankDepositTable'; // Hypothetical component
import DateFilter from './DateFilter'; // Reusing DateFilter from other pages
import { DataContext } from './DataContext';

const BankPage = () => {
  const { user, bankDeposits, loading, error } = useContext(DataContext);
  const [showForm, setShowForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    type: 'all',
    startDate: null,
    endDate: null,
  });

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
    <div className="space-y-6 max-w-[100vw] overflow-x-auto bg-white p-6">
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
          Bank Deposits
        </h1>
        <div className="mt-4">
          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showDateFilter={showDateFilter}
            setShowDateFilter={setShowDateFilter}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Deposit Transactions</h2>
          <p className="text-slate-600">Record of all bank deposit activities ({bankDeposits.length} records)</p>
        </div>
        <div className="p-6">
          <BankDepositTable
            deposits={bankDeposits}
            setEditingDeposit={setEditingDeposit}
            setShowForm={setShowForm}
            dateFilter={dateFilter}
          />
        </div>
      </div>

      <button
        onClick={() => {
          setEditingDeposit(null);
          setShowForm(true);
        }}
        className="fixed bottom-20 sm:bottom-24 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-[100]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <BankDepositForm
              deposit={editingDeposit}
              onClose={() => {
                setShowForm(false);
                setEditingDeposit(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BankPage;