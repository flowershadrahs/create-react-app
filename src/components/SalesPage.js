// SalesPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { Plus, User, Package, Truck } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";
import SalesForm from "./sales/SalesForm";
import SuppliesForm from "./SuppliesForm";
import DateFilter from "./DateFilter";
import ClientForm from "./ClientForm";
import ProductForm from "./ProductForm";
import SalesTable from "./SalesTable";
import { startOfDay, endOfDay, isWithinInterval, parseISO, format, startOfWeek, startOfMonth } from "date-fns";
import { DataContext } from "../DataContext";

const SalesPage = () => {
  const { user, sales, clients, products, supplies, loading, error } = useContext(DataContext);
  const [showForm, setShowForm] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    type: 'today',
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [newSupply, setNewSupply] = useState({
    productId: "",
    supplyType: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });

  const getMostRecentSalesDate = () => {
    if (!sales || sales.length === 0) return new Date().toISOString().split("T")[0];
    const salesDates = sales
      .map(sale => sale.date?.toDate ? sale.date.toDate() : new Date(sale.date))
      .filter(date => date !== null)
      .sort((a, b) => b - a);
    return salesDates.length ? format(salesDates[0], 'yyyy-MM-dd') : new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    if (sales?.length) {
      const mostRecentDate = getMostRecentSalesDate();
      setDateFilter(prev => ({
        ...prev,
        type: 'specific',
        startDate: mostRecentDate,
        endDate: mostRecentDate,
      }));
    }
  }, [sales]);

  const getFilteredSupplies = () => {
    let filtered = supplies || [];
    if (dateFilter.type !== 'all') {
      const start = startOfDay(parseISO(dateFilter.startDate));
      const end = endOfDay(parseISO(dateFilter.endDate));
      filtered = filtered.filter(supply => {
        const supplyDate = new Date(supply.date);
        return isWithinInterval(supplyDate, { start, end });
      });
    }
    return filtered;
  };

  const getFilteredSales = () => {
    if (dateFilter.type === 'all') return sales || [];
    
    let startDate, endDate;
    switch (dateFilter.type) {
      case 'today':
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        break;
      case 'week':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfDay(new Date());
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        endDate = endOfDay(new Date());
        break;
      case 'specific':
        startDate = startOfDay(parseISO(dateFilter.startDate));
        endDate = endOfDay(parseISO(dateFilter.startDate));
        break;
      case 'custom':
        startDate = startOfDay(parseISO(dateFilter.startDate));
        endDate = endOfDay(parseISO(dateFilter.endDate));
        break;
      default:
        return sales || [];
    }

    return (sales || []).filter(sale => {
      if (!sale.date) return false;
      const saleDate = sale.date.toDate ? sale.date.toDate() : new Date(sale.date);
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });
  };

  const getStrawsSales = () => {
    const strawsProduct = products?.find(p => p.name.toLowerCase().includes("straw"));
    if (!strawsProduct) return [];
    return getFilteredSales().filter(sale => sale.product?.productId === strawsProduct.id);
  };

  const getToiletPaperSales = () => {
    const toiletPaperProduct = products?.find(p => p.name.toLowerCase().includes("toilet"));
    if (!toiletPaperProduct) return [];
    return getFilteredSales().filter(sale => sale.product?.productId === toiletPaperProduct.id);
  };

  const getSupplySummary = () => {
    const filteredSales = getFilteredSales();
    const filteredSupplies = getFilteredSupplies();
    const strawsProduct = products?.find(p => p.name.toLowerCase().includes("straw"));
    const toiletPaperProduct = products?.find(p => p.name.toLowerCase().includes("toilet"));

    const supplyTypes = [
      { type: "kaveera", productId: strawsProduct?.id, product: strawsProduct?.name || "Straws" },
      { type: "box", productId: strawsProduct?.id, product: strawsProduct?.name || "Straws" },
      { type: "60s", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
      { type: "20p", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
      { type: "90w", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
    ];

    return supplyTypes.map(({ type, productId, product }) => {
      const totalSupplied = filteredSupplies
        .filter(s => s.supplyType.toLowerCase() === type.toLowerCase() && s.productId === productId)
        .reduce((sum, supply) => sum + parseInt(supply.quantity || 0), 0);
      const totalSold = filteredSales
        .filter(s => s.product.supplyType.toLowerCase() === type.toLowerCase() && s.product.productId === productId)
        .reduce((sum, sale) => sum + parseInt(sale.product.quantity || 0), 0);
      return {
        supplyType: type,
        product,
        totalSupplied,
        totalSold,
        balance: totalSupplied - totalSold,
      };
    }).filter(summary => summary.totalSupplied > 0 || summary.totalSold > 0);
  };

  const getSalesSummary = () => {
    const strawsSales = getStrawsSales();
    const toiletPaperSales = getToiletPaperSales();

    const calculateTotals = (sales) => ({
      totalQuantity: sales.reduce((sum, sale) => sum + parseInt(sale.product.quantity || 0), 0),
      totalAmount: sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0),
      totalDebt: sales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount || 0) - parseFloat(sale.amountPaid || 0)), 0),
    });

    return {
      straws: calculateTotals(strawsSales),
      toiletPaper: calculateTotals(toiletPaperSales),
    };
  };

  if (loading) return <div className="text-center py-12 text-slate-600">Loading...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">{error}</div>;
  if (!user) return <div className="text-center py-12 text-slate-600">Please log in to view sales.</div>;

  return (
    <div className="space-y-6 w-full bg-slate-50 p-4">
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800">Sales Dashboard</h1>
        <p className="text-slate-600 text-sm mt-1">Track sales, manage transactions, and monitor business performance.</p>
        <DateFilter
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDateFilter={showDateFilter}
          setShowDateFilter={setShowDateFilter}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setShowClientForm(true)}
          className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-md"
          title="Add Client"
        >
          <User className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setShowProductForm(true)}
          className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-md"
          title="Add Product"
        >
          <Package className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setShowSupplyForm(true)}
          className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-md"
          title="Add Supply"
        >
          <Truck className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Straws Sales</h2>
          </div>
          <SalesTable
            sales={getStrawsSales()}
            products={products}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            dateFilter={dateFilter}
            setEditingSale={setEditingSale}
            setShowForm={setShowForm}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Toilet Paper Sales</h2>
          </div>
          <SalesTable
            sales={getToiletPaperSales()}
            products={products}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            dateFilter={dateFilter}
            setEditingSale={setEditingSale}
            setShowForm={setShowForm}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Sales Summary</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2 font-semibold text-slate-700">Product</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Total Quantity</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Total Amount (UGX)</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Total Debt (UGX)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-600">Straws</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().straws.totalQuantity.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().straws.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().straws.totalDebt.toLocaleString()}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-600">Toilet Papers</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().toiletPaper.totalQuantity.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().toiletPaper.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-600">{getSalesSummary().toiletPaper.totalDebt.toLocaleString()}</td>
              </tr>
              <tr className="border-t border-slate-100 font-bold">
                <td className="px-4 py-2 text-slate-800">Total</td>
                <td className="px-4 py-2 text-slate-800">{(getSalesSummary().straws.totalQuantity + getSalesSummary().toiletPaper.totalQuantity).toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-800">{(getSalesSummary().straws.totalAmount + getSalesSummary().toiletPaper.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-800">{(getSalesSummary().straws.totalDebt + getSalesSummary().toiletPaper.totalDebt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Supplies Summary</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2 font-semibold text-slate-700">Supply Type</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Product</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Quantity Taken</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Quantity Sold</th>
                <th className="px-4 py-2 font-semibold text-slate-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {getSupplySummary().map((summary, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-600">{summary.supplyType}</td>
                  <td className="px-4 py-2 text-slate-600">{summary.product}</td>
                  <td className="px-4 py-2 text-slate-600">{summary.totalSupplied.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">{summary.totalSold.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">{summary.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!showForm && (
        <button
          onClick={() => {
            setEditingSale(null);
            setShowForm(true);
          }}
          className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-3 shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 z-[100]"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <SalesForm
              sale={editingSale}
              clients={clients}
              products={products}
              supplies={supplies}
              onClose={() => {
                setShowForm(false);
                setEditingSale(null);
              }}
            />
          </div>
        </div>
      )}

      {showClientForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ClientForm
              newClient={newClient}
              setNewClient={setNewClient}
              setShowClientForm={setShowClientForm}
            />
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ProductForm
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              setShowProductForm={setShowProductForm}
            />
          </div>
        </div>
      )}

      {showSupplyForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <SuppliesForm
              newSupply={newSupply}
              setNewSupply={setNewSupply}
              setShowSupplyForm={setShowSupplyForm}
              products={products}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;