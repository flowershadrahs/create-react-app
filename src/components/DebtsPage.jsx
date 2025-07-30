import React, { useState, useContext, useRef } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, FileText } from 'lucide-react';
import DebtForm from './debts/DebtForm';
import SalesForm from './sales/SalesForm';
import DebtTable from './debts/DebtTable';
import SearchFilter from './debts/SearchFilter';
import DateFilter from './debts/DateFilter';
import DebtsReport from './debts/DebtsReport';
import { DataContext } from '../DataContext';
import { isToday } from 'date-fns';

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
  const reportRef = useRef(null);

  const handleDeleteDebt = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/debts`, id));
      } catch (err) {
        console.error('Error deleting debt:', err);
      }
    }
  };

  // Filter debts by product with exact match
  const strawDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name === 'Straws';
  });

  const toiletPaperDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name === 'Toilet Paper';
  });

  // Calculate totals
  const strawTotal = strawDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
  const toiletPaperTotal = toiletPaperDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);

  // Apply date and search filter
  const filteredDebts = debts.filter(debt => {
    const debtDate = debt.createdAt?.toDate ? debt.createdAt.toDate() : new Date(debt.createdAt);
    const matchesDate = dateFilter.type === 'all' || 
      (dateFilter.startDate && dateFilter.endDate && 
        debtDate >= new Date(dateFilter.startDate) && 
        debtDate <= new Date(dateFilter.endDate));
    const matchesSearch = debt.client.toLowerCase().includes(filter.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const handleGenerateReport = () => {
    if (reportRef.current) {
      reportRef.current.generateDebtsReport();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-2 py-2 rounded-lg flex items-center gap-2">
        {error}
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8 text-slate-600">Please log in to view debts.</div>;
  }

  return (
    <div className="space-y-4 w-full bg-white p-1">
      {/* Header Section */}
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Debts Management
            </h1>
            <p className="text-slate-600 text-sm">Track and manage outstanding debts</p>
          </div>
          
          {/* Generate Report Button */}
          <button
            onClick={handleGenerateReport}
            disabled={filteredDebts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium text-sm">Generate Report</span>
          </button>
        </div>
        
        <div className="mt-2">
          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showDateFilter={showDateFilter}
            setShowDateFilter={setShowDateFilter}
          />
        </div>
      </div>

      {/* Search Filter */}
      <SearchFilter
        filter={filter}
        setFilter={setFilter}
        filteredDebts={filteredDebts}
      />

      {/* Debt Tables */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-slate-800">Straw Debts</h2>
            <div className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
              {strawDebts.length} debt{strawDebts.length !== 1 ? 's' : ''}
            </div>
          </div>
          <DebtTable
            debts={strawDebts.filter(debt => 
              debt.client.toLowerCase().includes(filter.toLowerCase()) &&
              (dateFilter.type === 'all' || 
                (dateFilter.startDate && dateFilter.endDate && 
                  debt.createdAt?.toDate() >= new Date(dateFilter.startDate) && 
                  debt.createdAt?.toDate() <= new Date(dateFilter.endDate))
              )
            )}
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-slate-800">Toilet Paper Debts</h2>
            <div className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
              {toiletPaperDebts.length} debt{toiletPaperDebts.length !== 1 ? 's' : ''}
            </div>
          </div>
          <DebtTable
            debts={toiletPaperDebts.filter(debt => 
              debt.client.toLowerCase().includes(filter.toLowerCase()) &&
              (dateFilter.type === 'all' || 
                (dateFilter.startDate && dateFilter.endDate && 
                  debt.createdAt?.toDate() >= new Date(dateFilter.startDate) && 
                  debt.createdAt?.toDate() <= new Date(dateFilter.endDate))
              )
            )}
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

      {/* Hidden DebtsReport Component */}
      <div style={{ display: 'none' }}>
        <DebtsReport ref={reportRef} dateFilter={dateFilter} />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingDebt(null);
          setShowForm(true);
        }}
        className="fixed bottom-16 sm:bottom-20 right-2 bg-orange-600 text-white rounded-full p-3 shadow-lg hover:bg-orange-700 transition-all duration-200 hover:scale-110 z-[100]"
        title="Add New Debt"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Debt Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 overflow-y-auto">
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

      {/* Sales Form Modal */}
      {showSalesForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 overflow-y-auto">
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