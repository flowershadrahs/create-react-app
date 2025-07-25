import React, { useState, useContext } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus } from 'lucide-react';
import DebtForm from './debts/DebtForm';
import SalesForm from './sales/SalesForm';
import DebtTable from './debts/DebtTable';
import SummaryCards from './debts/SummaryCards';
import SearchFilter from './debts/SearchFilter';
import DateFilter from './debts/DateFilter';
import { DataContext } from '../DataContext';

const DebtsPage = () => {
  const { user, debts, clients, sales, products, supplies, loading, error } = useContext(DataContext);
  const [showForm, setShowForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [filter, setFilter] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    type: 'all',
    startDate: null,
    endDate: null,
  });

  const handleDeleteDebt = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/debts`, id));
      } catch (err) {
        console.error('Error deleting debt:', err);
      }
    }
  };

  // Filter debts for straws
  const strawDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name.toLowerCase().includes('straw');
  });

  // Filter debts for toilet paper
  const toiletPaperDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name.toLowerCase().includes('toilet paper');
  });

  // Calculate totals
  const strawTotal = strawDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const toiletPaperTotal = toiletPaperDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0);

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
    return <div className="text-center py-12 text-slate-600">Please log in to view debts.</div>;
  }

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-auto bg-white p-6">
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
          Debts Management
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

      <SearchFilter
        filter={filter}
        setFilter={setFilter}
        filteredDebts={debts}
      />

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Straw Debts</h2>
          <DebtTable
            debts={strawDebts}
            sales={sales}
            setEditingDebt={setEditingDebt}
            setShowForm={setShowForm}
            setEditingSale={setEditingSale}
            setShowSalesForm={setShowSalesForm}
            handleDeleteDebt={handleDeleteDebt}
            loading={loading}
            total={strawTotal}
            showTotalAtTop
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Toilet Paper Debts</h2>
          <DebtTable
            debts={toiletPaperDebts}
            sales={sales}
            setEditingDebt={setEditingDebt}
            setShowForm={setShowForm}
            setEditingSale={setEditingSale}
            setShowSalesForm={setShowSalesForm}
            handleDeleteDebt={handleDeleteDebt}
            loading={loading}
            total={toiletPaperTotal}
            showTotalAtTop
          />
        </div>
      </div>

      <button
        onClick={() => {
          setEditingDebt(null);
          setShowForm(true);
        }}
        className="fixed bottom-20 sm:bottom-24 right-6 bg-orange-600 text-white rounded-full p-4 shadow-lg hover:bg-orange-700 transition-all duration-200 hover:scale-110 z-[100]"
      >
        <Plus className="w-6 h-6" />
      </button>

      <SummaryCards
        filteredDebts={debts}
        dateFilter={dateFilter}
        loading={loading}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <DebtForm
              debt={editingDebt}
              onClose={() => {
                setShowForm(false);
                setEditingDebt(null);
              }}
            />
          </div>
        </div>
      )}

      {showSalesForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <SalesForm
              sale={editingSale}
              clients={clients}
              products={products}
              supplies={supplies}
              onClose={() => {
                setShowSalesForm(false);
                setEditingSale(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;