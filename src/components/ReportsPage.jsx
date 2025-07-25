import React, { useState, useContext } from 'react';
import { format, startOfDay } from 'date-fns';
import DateFilter from './reports/DateFilter';
import PDFGenerator from './reports/PDFGenerator';
import { DataContext } from './DataContext';

const ReportsPage = () => {
  const { user, sales, debts, expenses, clients, products, categories, bankDeposits, supplies, loading, error } = useContext(DataContext);
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const [dateFilter, setDateFilter] = useState({
    type: 'today',
    startDate: today,
    endDate: today,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const safeData = {
    sales: Array.isArray(sales) ? sales : [],
    debts: Array.isArray(debts) ? debts : [],
    expenses: Array.isArray(expenses) ? expenses : [],
    bankDeposits: Array.isArray(bankDeposits) ? bankDeposits : [],
    supplies: Array.isArray(supplies) ? supplies : [],
  };

  const safeClients = Array.isArray(clients) ? clients : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[100vw] overflow-x-auto bg-white p-6">
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl leading-relaxed">
            Generate comprehensive reports to analyze your business performance across sales, debts, expenses, and bank deposits.
          </p>
        </div>
      </div>

      <DateFilter
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        showDateFilter={showDateFilter}
        setShowDateFilter={setShowDateFilter}
      />

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Generate Consolidated Report</h2>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>{error}</p>
          </div>
        )}
        {user ? (
          <PDFGenerator
            reportType="consolidated"
            dateFilter={dateFilter}
            data={safeData}
            clients={safeClients}
            products={safeProducts}
            categories={safeCategories}
            userId={user.uid}
            setError={(err) => console.error(err)}
          />
        ) : (
          <div className="text-center py-12 text-slate-600">Please log in to generate reports.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;