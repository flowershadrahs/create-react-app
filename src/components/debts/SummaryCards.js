import React from "react";
import { Users, TrendingUp, TrendingDown, DollarSign, Clock, Calendar, CreditCard } from "lucide-react";
import { differenceInDays } from "date-fns";
import Skeleton from 'react-loading-skeleton';
import { DataContext } from '../../DataContext';

const SummaryCards = ({ filteredDebts, dateFilter, loading, strawDebtsPaidToday, toiletPaperDebtsPaidToday }) => {
  const { products } = useContext(DataContext);

  const summaryMetrics = React.useMemo(() => {
    // Filter debts by product
    const strawDebts = filteredDebts.filter(debt => {
      const product = products.find(p => p.id === debt.productId);
      return product?.name === 'Straws';
    });
    const toiletPaperDebts = filteredDebts.filter(debt => {
      const product = products.find(p => p.id === debt.productId);
      return product?.name === 'Toilet Paper';
    });

    // Calculate metrics
    const activeDebts = filteredDebts.filter((debt) => parseFloat(debt.amount) > 0);
    const paidDebts = filteredDebts.filter((debt) => parseFloat(debt.amount) === 0);
    const totalDebts = filteredDebts.length;
    const totalAmountOwed = activeDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);

    const highestDebt = activeDebts.length > 0
      ? activeDebts.reduce((max, debt) => (parseFloat(debt.amount) > parseFloat(max.amount) ? debt : max), activeDebts[0])
      : null;

    const oldestDebt = activeDebts.length > 0
      ? activeDebts.reduce((oldest, debt) => {
          const debtDate = debt.createdAt?.toDate ? debt.createdAt.toDate() : new Date(debt.createdAt);
          const oldestDate = oldest.createdAt?.toDate ? oldest.createdAt.toDate() : new Date(oldest.createdAt);
          return debtDate && oldestDate && debtDate < oldestDate ? debt : oldest;
        }, activeDebts[0])
      : null;

    const daysSinceOldest = oldestDebt?.createdAt
      ? differenceInDays(new Date(), oldestDebt.createdAt.toDate ? oldestDebt.createdAt.toDate() : new Date(oldestDebt.createdAt))
      : 0;

    const strawPaidTodayTotal = strawDebtsPaidToday.reduce((sum, debt) => sum + (parseFloat(debt.lastPaidAmount) || 0), 0);
    const toiletPaperPaidTodayTotal = toiletPaperDebtsPaidToday.reduce((sum, debt) => sum + (parseFloat(debt.lastPaidAmount) || 0), 0);

    return {
      totalDebts,
      activeDebts: activeDebts.length,
      paidDebts: paidDebts.length,
      totalAmountOwed,
      highestDebt,
      oldestDebt,
      daysSinceOldest,
      strawPaidTodayTotal,
      toiletPaperPaidTodayTotal,
    };
  }, [filteredDebts, strawDebtsPaidToday, toiletPaperDebtsPaidToday, products]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton height={40} width={40} borderRadius={8} />
              <Skeleton height={16} width={60} />
            </div>
            <Skeleton height={28} width="80%" className="mb-2" />
            <Skeleton height={16} width="100%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
            {dateFilter.type === 'all' ? 'Total' : dateFilter.type.charAt(0).toUpperCase() + dateFilter.type.slice(1)}
          </span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">{summaryMetrics.totalDebts}</div>
        <p className="text-sm text-neutral-600">
          {dateFilter.type === 'all' ? 'Total Debts' : `Debts for ${dateFilter.type}`}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">Active</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">{summaryMetrics.activeDebts}</div>
        <p className="text-sm text-neutral-600">Pending Debts</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">Amount</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">
          {summaryMetrics.totalAmountOwed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX
        </div>
        <p className="text-sm text-neutral-600">
          {dateFilter.type === 'all' ? 'Total Amount Owed' : `Amount Owed for ${dateFilter.type}`}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <TrendingDown className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Paid</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">{summaryMetrics.paidDebts}</div>
        <p className="text-sm text-neutral-600">Paid Debts</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">Highest</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">
          {summaryMetrics.highestDebt ? `${parseFloat(summaryMetrics.highestDebt.amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX` : '0 UGX'}
        </div>
        <p className="text-sm text-neutral-600 truncate">
          {summaryMetrics.highestDebt ? summaryMetrics.highestDebt.client || 'Unknown Client' : 'No debts'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">Oldest</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">{summaryMetrics.daysSinceOldest} days</div>
        <p className="text-sm text-neutral-600 truncate">
          {summaryMetrics.oldestDebt ? summaryMetrics.oldestDebt.client || 'Unknown Client' : 'No debts'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Straws Paid Today</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">
          {summaryMetrics.strawPaidTodayTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX
        </div>
        <p className="text-sm text-neutral-600">
          {strawDebtsPaidToday.length} debt{strawDebtsPaidToday.length !== 1 ? 's' : ''} paid today
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Toilet Paper Paid Today</span>
        </div>
        <div className="text-2xl font-bold text-neutral-800 mb-1">
          {summaryMetrics.toiletPaperPaidTodayTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX
        </div>
        <p className="text-sm text-neutral-600">
          {toiletPaperDebtsPaidToday.length} debt{toiletPaperDebtsPaidToday.length !== 1 ? 's' : ''} paid today
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;