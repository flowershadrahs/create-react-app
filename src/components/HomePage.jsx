import React, { useState, useEffect } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { CreditCard, ShoppingCart, TrendingDown, AlertCircle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const HomePage = ({ sales, debts, expenses, userId }) => {
  const [todaySales, setTodaySales] = useState([]);
  const [todayDebts, setTodayDebts] = useState([]);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  // Remove the separate expense fetching since it's already passed as prop
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("../firebase");

        // Fetch clients
        const clientsSnapshot = await getDocs(collection(db, `users/${userId}/clients`));
        const clientsList = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setClients(clientsList);

        // Fetch products
        const productsSnapshot = await getDocs(collection(db, `users/${userId}/products`));
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setProducts(productsList);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Filter today's sales
    const filteredSales = (sales || []).filter(s => {
      const saleDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return saleDate && saleDate >= todayStart && saleDate <= todayEnd;
    });
    setTodaySales(filteredSales);

    // Filter today's debts
    const filteredDebts = (debts || []).filter(d => {
      const debtDate = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
      return debtDate && debtDate >= todayStart && debtDate <= todayEnd;
    });
    setTodayDebts(filteredDebts);

    // Filter today's expenses - use the expenses prop directly
    const filteredExpenses = (expenses || []).filter(e => {
      const expenseDate = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      return expenseDate && expenseDate >= todayStart && expenseDate <= todayEnd;
    });
    setTodayExpenses(filteredExpenses);
  }, [sales, debts, expenses]);

  const totalTodaySales = todaySales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
  const totalTodayPaid = todaySales.reduce((sum, sale) => sum + (parseFloat(sale.amountPaid) || 0), 0);
  const totalTodayDebts = todayDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
  const totalTodayExpenses = todayExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const todayBalance = totalTodayPaid - totalTodayExpenses;

  const createGradient = (ctx, chartArea, colorStart, colorEnd) => {
    if (!ctx || !chartArea) return colorStart;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  const salesChartData = {
    labels: ["Sales", "Paid", "Debts"],
    datasets: [
      {
        label: "Amount (UGX)",
        data: [totalTodaySales, totalTodayPaid, totalTodayDebts],
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(59, 130, 246, 0.8)";
          return createGradient(ctx, chartArea, "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)");
        },
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 40,
        hoverBackgroundColor: "rgba(59, 130, 246, 1)",
      },
    ],
  };

  // Group expenses by category and sum amounts
  const expensesByCategory = todayExpenses.reduce((acc, expense) => {
    const category = expense.category || "Unknown";
    const amount = parseFloat(expense.amount) || 0;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  const expensesChartData = {
    labels: Object.keys(expensesByCategory).length > 0 ? Object.keys(expensesByCategory) : ["No Data"],
    datasets: [
      {
        data: Object.keys(expensesByCategory).length > 0 ? Object.values(expensesByCategory) : [1],
        backgroundColor: Object.keys(expensesByCategory).length > 0 ? [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(199, 199, 199, 0.8)",
          "rgba(83, 102, 255, 0.8)",
        ] : ["rgba(200, 200, 200, 0.5)"],
        borderColor: Object.keys(expensesByCategory).length > 0 ? [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(199, 199, 199, 1)",
          "rgba(83, 102, 255, 1)",
        ] : ["rgba(200, 200, 200, 1)"],
        borderWidth: 1,
        hoverOffset: 20,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-4 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Today's Sales</p>
              <p className="text-2xl font-bold text-blue-600">UGX {totalTodaySales.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-4 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Today's Paid</p>
              <p className="text-2xl font-bold text-green-600">UGX {totalTodayPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-4 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Today's Debts</p>
              <p className="text-2xl font-bold text-red-600">UGX {totalTodayDebts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-4 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Today's Expenses</p>
              <p className="text-2xl font-bold text-orange-600">UGX {totalTodayExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative bg-neutral-50 rounded-lg p-4 shadow-sm">
            <h4 className="text-md font-medium text-neutral-700 mb-4">Sales Overview</h4>
            <div className="h-80">
              <Bar
                data={salesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        font: { size: 14, weight: "500" },
                        color: "#1f2937",
                      },
                    },
                    title: {
                      display: true,
                      text: "Today's Sales, Paid Amount, and Debts",
                      font: { size: 16, weight: "600" },
                      color: "#1f2937",
                    },
                    tooltip: {
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                      padding: 12,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        font: { size: 12 },
                        color: "#6b7280",
                      },
                      grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                      },
                    },
                    x: {
                      ticks: {
                        font: { size: 12 },
                        color: "#6b7280",
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="relative bg-neutral-50 rounded-lg p-4 shadow-sm">
            <h4 className="text-md font-medium text-neutral-700 mb-4">Expenses Breakdown</h4>
            <div className="h-80">
              <Pie
                data={expensesChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        font: { size: 14, weight: "500" },
                        color: "#1f2937",
                        padding: 20,
                      },
                    },
                    title: {
                      display: true,
                      text: "Today's Expenses by Category",
                      font: { size: 16, weight: "600" },
                      color: "#1f2937",
                    },
                    tooltip: {
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                      padding: 12,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-50 rounded-lg p-4 shadow-sm transform hover:scale-105 transition-transform duration-200">
            <p className="text-sm text-neutral-600">Total Clients</p>
            <p className="text-2xl font-bold text-neutral-800">{clients.length}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 shadow-sm transform hover:scale-105 transition-transform duration-200">
            <p className="text-sm text-neutral-600">Total Products</p>
            <p className="text-2xl font-bold text-neutral-800">{products.length}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 shadow-sm transform hover:scale-105 transition-transform duration-200">
            <p className="text-sm text-neutral-600">Today's Balance</p>
            <p className={`text-2xl font-bold ${todayBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              UGX {todayBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;