import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Category, CategoryId } from '../../types';
import { formatETB } from '../../utils/distance';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  X,
  CheckCircle2,
  Database,
  RefreshCw,
  FolderTree,
  ExternalLink,
  Layers,
  Milk,
  Citrus,
  Soup,
  Coffee,
  Flame,
  Wheat,
  UtensilsCrossed,
  Cookie,
  Snowflake,
} from 'lucide-react';

interface AdminProductManagerProps {
  initialView?: 'products' | 'categories';
}

export const AdminProductManager: React.FC<AdminProductManagerProps> = ({ initialView = 'products' }) => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    syncAllDataToDatabase,
    databaseStats,
  } = useApp();

  const [activeView, setActiveView] = useState<'products' | 'categories'>(initialView);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Category Modal & Delete State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [catName, setCatName] = useState('');
  const [catArabicName, setCatArabicName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIconName, setCatIconName] = useState('Package');
  const [catImage, setCatImage] = useState('');
  const [catErrorMessage, setCatErrorMessage] = useState<string | null>(null);

  // Product Form State
  const [name, setName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('dates_sweets');
  const [priceETB, setPriceETB] = useState<number>(1000);
  const [unit, setUnit] = useState('1 kg Box');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('Saudi Arabia');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600');
  const [stockCount, setStockCount] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [isImported, setIsImported] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryId | 'all'>('all');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingProdId(null);
    setName('');
    setArabicName('');
    setCategoryId((categories[0]?.id as CategoryId) || 'dates_sweets');
    setPriceETB(1000);
    setUnit('1 kg Box');
    setDescription('');
    setOrigin('Saudi Arabia');
    setImage('https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600');
    setStockCount(20);
    setLowStockThreshold(5);
    setIsImported(true);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProdId(p.id);
    setName(p.name);
    setArabicName(p.arabicName || '');
    setCategoryId(p.categoryId);
    setPriceETB(p.priceETB);
    setUnit(p.unit);
    setDescription(p.description);
    setOrigin(p.origin);
    setImage(p.image);
    setStockCount(p.stockCount);
    setLowStockThreshold(p.lowStockThreshold);
    setIsImported(p.isImported);
    setErrorMessage(null);
    setModalOpen(true);
  };

  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatArabicName('');
    setCatDescription('');
    setCatIconName('Soup');
    setCatImage('https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=600');
    setCatErrorMessage(null);
    setCatModalOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCatName(c.name);
    setCatArabicName(c.arabicName || '');
    setCatDescription(c.description || '');
    setCatIconName(c.iconName || 'Package');
    setCatImage(c.image || '');
    setCatErrorMessage(null);
    setCatModalOpen(true);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncAllDataToDatabase();
    setIsSyncing(false);
    if (res.success) {
      setSyncFeedback(`Successfully synchronized ${res.categoriesSynced} categories & ${res.productsSynced} products with live Supabase database!`);
    } else {
      setSyncFeedback(`Sync result: ${res.message}`);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatErrorMessage(null);

    if (!catName || catName.trim().length < 2) {
      setCatErrorMessage('Category name must be at least 2 characters.');
      return;
    }

    if (editingCatId) {
      await updateCategory({
        id: editingCatId,
        name: catName.trim(),
        arabicName: catArabicName.trim() || undefined,
        description: catDescription.trim(),
        iconName: catIconName,
        image: catImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      });
    } else {
      await addCategory({
        name: catName.trim(),
        arabicName: catArabicName.trim() || undefined,
        description: catDescription.trim(),
        iconName: catIconName,
        image: catImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      });
    }

    setCatModalOpen(false);
  };

  const filteredProducts =
    selectedCategoryFilter === 'all'
      ? products
      : products.filter((p) => p.categoryId === selectedCategoryFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Price validation: Non-negative
    if (priceETB < 0) {
      setErrorMessage('Price cannot be negative.');
      return;
    }

    if (!name || name.trim().length < 3) {
      setErrorMessage('Product name is required (at least 3 characters).');
      return;
    }

    if (editingProdId) {
      updateProduct(editingProdId, {
        name,
        arabicName,
        categoryId,
        priceETB,
        unit,
        description,
        origin,
        image,
        stockCount,
        lowStockThreshold,
        isAvailable: stockCount > 0,
        isImported,
      });
    } else {
      addProduct({
        name,
        arabicName,
        categoryId,
        priceETB,
        unit,
        description,
        origin,
        image,
        stockCount,
        lowStockThreshold,
        isAvailable: stockCount > 0,
        isImported,
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Live Database Status & Sync Monitor Bar */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-4 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-white">Live Supabase Database Sync</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    databaseStats.isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      databaseStats.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {databaseStats.isConnected ? 'Connected & Active' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time synchronization active. Any product or category you add, edit, or remove is saved directly to your Supabase database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-medium">Categories:</span>
              <span className="font-extrabold text-emerald-400">{categories.length}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-medium">Products:</span>
              <span className="font-extrabold text-amber-400">{products.length}</span>
            </div>

            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Catalog to DB'}</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Products vs Categories) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'products'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products Inventory ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'categories'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categories &amp; Groups ({categories.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeView === 'products' ? (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: PRODUCTS INVENTORY */}
      {activeView === 'products' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Filter by Category</p>
              <p className="text-xs text-slate-500">Focus on one product group at a time.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value as CategoryId | 'all')}
                className="w-full sm:w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
              >
                <option value="all">All Categories ({products.length} products)</option>
                {categories.map((c) => {
                  const count = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Product List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                    <th className="p-3.5">Product / Category</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5">Price (ETB)</th>
                    <th className="p-3.5">Stock Status</th>
                    <th className="p-3.5">Origin</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stockCount <= p.lowStockThreshold && p.stockCount > 0;
                    const isOutOfStock = p.stockCount <= 0 || !p.isAvailable;
                    const catName = categories.find((c) => c.id === p.categoryId)?.name || p.categoryId;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg border bg-slate-100 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium border border-emerald-200">
                                  {catName}
                                </span>
                                {p.arabicName && (
                                  <span className="text-[10px] text-slate-400 font-arabic">{p.arabicName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-medium text-slate-700">{p.unit}</td>

                        <td className="p-3.5 font-extrabold text-slate-900">{formatETB(p.priceETB)}</td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {isOutOfStock ? (
                              'Out of Stock'
                            ) : isLowStock ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Low Stock ({p.stockCount})
                              </>
                            ) : (
                              `In Stock (${p.stockCount})`
                            )}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600">{p.origin}</td>

                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORIES MANAGEMENT */}
      {activeView === 'categories' && (
        <div className="space-y-4">
          {/* Categories Search & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Store Departments &amp; Categories</p>
              <p className="text-xs text-slate-500">Manage categories, add new product lines, or remove deprecated groups.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                onClick={handleOpenAddCategory}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter(
                (c) =>
                  !categorySearch ||
                  c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  (c.arabicName && c.arabicName.includes(categorySearch))
              )
              .map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCatToDelete(cat)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {count} {count === 1 ? 'product' : 'products'}
                          </span>
                        </div>
                        {cat.arabicName && (
                          <p className="text-xs text-emerald-800 font-arabic font-semibold">{cat.arabicName}</p>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
                          {cat.description || 'Standard grocery & specialty catalog group.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">ID: {cat.id}</span>
                      <button
                        onClick={() => {
                          setSelectedCategoryFilter(cat.id as any);
                          setActiveView('products');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View Items ({count})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      {catToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Category?</h3>
                <p className="text-xs text-slate-500">This action will remove the category from your catalog.</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p>
                <strong>Category:</strong> {catToDelete.name} ({catToDelete.id})
              </p>
              <p>
                <strong>Affected Products:</strong>{' '}
                {products.filter((p) => p.categoryId === catToDelete.id).length} product(s) currently belong to this category.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteCategory(catToDelete.id);
                  setCatToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Add / Edit Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in text-xs my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm">
                {editingCatId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {catErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{catErrorMessage}</p>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">Category Name (English)</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Noodles, Snacks, Juices"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Arabic Name (Optional)</label>
                <input
                  type="text"
                  value={catArabicName}
                  onChange={(e) => setCatArabicName(e.target.value)}
                  placeholder="e.g. نودلز ومعكرونة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Brief description of the products in this category..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Icon Name</label>
                <select
                  value={catIconName}
                  onChange={(e) => setCatIconName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                >
                  <option value="Soup">Soup / Noodles</option>
                  <option value="Milk">Milk / Dairy</option>
                  <option value="Citrus">Citrus / Juices</option>
                  <option value="Coffee">Coffee / Tea</option>
                  <option value="Cookie">Cookie / Snacks</option>
                  <option value="Flame">Flame / Sauces</option>
                  <option value="Wheat">Wheat / Grains</option>
                  <option value="Sparkles">Sparkles / Dates</option>
                  <option value="Package">Package / Pantry</option>
                  <option value="Snowflake">Snowflake / Frozen</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in text-xs my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <h3 className="font-bold text-sm">
                {editingProdId ? 'Edit Product Details' : 'Create New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Indomie Mi Goreng Fried Noodles"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Arabic Title (Optional)</label>
                  <input
                    type="text"
                    value={arabicName}
                    onChange={(e) => setArabicName(e.target.value)}
                    placeholder="إندومي مي جورينج"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">Category</label>
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priceETB || ''}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPriceETB(cleaned ? parseInt(cleaned, 10) : 0);
                    }}
                    placeholder="1000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="1 kg Box / 500 g / Pack of 5"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stockCount || ''}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setStockCount(cleaned ? parseInt(cleaned, 10) : 0);
                    }}
                    placeholder="20"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={lowStockThreshold || ''}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setLowStockThreshold(cleaned ? Math.max(1, parseInt(cleaned, 10)) : 1);
                    }}
                    placeholder="5"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Madinah, Saudi Arabia / Indonesia"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
