import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  RotateCcw, 
  Moon, 
  Sun,
  LayoutDashboard,
  Package,
  AlertCircle,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Check,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { InventoryItem, Category, InventorySummary } from './types';
import { INITIAL_INVENTORY } from './constants';
import { InventoryTable } from './components/InventoryTable';
import { DashboardStats } from './components/DashboardStats';
import { AddItemModal } from './components/AddItemModal';
import { EditItemModal } from './components/EditItemModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { getStockStatus } from './lib/inventoryUtils';
import { exportToPDF } from './lib/pdfExport';
import { cn } from './lib/utils';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  OperationType,
  handleFirestoreError
} from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export const CATEGORIES: Category[] = ['S&R Supplies', 'Sauces', 'Syrups', 'Others', 'Lazada Supplies'];

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse((error as any).message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

function InventoryApp() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCountDone, setIsCountDone] = useState(false);

  useEffect(() => {
    if (isCountDone) {
      const timer = setTimeout(() => setIsCountDone(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCountDone]);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setItems([]);
      return;
    }

    const q = collection(db, 'inventory');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(doc => {
        const data = doc.data() as InventoryItem;
        // One-time fix for existing data
        if (data.name === '4pcs clam') {
          updateDoc(doc.ref, { name: '4 pcs clam' });
        }
        return {
          id: doc.id,
          ...data
        };
      }) as InventoryItem[];
      
      // If empty, seed with initial data (only if user is admin or it's the first run)
      if (newItems.length === 0) {
        seedInitialData();
      } else {
        // Sort in memory by status (Out of Stock > Low Stock > In Stock)
        const sortedItems = [...newItems].sort((a, b) => {
          // First by isCounted (unchecked first)
          const countedA = !!a.isCounted;
          const countedB = !!b.isCounted;
          if (countedA !== countedB) return countedA ? 1 : -1;
          
          // Then by status
          const statusA = getStockStatus(a);
          const statusB = getStockStatus(b);
          
          const statusPriority = { 'out-of-stock': 0, 'low-stock': 1, 'in-stock': 2 };
          if (statusPriority[statusA] !== statusPriority[statusB]) {
            return statusPriority[statusA] - statusPriority[statusB];
          }
          
          // Then by name
          return a.name.localeCompare(b.name);
        });
        setItems(sortedItems);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const seedInitialData = async () => {
    const batch = writeBatch(db);
    INITIAL_INVENTORY.forEach((item) => {
      const docRef = doc(collection(db, 'inventory'));
      batch.set(docRef, {
        ...item,
        lastUpdated: Date.now(),
        uid: user?.uid
      });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const summary = useMemo<InventorySummary>(() => {
    const lowStock = items.filter(item => getStockStatus(item) === 'low-stock').length;
    const outOfStock = items.filter(item => getStockStatus(item) === 'out-of-stock').length;
    return {
      totalItems: items.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const status = getStockStatus(item);
      const matchesStatus = 
        filterStatus === 'All' || 
        (filterStatus === 'Low Stock' && status === 'low-stock') ||
        (filterStatus === 'Out of Stock' && status === 'out-of-stock');
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, filterStatus]);

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const itemRef = doc(db, 'inventory', id);
    try {
      const updateData: any = { ...updates };
      // Only set uid if it's explicitly provided in updates or if we want to track last editor
      // But for this app, uid represents the owner/creator, so we shouldn't overwrite it here.
      
      await updateDoc(itemRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
    }
  };

  const handleSyncEmojis = async () => {
    const batch = writeBatch(db);
    let count = 0;
    
    items.forEach(item => {
      const initial = INITIAL_INVENTORY.find(i => i.name === item.name);
      if (initial && initial.emoji !== item.emoji) {
        const itemRef = doc(db, 'inventory', item.id);
        batch.update(itemRef, { 
          emoji: initial.emoji,
          lastUpdated: Date.now()
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      alert(`Successfully synced ${count} emojis!`);
    } else {
      alert('All emojis are already up to date.');
    }
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      const itemRef = doc(db, 'inventory', itemToDelete.id);
      try {
        await deleteDoc(itemRef);
        setItemToDelete(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `inventory/${itemToDelete.id}`);
      }
    }
  };

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    try {
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        lastUpdated: Date.now(),
        uid: user?.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inventory');
    }
  };

  const handleResetCount = async () => {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const itemRef = doc(db, 'inventory', item.id);
      batch.update(itemRef, { quantity: '0', lastUpdated: Date.now(), uid: user?.uid, isCounted: false });
    });
    try {
      await batch.commit();
      setIsResetModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-brand-light-brown flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="relative mb-6">
            <img src="/alfonso.jpg" alt="Alfonso Logo" className="w-16 h-16 rounded-[24px] border-2 border-brand-tan shadow-2xl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full border-2 border-brand-light-brown" />
          </div>
          <div className="h-4 w-32 bg-brand-brown/10 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-light-brown flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center border border-brand-brown/5">
          <div className="relative w-24 h-24 mx-auto mb-8 group">
            <img src="/alfonso.jpg" alt="Alfonso Logo" className="w-24 h-24 rounded-[32px] border-2 border-brand-tan shadow-2xl transition-transform duration-700 group-hover:rotate-12" />
            <div className="absolute -top-3 -right-3 bg-brand-tan text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-md">Pro</div>
          </div>
          <h2 className="text-3xl font-black text-brand-brown uppercase tracking-tighter mb-3">Alfonso</h2>
          <p className="text-brand-brown/60 mb-10 leading-relaxed font-bold text-sm uppercase tracking-widest">
            Kitchen X Café Inventory
          </p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-brand-brown text-white rounded-2xl font-black text-lg hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-brown/20"
          >
            <LogIn size={22} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-coffee-950 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden bg-brand-light-brown border-b border-brand-brown/10 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/alfonso.jpg" alt="Alfonso Logo" className="w-9 h-9 rounded-full border-2 border-brand-tan shadow-md" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-600 rounded-full border-2 border-brand-light-brown" />
          </div>
          <h1 className="font-black text-lg text-brand-brown uppercase tracking-tighter">Alfonso</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-brand-brown/5 hover:bg-brand-brown/10 rounded-xl text-brand-brown transition-all active:scale-90"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Sidebar / Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-brand-light-brown border-r border-brand-brown/10 transform transition-transform duration-500 ease-out lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img src="/alfonso.jpg" alt="Alfonso Logo" className="w-14 h-14 rounded-2xl border-2 border-brand-tan shadow-2xl transition-transform duration-500 group-hover:rotate-6" />
                <div className="absolute -top-2 -right-2 bg-brand-tan text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-md">Pro</div>
              </div>
              <div>
                <h1 className="font-black text-2xl text-brand-brown uppercase tracking-tighter leading-none">Alfonso</h1>
                <p className="text-[10px] font-black text-brand-brown uppercase tracking-[0.3em] mt-2 opacity-80">Kitchen X Café</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-brand-brown/10 rounded-xl transition-colors text-brand-brown"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-10 p-5 glass rounded-3xl flex items-center gap-4 border border-brand-brown/20">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-tan shadow-inner">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-brand-brown">{user.displayName}</p>
              <p className="text-[10px] text-brand-brown/70 font-bold truncate">{user.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              onClick={() => {
                setSelectedCategory('All');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all duration-300 group",
                selectedCategory === 'All' 
                  ? "bg-brand-brown text-white shadow-xl shadow-brand-brown/20 scale-[1.02]" 
                  : "text-brand-brown hover:bg-brand-brown/10"
              )}
            >
              <LayoutDashboard size={20} className={cn(selectedCategory === 'All' ? "text-white" : "group-hover:scale-110 transition-transform")} />
              <span className="tracking-tight">All Inventory</span>
            </button>
            
            <div className="pt-8 pb-4">
              <p className="px-5 text-[9px] font-black uppercase tracking-[0.4em] text-brand-brown/50 mb-6">Categories</p>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (selectedCategory === 'All') {
                        const element = document.getElementById(`category-${cat}`);
                        if (element) {
                          const offset = 120;
                          const bodyRect = document.body.getBoundingClientRect().top;
                          const elementRect = element.getBoundingClientRect().top;
                          const elementPosition = elementRect - bodyRect;
                          const offsetPosition = elementPosition - offset;

                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                          });
                        }
                      } else {
                        setSelectedCategory(cat);
                      }
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 group",
                      selectedCategory === cat 
                        ? "bg-brand-brown text-white shadow-xl shadow-brand-brown/20 scale-[1.02]" 
                        : "text-brand-brown hover:bg-brand-brown/10"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-all duration-500",
                      selectedCategory === cat ? "bg-white scale-150 shadow-glow" : "bg-brand-brown/30 group-hover:bg-brand-brown"
                    )} />
                    <span className="flex-1 text-left truncate tracking-tight">{cat}</span>
                    <ChevronDown size={14} className={cn("transition-all duration-500", selectedCategory === cat ? "opacity-100 rotate-0" : "opacity-0 -rotate-90")} />
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="pt-8 border-t border-brand-brown/10 space-y-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-brand-brown hover:bg-brand-brown/10 transition-all group"
            >
              <div className="w-10 h-10 bg-brand-brown/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut size={18} />
              </div>
              <span className="text-sm">Sign Out</span>
            </button>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-red-600 hover:bg-red-600/10 transition-all group"
            >
              <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw size={18} />
              </div>
              <span className="text-sm">Reset System</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-80 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 bg-brand-light-brown rounded-full border border-brand-brown/10 shadow-sm">
                <div className="w-1 h-1 bg-brand-brown rounded-full animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-brown">Control Center</p>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter">Inventory Overview</h2>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={() => exportToPDF(items)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-light-brown border border-brand-brown/10 rounded-xl font-bold text-[8px] uppercase tracking-widest text-brand-brown hover:bg-brand-brown/10 transition-all active:scale-95"
              >
                <Download size={12} />
                Export
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-brown text-white rounded-xl font-bold text-[8px] uppercase tracking-widest transition-all shadow-sm active:scale-95 hover:bg-brand-brown/90"
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <DashboardStats 
          summary={summary} 
          onSyncEmojis={handleSyncEmojis}
        />

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="relative group flex-1 md:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/40 group-focus-within:text-brand-brown transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-brand-light-brown border border-brand-brown/10 rounded-xl focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all text-brand-brown text-sm font-medium"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
              <div className="flex bg-brand-light-brown p-1 rounded-xl border border-brand-brown/10 overflow-x-auto no-scrollbar">
                {['All', 'Low Stock', 'Out of Stock'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={cn(
                      "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      filterStatus === status 
                        ? "bg-brand-brown text-white shadow-sm" 
                        : "text-brand-brown hover:bg-brand-brown/5"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  setIsCountDone(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-green-600 text-white rounded-xl font-bold text-[8px] md:text-[9px] uppercase tracking-widest hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                <Check size={12} className="md:w-[14px] md:h-[14px]" />
                Finalize
              </button>
            </div>
          </div>

          {/* Count Completed Notification */}
          {isCountDone && (
            <div className="mb-8 p-6 bg-brand-light-brown rounded-2xl border border-green-600/20 flex items-center gap-6 animate-in slide-in-from-top duration-500">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-600/20">
                <Check size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-brand-brown tracking-tight">Count Finalized</h4>
                <p className="text-xs text-brand-brown/70 font-medium">Inventory records synchronized.</p>
              </div>
              <button 
                onClick={() => setIsCountDone(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-brand-brown/10 rounded-xl text-brand-brown transition-all"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Inventory Sections */}
          <div className="space-y-12">
            {filteredItems.length > 0 ? (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <InventoryTable 
                  items={filteredItems} 
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onEdit={(item) => {
                    setItemToEdit(item);
                    setIsEditModalOpen(true);
                  }}
                />
              </section>
            ) : (
              <div className="text-center py-24 bg-brand-light-brown rounded-[32px] border border-brand-brown/10 border-dashed">
                <div className="w-16 h-16 bg-brand-brown/5 text-brand-brown/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-black text-brand-brown mb-2 tracking-tight">No Results</h3>
                <p className="text-sm text-brand-brown/70 font-medium">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddItem}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setItemToEdit(null);
        }}
        onEdit={handleUpdateItem}
        item={itemToEdit}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetCount}
      />

      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name || ''}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <InventoryApp />
    </ErrorBoundary>
  );
}
