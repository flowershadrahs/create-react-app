import React, { createContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [debts, setDebts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankDeposits, setBankDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data from localStorage on mount
  useEffect(() => {
    if (!isOnline) {
      const cachedData = {
        sales: JSON.parse(localStorage.getItem('sales') || '[]'),
        clients: JSON.parse(localStorage.getItem('clients') || '[]'),
        products: JSON.parse(localStorage.getItem('products') || '[]'),
        supplies: JSON.parse(localStorage.getItem('supplies') || '[]'),
        debts: JSON.parse(localStorage.getItem('debts') || '[]'),
        expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
        categories: JSON.parse(localStorage.getItem('categories') || '[]'),
        bankDeposits: JSON.parse(localStorage.getItem('bankDeposits') || '[]'),
      };
      setSales(cachedData.sales);
      setClients(cachedData.clients);
      setProducts(cachedData.products);
      setSupplies(cachedData.supplies);
      setDebts(cachedData.debts);
      setExpenses(cachedData.expenses);
      setCategories(cachedData.categories);
      setBankDeposits(cachedData.bankDeposits);
      setLoading(false);
      setError(cachedData.sales.length > 0 ? null : 'Offline: No cached data available');
    }
  }, [isOnline]);

  // Authentication state
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setError('Please log in to access data.');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Firestore data when online and user is authenticated
  useEffect(() => {
    if (user && isOnline) {
      setLoading(true);
      let loadedCount = 0;
      const totalCollections = 8;

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalCollections) {
          setLoading(false);
        }
      };

      const collections = [
        { name: 'sales', setter: setSales, cacheKey: 'sales' },
        { name: 'clients', setter: setClients, cacheKey: 'clients' },
        { name: 'products', setter: setProducts, cacheKey: 'products' },
        { name: 'supplies', setter: setSupplies, cacheKey: 'supplies' },
        { name: 'debts', setter: setDebts, cacheKey: 'debts' },
        { name: 'expenses', setter: setExpenses, cacheKey: 'expenses' },
        { name: 'categories', setter: setCategories, cacheKey: 'categories' },
        { name: 'bankDeposits', setter: setBankDeposits, cacheKey: 'bankDeposits' },
      ];

      const unsubscribes = collections.map(({ name, setter, cacheKey }) => {
        const q = query(collection(db, `users/${user.uid}/${name}`));
        return onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setter(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            checkAllLoaded();
          },
          (err) => {
            console.error(`Error fetching ${name}:`, err);
            setError(`Failed to load ${name}`);
            checkAllLoaded();
          }
        );
      });

      return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    }
  }, [user, isOnline]);

  const value = {
    user,
    sales,
    clients,
    products,
    supplies,
    debts,
    expenses,
    categories,
    bankDeposits,
    loading,
    error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};