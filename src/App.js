import React, { useState, useNavigate, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { DataProvider } from './DataContext';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { User, ShoppingCart, CreditCard, TrendingDown, Banknote, FileText, LogOut, Menu } from 'lucide-react';
import SalesPage from './components/SalesPage';
import ExpensesPage from './components/ExpensesPage';
import DebtsPage from './components/DebtsPage';
import ProfilePage from './components/ProfilePage';
import ReportsPage from './components/ReportsPage';
import BankPage from './components/BankPage';
import Auth from './components/Auth';
import { auth } from './firebase';

const App = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useContext(AuthContext);

  const Header = () => {
    const navigate = useNavigate();

    const handleSignOut = () => {
      setActiveTab('sales');
      auth.signOut();
      navigate('/');
    };

    return (
      <header className="bg-white/40 backdrop-blur-sm fixed top-0 left-0 right-0 z-[100]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200 md:hidden"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
              RichBooks
            </h1>
            {user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    navigate('/profile');
                  }}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
                  aria-label="Profile"
                >
                  <User className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  };

  const Sidebar = () => {
    const navigate = useNavigate();

    const tabs = [
      { id: 'sales', name: 'Sales', icon: ShoppingCart, path: '/sales', color: 'text-emerald-600' },
      { id: 'debts', name: 'Debts', icon: CreditCard, path: '/debts', color: 'text-orange-600' },
      { id: 'expenses', name: 'Expenses', icon: TrendingDown, path: '/expenses', color: 'text-red-600' },
      { id: 'bank', name: 'Bank', icon: Banknote, path: '/bank', color: 'text-blue-600' },
      { id: 'reports', name: 'Reports', icon: FileText, path: '/reports', color: 'text-purple-600' },
    ];

    const handleSignOut = () => {
      setActiveTab('sales');
      auth.signOut();
      navigate('/');
      setIsSidebarOpen(false);
    };

    return (
      <nav
        className={`fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-md border-r border-neutral-200/80 shadow-lg z-[90] w-64 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full pt-16 pb-4 px-4">
          <div className="flex-1 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg transition-all duration-300 text-sm font-medium ${
                  activeTab === tab.id
                    ? `${tab.color} bg-gradient-to-r from-neutral-50 to-transparent`
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/50'
                }`}
                aria-label={tab.name}
              >
                <tab.icon
                  className={`w-5 h-5 ${
                    activeTab === tab.id ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'
                  }`}
                />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium text-red-600 hover:bg-red-100/50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    );
  };

  const Navigation = () => {
    const navigate = useNavigate();

    const tabs = [
      { id: 'sales', name: 'Sales', icon: ShoppingCart, path: '/sales', color: 'text-emerald-600' },
      { id: 'debts', name: 'Debts', icon: CreditCard, path: '/debts', color: 'text-orange-600' },
      { id: 'expenses', name: 'Expenses', icon: TrendingDown, path: '/expenses', color: 'text-red-600' },
      { id: 'bank', name: 'Bank', icon: Banknote, path: '/bank', color: 'text-blue-600' },
      { id: 'reports', name: 'Reports', icon: FileText, path: '/reports', color: 'text-purple-600' },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-2xl z-[90] md:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-3 sm:py-4 px-1 text-xs font-medium transition-all duration-300 relative min-h-[70px] sm:min-h-[80px] group ${
                  activeTab === tab.id
                    ? `${tab.color} bg-gradient-to-t from-neutral-50 to-transparent`
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50/50'
                }`}
                aria-label={tab.name}
              >
                {activeTab === tab.id && (
                  <>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-current to-transparent rounded-full"></div>
                    <div className="absolute inset-x-2 top-0 bottom-0 bg-gradient-to-b from-current/5 to-transparent rounded-b-2xl"></div>
                  </>
                )}
                <tab.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 transition-all duration-300 ${
                    activeTab === tab.id ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs leading-tight transition-all duration-300 ${
                    activeTab === tab.id ? 'font-semibold' : 'group-hover:font-medium'
                  }`}
                >
                  {tab.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  };

  const LoadingScreen = () => (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="bg-white/40 backdrop-blur-sm fixed top-0 left-0 right-0 z-[100]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Skeleton height={36} width={36} borderRadius={8} />
              <Skeleton height={24} width={100} borderRadius={4} />
              <Skeleton height={36} width={36} borderRadius={8} />
            </div>
          </div>
        </div>
        <div className="fixed top-0 left-0 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-neutral-200/80 hidden md:block">
          <div className="flex flex-col h-full pt-16 pb-4 px-4">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} height={40} borderRadius={8} />
              ))}
            </div>
            <Skeleton height={40} borderRadius={8} />
          </div>
        </div>
        <main className="pt-[60px] pb-[90px] sm:pb-[100px] md:ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton height={32} width={200} className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <Skeleton height={20} width={80} className="mb-2" />
                    <Skeleton height={36} width={120} />
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                    <Skeleton height={20} width={80} className="mb-2" />
                    <Skeleton height={36} width={120} />
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                    <Skeleton height={20} width={80} className="mb-2" />
                    <Skeleton height={36} width={120} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <Skeleton height={24} width={150} className="mb-4" />
                  <div className="space-y-3">
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <Skeleton height={24} width={150} className="mb-4" />
                  <div className="space-y-3">
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                    <Skeleton height={60} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton height={28} width={180} className="mb-6" />
                <Skeleton height={300} />
              </div>
            </div>
          </div>
        </main>
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-2xl z-[90] md:hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-center py-3 sm:py-4 px-1 min-h-[70px] sm:min-h-[80px]">
                  <Skeleton height={24} width={24} className="mb-1.5" borderRadius={4} />
                  <Skeleton height={12} width={40} borderRadius={2} />
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </SkeletonTheme>
  );

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <DataProvider>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
          <Header />
          {user && <Sidebar />}
          <main className="pt-[60px] pb-[90px] sm:pb-[100px] md:ml-64 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="animate-in fade-in duration-500">
                <Routes>
                  {user ? (
                    <>
                      <Route path="/" element={<Navigate to="/sales" replace />} />
                      <Route path="/sales" element={<SalesPage />} />
                      <Route path="/debts" element={<DebtsPage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/bank" element={<BankPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<Navigate to="/sales" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="*" element={<Auth />} />
                    </>
                  )}
                </Routes>
              </div>
            </div>
          </main>
          {user && <Navigation />}
        </div>
      </DataProvider>
    </Router>
  );
};

export default App;