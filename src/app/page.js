'use client';

import React, { useState, useEffect, useMemo } from 'react';
// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc, 
  serverTimestamp, 
  enableIndexedDbPersistence
} from 'firebase/firestore';
// Chart Imports
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
// Icon Imports
import { 
  Wallet, Plus, Trash2, LogOut, TrendingUp, TrendingDown, 
  FileDown, Edit2, Loader2, DollarSign, Calendar, LayoutDashboard,
  PieChart as PieIcon
} from 'lucide-react';

// --- 1. Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- 2. Initialize Firebase (Singleton Pattern) ---
let app, auth, db;

if (typeof window !== 'undefined' && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable Offline Mode
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('Persistence not supported by browser');
      }
    });
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- 3. Constants ---
const CATEGORIES = [
  { name: 'Food', color: '#EF4444', icon: '🍔' },
  { name: 'Rent', color: '#6366F1', icon: '🏠' },
  { name: 'Transport', color: '#F59E0B', icon: '🚗' },
  { name: 'Entertainment', color: '#EC4899', icon: '🎬' },
  { name: 'Shopping', color: '#8B5CF6', icon: '🛍️' },
  { name: 'Health', color: '#10B981', icon: '🏥' },
  { name: 'Salary', color: '#059669', icon: '💰' },
  { name: 'Freelance', color: '#3B82F6', icon: '💻' },
  { name: 'Other', color: '#64748B', icon: '📦' }
];

// --- 4. Sub-Components ---

// Login/Register Screen
const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-slate-500 mb-8">Secure Cloud Expense Tracking</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
            <input type="email" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : (isRegistering ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="mt-4">
           <button type="button" onClick={handleGoogle} className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            Sign in with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-600 font-bold hover:underline">
            {isRegistering ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- 5. Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');

  // 1. Auth Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setExpenses([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Database Listener
  useEffect(() => {
    if (!user || !db) return;
    
    // Query: users -> {userId} -> expenses
    const q = query(
      collection(db, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. CRUD Operations
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      amount: parseFloat(amount),
      description,
      category,
      type,
      date,
      createdAt: serverTimestamp()
    };

    try {
      const colRef = collection(db, 'users', user.uid, 'expenses');
      if (editItem) {
        const { createdAt, ...updatePayload } = payload; // Don't overwrite timestamp
        await updateDoc(doc(db, 'users', user.uid, 'expenses', editItem.id), updatePayload);
      } else {
        await addDoc(colRef, payload);
      }
      closeModal();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (!expenses.length) return;
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const rows = expenses.map(e => [e.date, e.type, e.category, `"${e.description}"`, e.amount]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `expenses_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Modal Handlers
  const openModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setAmount(item.amount);
      setDescription(item.description);
      setCategory(item.category);
      setType(item.type);
      setDate(item.date);
    } else {
      setEditItem(null);
      setAmount('');
      setDescription('');
      setCategory('Food');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  // 5. Statistics
  const stats = useMemo(() => {
    const income = expenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = expenses.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return { income, expense, balance: income - expense };
  }, [expenses]);

  const chartData = useMemo(() => {
    const expenseData = expenses.filter(e => e.type === 'expense');
    const grouped = expenseData.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    
    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key],
      color: CATEGORIES.find(c => c.name === key)?.color || '#ccc'
    })).sort((a,b) => b.value - a.value);
  }, [expenses]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-10">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-lg shadow-lg shadow-indigo-200">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden md:block">ExpenseTracker</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleExport} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Export CSV"><FileDown className="w-5 h-5" /></button>
          <button onClick={() => signOut(auth)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Logout"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 h-32 md:h-40 flex flex-col justify-between">
            <div><p className="text-indigo-200 text-sm font-medium">Total Balance</p><h2 className="text-3xl font-bold mt-1">${stats.balance.toLocaleString()}</h2></div>
            <div className="bg-indigo-500/30 w-fit px-3 py-1 rounded-full text-xs flex items-center"><span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>Live Sync</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-32 md:h-40 flex flex-col justify-between">
            <div><p className="text-slate-500 text-sm font-medium">Income</p><h2 className="text-2xl font-bold text-emerald-600 mt-1">+${stats.income.toLocaleString()}</h2></div>
            <div className="bg-emerald-50 p-2 rounded-full w-fit"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-32 md:h-40 flex flex-col justify-between">
            <div><p className="text-slate-500 text-sm font-medium">Expenses</p><h2 className="text-2xl font-bold text-rose-600 mt-1">-${stats.expense.toLocaleString()}</h2></div>
            <div className="bg-rose-50 p-2 rounded-full w-fit"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-slate-400" /> Spending</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `$${value}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400"><PieIcon className="w-12 h-12 mb-2 opacity-20" /><p className="text-sm">No expense data</p></div>
            )}
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-slate-400" /> History</h3>
              <button onClick={() => openModal()} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"><Plus className="w-3 h-3" /> Add New</button>
            </div>
            <div className="divide-y divide-slate-50">
              {expenses.length === 0 ? (
                <div className="p-10 text-center text-slate-500">No transactions found.</div>
              ) : (
                expenses.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${item.type === 'income' ? 'bg-emerald-100' : 'bg-slate-100'}`}>{CATEGORIES.find(c => c.name === item.category)?.icon || '📄'}</div>
                      <div>
                        <p className="font-semibold text-slate-700">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5"><Calendar className="w-3 h-3" />{item.date} • {item.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>{item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <button onClick={() => openModal()} className="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 z-50"><Plus className="w-6 h-6" /></button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-lg text-slate-800">{editItem ? 'Edit Transaction' : 'New Transaction'}</h3>
               <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             <form onSubmit={handleSave} className="p-6 space-y-5">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {['expense', 'income'].map((t) => (
                    <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition-all ${type === t ? 'bg-white shadow-sm ' + (t === 'expense' ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-500'}`}>{t}</button>
                  ))}
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                   <div className="relative mt-1">
                     <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                     <input type="number" step="0.01" required placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-mono" value={amount} onChange={e => setAmount(e.target.value)} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Date</label><input type="date" required className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={date} onChange={e => setDate(e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase">Description</label><input type="text" required placeholder="e.g. Tacos" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" value={description} onChange={e => setDescription(e.target.value)} /></div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c.name} type="button" onClick={() => setCategory(c.name)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === c.name ? 'bg-indigo-50 ring-1 ring-indigo-500 border-indigo-500 text-indigo-700' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}><span className="text-xl mb-1">{c.icon}</span><span className="text-[10px] font-medium truncate w-full text-center">{c.name}</span></button>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg">{editItem ? 'Update' : 'Save'}</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
