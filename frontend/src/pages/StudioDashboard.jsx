import React, { useEffect, useState, useRef } from 'react';
import {
  FolderPlus,
  Layers,
  PackagePlus,
  Users,
  Trash2,
  UploadCloud,
  ShieldAlert,
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import api, { resolveImageUrl, generateIdempotencyKey } from '../api/client';
import { useStore } from '../context/StoreContext';

export default function StudioDashboard() {
  const { user } = useStore();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('ITEMS');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Sub-Category Form
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subParentId, setSubParentId] = useState('');

  // Item Form (General Store: any product type + local image upload)
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('25');
  const [itemBrand, setItemBrand] = useState('');
  const [itemUnitLabel, setItemUnitLabel] = useState('');
  const [itemSubCatId, setItemSubCatId] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Sub-Admin Form (Admin only)
  const [saName, setSaName] = useState('');
  const [saEmail, setSaEmail] = useState('');
  const [saPhone, setSaPhone] = useState('');
  const [saPassword, setSaPassword] = useState('');

  // Chotu Bot state for Admin Control Center
  const [chotuMessages, setChotuMessages] = useState([
    {
      role: 'assistant',
      content:
        "Namaste Admin! I am **Chotu**, your store operations AI assistant. Ask me anything about **sales performance**, **inventory levels**, **low-stock alerts**, or use the microphone button to speak."
    }
  ]);
  const [chotuInput, setChotuInput] = useState('');
  const [chotuLoading, setChotuLoading] = useState(false);
  const [chotuListening, setChotuListening] = useState(false);
  const [chotuSpeechError, setChotuSpeechError] = useState('');
  const [insightsSummary, setInsightsSummary] = useState(null);
  const chotuEndRef = useRef(null);
  const studioSpeechRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onstart = () => {
        setChotuListening(true);
        setChotuSpeechError('');
      };
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) setChotuInput(transcript);
      };
      rec.onerror = (e) => {
        setChotuListening(false);
        if (e.error === 'not-allowed') setChotuSpeechError('Microphone permission denied.');
      };
      rec.onend = () => setChotuListening(false);
      studioSpeechRef.current = rec;
    }
  }, []);

  const toggleStudioSpeech = () => {
    if (!studioSpeechRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (chotuListening) {
      studioSpeechRef.current.stop();
      setChotuListening(false);
    } else {
      setChotuSpeechError('');
      try {
        studioSpeechRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchInsightsSummary = async () => {
    try {
      const token = localStorage.getItem('bazaar_token');
      const res = await fetch('http://localhost:8083/api/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInsightsSummary(data);
      }
    } catch (e) {
      // ignore if service not started yet
    }
  };

  const handleChotuSend = async (customText = chotuInput) => {
    const trimmed = customText.trim();
    if (!trimmed || chotuLoading) return;
    if (chotuListening && studioSpeechRef.current) {
      studioSpeechRef.current.stop();
      setChotuListening(false);
    }
    const userMsg = { role: 'user', content: trimmed };
    const nextHistory = [...chotuMessages, userMsg];
    setChotuMessages(nextHistory);
    setChotuInput('');
    setChotuLoading(true);

    try {
      const token = localStorage.getItem('bazaar_token');
      const res = await fetch('http://localhost:8083/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-6)
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChotuMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          guardrailTriggered: data.guardrail_triggered
        }
      ]);
    } catch (err) {
      setChotuMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ **Could not reach Chotu service on port 8083.**\n\nPlease start the Python service:\n```bash\ncd backend/chotu-bhat-bat\nstart.bat\n```"
        }
      ]);
    } finally {
      setChotuLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    try {
      const [catRes, subRes, itemRes] = await Promise.all([
        api.get('/api/catalog/categories'),
        api.get('/api/catalog/sub-categories'),
        api.get('/api/catalog/items')
      ]);
      setCategories(catRes.data);
      setSubCategories(subRes.data);
      setItems(Array.isArray(itemRes.data) ? itemRes.data : (itemRes.data.content || []));

      if (catRes.data.length > 0 && !subParentId) {
        setSubParentId(catRes.data[0].id);
      }
      if (subRes.data.length > 0 && !itemSubCatId) {
        setItemSubCatId(subRes.data[0].id);
      }

      if (isAdmin) {
        const userRes = await api.get('/api/users');
        setUsers(userRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/api/catalog/categories',
        { name: catName, description: catDesc },
        { headers: { 'Idempotency-Key': generateIdempotencyKey() } }
      );
      setCatName('');
      setCatDesc('');
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its sub-categories and items?')) return;
    await api.delete(`/api/catalog/categories/${id}`);
    refreshAll();
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/api/catalog/sub-categories',
        { name: subName, description: subDesc, categoryId: subParentId },
        { headers: { 'Idempotency-Key': generateIdempotencyKey() } }
      );
      setSubName('');
      setSubDesc('');
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating sub-category');
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Delete this sub-category and its items?')) return;
    await api.delete(`/api/catalog/sub-categories/${id}`);
    refreshAll();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemImage) {
      alert('Please select a product image file to upload.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('description', itemDesc);
      formData.append('price', itemPrice);
      formData.append('stockQuantity', itemStock);
      formData.append('brand', itemBrand || 'BazaarOne Select');
      formData.append('unitLabel', itemUnitLabel || '1 Unit');
      formData.append('subCategoryId', itemSubCatId);
      formData.append('image', itemImage);

      await api.post('/api/catalog/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': generateIdempotencyKey()
        }
      });

      setItemName('');
      setItemDesc('');
      setItemPrice('');
      setItemBrand('');
      setItemUnitLabel('');
      setItemImage(null);
      setImagePreview('');
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload item.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    await api.delete(`/api/catalog/items/${id}`);
    refreshAll();
  };

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/api/users/sub-admins',
        {
          fullName: saName,
          email: saEmail,
          phoneNumber: saPhone,
          password: saPassword
        },
        { headers: { 'Idempotency-Key': generateIdempotencyKey() } }
      );
      setSaName('');
      setSaEmail('');
      setSaPhone('');
      setSaPassword('');
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create sub-admin');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Remove this user account?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      refreshAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete user');
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUB_ADMIN')) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="font-display text-2xl font-semibold">Restricted Access</h2>
        <p className="text-sm text-slate-500 mt-1">Only Admins and Sub-Admins can access catalog controls.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1E6B52]">
            {isAdmin ? 'Full Administrator Access' : 'Sub-Admin Catalog Access'}
          </span>
          <h1 className="font-display text-3xl font-semibold text-slate-900 mt-1">
            {isAdmin ? 'General Store Control Center' : 'Catalog & Inventory Manager'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'ITEMS' ? 'bg-[#1E6B52] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <PackagePlus className="w-4 h-4" /> Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'CATEGORIES' ? 'bg-[#1E6B52] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <FolderPlus className="w-4 h-4" /> Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('SUB_CATEGORIES')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'SUB_CATEGORIES' ? 'bg-[#1E6B52] text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Layers className="w-4 h-4" /> Sub-Categories ({subCategories.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'USERS' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Users className="w-4 h-4" /> Sub-Admins & Users ({users.length})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('CHOTU');
                fetchInsightsSummary();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'CHOTU'
                ? 'bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Chotu AI</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-900 font-extrabold rounded-full">
                Live
              </span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ITEMS */}
      {activeTab === 'ITEMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleAddItem}
            className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4 h-fit shadow-2xs"
          >
            <h3 className="font-display text-xl font-semibold text-slate-900">List Any Store Product</h3>
            <p className="text-xs text-slate-500">
              Images upload to Cloudinary (or fallback to local folder <code className="bg-slate-100 px-1 rounded">./uploads/items</code> if credentials not set).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aisle / Sub-Category</label>
              <select
                required
                value={itemSubCatId}
                onChange={(e) => setItemSubCatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="">Select Sub-Category</option>
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.category?.name} → {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Organic Basmati Rice / Wireless Mouse"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="499"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={itemStock}
                  onChange={(e) => setItemStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={itemBrand}
                  onChange={(e) => setItemBrand(e.target.value)}
                  placeholder="e.g. NatureFresh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size / Unit</label>
                <input
                  type="text"
                  value={itemUnitLabel}
                  onChange={(e) => setItemUnitLabel(e.target.value)}
                  placeholder="e.g. 1 kg / Pack of 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows="3"
                required
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Key specifications, ingredients, or warranty info..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Photo (Local Upload)
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#1E6B52] rounded-2xl p-4 cursor-pointer bg-[#FCFBF8] transition">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-lg" />
                ) : (
                  <div className="text-center py-3">
                    <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-medium text-slate-600">Click to select JPG/PNG image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-[#1E6B52] hover:bg-[#16523F] text-white text-sm font-semibold transition"
            >
              {uploading ? 'Uploading Locally...' : 'Publish to Store'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100"
                  />
                  <div>
                    <span className="text-[11px] font-semibold text-[#1E6B52]">
                      {item.subCategory?.category?.name} / {item.subCategory?.name}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500">
                      ₹{Number(item.price).toLocaleString('en-IN')} • {item.unitLabel || '1 Unit'} • Stock: {item.stockQuantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHOTU AI OPS & CHATBOT (ADMIN ONLY) */}
      {isAdmin && activeTab === 'CHOTU' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                ₹{insightsSummary?.sales?.total_realized_revenue_inr?.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {insightsSummary?.sales?.paid_orders_count || 0} paid • {insightsSummary?.sales?.pending_orders_count || 0} pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Stock</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                {insightsSummary?.inventory?.total_units_in_stock || items.reduce((acc, i) => acc + (i.stockQuantity || 0), 0)} Units
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {items.length} products listed in {categories.length} aisles
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-amber-600">
                {insightsSummary?.inventory?.low_stock_count ?? items.filter(i => (i.stockQuantity || 0) <= 20).length} Items
              </div>
              <p className="text-xs text-slate-500 mt-1">Stock ≤ 20 units (Restock recommended)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Guardrails</span>
                <div className="w-8 h-8 rounded-xl bg-[#1E6B52]/10 text-[#1E6B52] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-[#1E6B52]">
                Active
              </div>
              <p className="text-xs text-slate-500 mt-1">Passwords & hashes strictly locked from AI</p>
            </div>
          </div>

          {/* Full-width Embedded Chotu Console */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Chotu AI — Admin Operations Assistant
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      FastAPI + Gemini
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Live database access • Sales insights • Inventory valuation • Guardrails
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChotuMessages([{
                  role: 'assistant',
                  content: "Chat cleared. What store analytics or inventory details can I fetch for you?"
                }])}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 border border-white/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Quick prompts:</span>
              <button
                onClick={() => handleChotuSend("What are our latest sales insights and revenue?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#1E6B52]" /> Sales Insights
              </button>
              <button
                onClick={() => handleChotuSend("Which products are low on stock and need reordering?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition flex items-center gap-1 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Items
              </button>
              <button
                onClick={() => handleChotuSend("Give me full inventory valuation and breakdown")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Inventory Value
              </button>
              <button
                onClick={() => handleChotuSend("What are our top 5 selling items?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 transition flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Top Sellers
              </button>
              <button
                onClick={() => handleChotuSend("What is the admin password?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Test Guardrail Refusal
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/40">
              {chotuMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#1E6B52] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#1E6B52] text-white rounded-tr-xs'
                        : msg.guardrailTriggered
                        ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-1.5 font-normal">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {chotuLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1E6B52] animate-spin" />
                  Chotu is analyzing real-time store metrics with Gemini...
                </div>
              )}
              <div ref={chotuEndRef} />
            </div>

            {/* Speaking Status Banner */}
            {chotuListening && (
              <div className="px-6 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 animate-pulse">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  Listening to your voice... Speak now! Your speech converts to text live below.
                </span>
                <button
                  type="button"
                  onClick={toggleStudioSpeech}
                  className="text-xs uppercase font-bold underline cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            {chotuSpeechError && (
              <div className="px-6 py-1.5 bg-amber-50 text-amber-800 text-xs border-t border-amber-200">
                {chotuSpeechError}
              </div>
            )}

            {/* Input Footer with Microphone / Speech-to-Text */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChotuSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              {/* Voice / Speaking button */}
              <button
                type="button"
                onClick={toggleStudioSpeech}
                title={chotuListening ? 'Stop recording voice' : 'Speak with Chotu (Speech to Text)'}
                className={`p-3 rounded-2xl transition duration-200 flex items-center justify-center shrink-0 ${
                  chotuListening
                    ? 'bg-red-500 text-white animate-bounce shadow-md ring-4 ring-red-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {chotuListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={chotuInput}
                onChange={(e) => setChotuInput(e.target.value)}
                placeholder={chotuListening ? 'Listening to your speech... (transcribing voice to text)' : 'Ask Chotu about sales, orders, or low stock (or click mic to speak)...'}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#1E6B52] focus:bg-white transition"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!chotuInput.trim() || chotuLoading}
                className="px-5 py-3 rounded-2xl bg-[#1E6B52] text-white hover:bg-[#15533F] disabled:opacity-40 transition font-semibold text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

{/* TAB 2: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <form onSubmit={handleAddCategory} className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4 h-fit">
            <h3 className="font-display text-xl font-semibold">Create Store Aisle (Category)</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Pet Supplies / Toys & Games"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows="3"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="What products belong in this aisle?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-[#1E6B52] text-white text-sm font-semibold">
              Add Category
            </button>
          </form>

          <div className="md:col-span-7 space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg font-semibold text-slate-900">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHOTU AI OPS & CHATBOT (ADMIN ONLY) */}
      {isAdmin && activeTab === 'CHOTU' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                ₹{insightsSummary?.sales?.total_realized_revenue_inr?.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {insightsSummary?.sales?.paid_orders_count || 0} paid • {insightsSummary?.sales?.pending_orders_count || 0} pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Stock</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                {insightsSummary?.inventory?.total_units_in_stock || items.reduce((acc, i) => acc + (i.stockQuantity || 0), 0)} Units
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {items.length} products listed in {categories.length} aisles
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-amber-600">
                {insightsSummary?.inventory?.low_stock_count ?? items.filter(i => (i.stockQuantity || 0) <= 20).length} Items
              </div>
              <p className="text-xs text-slate-500 mt-1">Stock ≤ 20 units (Restock recommended)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Guardrails</span>
                <div className="w-8 h-8 rounded-xl bg-[#1E6B52]/10 text-[#1E6B52] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-[#1E6B52]">
                Active
              </div>
              <p className="text-xs text-slate-500 mt-1">Passwords & hashes strictly locked from AI</p>
            </div>
          </div>

          {/* Full-width Embedded Chotu Console */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Chotu AI — Admin Operations Assistant
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      FastAPI + Gemini
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Live database access • Sales insights • Inventory valuation • Guardrails
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChotuMessages([{
                  role: 'assistant',
                  content: "Chat cleared. What store analytics or inventory details can I fetch for you?"
                }])}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 border border-white/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Quick prompts:</span>
              <button
                onClick={() => handleChotuSend("What are our latest sales insights and revenue?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#1E6B52]" /> Sales Insights
              </button>
              <button
                onClick={() => handleChotuSend("Which products are low on stock and need reordering?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition flex items-center gap-1 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Items
              </button>
              <button
                onClick={() => handleChotuSend("Give me full inventory valuation and breakdown")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Inventory Value
              </button>
              <button
                onClick={() => handleChotuSend("What are our top 5 selling items?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 transition flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Top Sellers
              </button>
              <button
                onClick={() => handleChotuSend("What is the admin password?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Test Guardrail Refusal
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/40">
              {chotuMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#1E6B52] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#1E6B52] text-white rounded-tr-xs'
                        : msg.guardrailTriggered
                        ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-1.5 font-normal">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {chotuLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1E6B52] animate-spin" />
                  Chotu is analyzing real-time store metrics with Gemini...
                </div>
              )}
              <div ref={chotuEndRef} />
            </div>

            {/* Speaking Status Banner */}
            {chotuListening && (
              <div className="px-6 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 animate-pulse">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  Listening to your voice... Speak now! Your speech converts to text live below.
                </span>
                <button
                  type="button"
                  onClick={toggleStudioSpeech}
                  className="text-xs uppercase font-bold underline cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            {chotuSpeechError && (
              <div className="px-6 py-1.5 bg-amber-50 text-amber-800 text-xs border-t border-amber-200">
                {chotuSpeechError}
              </div>
            )}

            {/* Input Footer with Microphone / Speech-to-Text */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChotuSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              {/* Voice / Speaking button */}
              <button
                type="button"
                onClick={toggleStudioSpeech}
                title={chotuListening ? 'Stop recording voice' : 'Speak with Chotu (Speech to Text)'}
                className={`p-3 rounded-2xl transition duration-200 flex items-center justify-center shrink-0 ${
                  chotuListening
                    ? 'bg-red-500 text-white animate-bounce shadow-md ring-4 ring-red-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {chotuListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={chotuInput}
                onChange={(e) => setChotuInput(e.target.value)}
                placeholder={chotuListening ? 'Listening to your speech... (transcribing voice to text)' : 'Ask Chotu about sales, orders, or low stock (or click mic to speak)...'}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#1E6B52] focus:bg-white transition"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!chotuInput.trim() || chotuLoading}
                className="px-5 py-3 rounded-2xl bg-[#1E6B52] text-white hover:bg-[#15533F] disabled:opacity-40 transition font-semibold text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

{/* TAB 3: SUB-CATEGORIES */}
      {activeTab === 'SUB_CATEGORIES' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <form onSubmit={handleAddSubCategory} className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4 h-fit">
            <h3 className="font-display text-xl font-semibold">Create Sub-Category</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Category</label>
              <select
                required
                value={subParentId}
                onChange={(e) => setSubParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Category Name</label>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Organic Spices / Mobile Chargers"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-[#1E6B52] text-white text-sm font-semibold">
              Add Sub-Category
            </button>
          </form>

          <div className="md:col-span-7 space-y-3">
            {subCategories.map((sub) => (
              <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E6B52]">
                    {sub.category?.name}
                  </span>
                  <h4 className="text-base font-bold text-slate-900">{sub.name}</h4>
                  <p className="text-xs text-slate-500">{sub.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteSubCategory(sub.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHOTU AI OPS & CHATBOT (ADMIN ONLY) */}
      {isAdmin && activeTab === 'CHOTU' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                ₹{insightsSummary?.sales?.total_realized_revenue_inr?.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {insightsSummary?.sales?.paid_orders_count || 0} paid • {insightsSummary?.sales?.pending_orders_count || 0} pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Stock</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                {insightsSummary?.inventory?.total_units_in_stock || items.reduce((acc, i) => acc + (i.stockQuantity || 0), 0)} Units
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {items.length} products listed in {categories.length} aisles
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-amber-600">
                {insightsSummary?.inventory?.low_stock_count ?? items.filter(i => (i.stockQuantity || 0) <= 20).length} Items
              </div>
              <p className="text-xs text-slate-500 mt-1">Stock ≤ 20 units (Restock recommended)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Guardrails</span>
                <div className="w-8 h-8 rounded-xl bg-[#1E6B52]/10 text-[#1E6B52] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-[#1E6B52]">
                Active
              </div>
              <p className="text-xs text-slate-500 mt-1">Passwords & hashes strictly locked from AI</p>
            </div>
          </div>

          {/* Full-width Embedded Chotu Console */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Chotu AI — Admin Operations Assistant
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      FastAPI + Gemini
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Live database access • Sales insights • Inventory valuation • Guardrails
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChotuMessages([{
                  role: 'assistant',
                  content: "Chat cleared. What store analytics or inventory details can I fetch for you?"
                }])}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 border border-white/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Quick prompts:</span>
              <button
                onClick={() => handleChotuSend("What are our latest sales insights and revenue?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#1E6B52]" /> Sales Insights
              </button>
              <button
                onClick={() => handleChotuSend("Which products are low on stock and need reordering?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition flex items-center gap-1 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Items
              </button>
              <button
                onClick={() => handleChotuSend("Give me full inventory valuation and breakdown")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Inventory Value
              </button>
              <button
                onClick={() => handleChotuSend("What are our top 5 selling items?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 transition flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Top Sellers
              </button>
              <button
                onClick={() => handleChotuSend("What is the admin password?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Test Guardrail Refusal
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/40">
              {chotuMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#1E6B52] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#1E6B52] text-white rounded-tr-xs'
                        : msg.guardrailTriggered
                        ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-1.5 font-normal">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {chotuLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1E6B52] animate-spin" />
                  Chotu is analyzing real-time store metrics with Gemini...
                </div>
              )}
              <div ref={chotuEndRef} />
            </div>

            {/* Speaking Status Banner */}
            {chotuListening && (
              <div className="px-6 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 animate-pulse">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  Listening to your voice... Speak now! Your speech converts to text live below.
                </span>
                <button
                  type="button"
                  onClick={toggleStudioSpeech}
                  className="text-xs uppercase font-bold underline cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            {chotuSpeechError && (
              <div className="px-6 py-1.5 bg-amber-50 text-amber-800 text-xs border-t border-amber-200">
                {chotuSpeechError}
              </div>
            )}

            {/* Input Footer with Microphone / Speech-to-Text */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChotuSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              {/* Voice / Speaking button */}
              <button
                type="button"
                onClick={toggleStudioSpeech}
                title={chotuListening ? 'Stop recording voice' : 'Speak with Chotu (Speech to Text)'}
                className={`p-3 rounded-2xl transition duration-200 flex items-center justify-center shrink-0 ${
                  chotuListening
                    ? 'bg-red-500 text-white animate-bounce shadow-md ring-4 ring-red-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {chotuListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={chotuInput}
                onChange={(e) => setChotuInput(e.target.value)}
                placeholder={chotuListening ? 'Listening to your speech... (transcribing voice to text)' : 'Ask Chotu about sales, orders, or low stock (or click mic to speak)...'}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#1E6B52] focus:bg-white transition"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!chotuInput.trim() || chotuLoading}
                className="px-5 py-3 rounded-2xl bg-[#1E6B52] text-white hover:bg-[#15533F] disabled:opacity-40 transition font-semibold text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

{/* TAB 4: ADMIN-ONLY SUB-ADMIN & USER MANAGEMENT */}
      {activeTab === 'USERS' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form onSubmit={handleCreateSubAdmin} className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4 h-fit">
            <h3 className="font-display text-xl font-semibold">Add Sub-Admin</h3>
            <p className="text-xs text-slate-500">
              Sub-Admins can add/delete Categories, Sub-Categories, and Items, without access to user accounts.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={saName}
                onChange={(e) => setSaName(e.target.value)}
                placeholder="Kabir Mehta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
              <input
                type="email"
                required
                value={saEmail}
                onChange={(e) => setSaEmail(e.target.value)}
                placeholder="kabir@bazaarone.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={saPhone}
                onChange={(e) => setSaPhone(e.target.value)}
                placeholder="9876500001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
              <input
                type="password"
                required
                value={saPassword}
                onChange={(e) => setSaPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold">
              Create Sub-Admin Account
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{u.fullName}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'ADMIN'
                          ? 'bg-slate-900 text-white'
                          : u.role === 'SUB_ADMIN'
                            ? 'bg-[#1E6B52]/15 text-[#1E6B52]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {u.email || 'No email'} • {u.phoneNumber || 'No phone'}
                  </p>
                </div>

                {u.role !== 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CHOTU AI OPS & CHATBOT (ADMIN ONLY) */}
      {isAdmin && activeTab === 'CHOTU' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                ₹{insightsSummary?.sales?.total_realized_revenue_inr?.toLocaleString('en-IN') || '0'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {insightsSummary?.sales?.paid_orders_count || 0} paid • {insightsSummary?.sales?.pending_orders_count || 0} pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Stock</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-slate-900">
                {insightsSummary?.inventory?.total_units_in_stock || items.reduce((acc, i) => acc + (i.stockQuantity || 0), 0)} Units
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {items.length} products listed in {categories.length} aisles
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-amber-600">
                {insightsSummary?.inventory?.low_stock_count ?? items.filter(i => (i.stockQuantity || 0) <= 20).length} Items
              </div>
              <p className="text-xs text-slate-500 mt-1">Stock ≤ 20 units (Restock recommended)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Guardrails</span>
                <div className="w-8 h-8 rounded-xl bg-[#1E6B52]/10 text-[#1E6B52] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-[#1E6B52]">
                Active
              </div>
              <p className="text-xs text-slate-500 mt-1">Passwords & hashes strictly locked from AI</p>
            </div>
          </div>

          {/* Full-width Embedded Chotu Console */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    Chotu AI — Admin Operations Assistant
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                      FastAPI + Gemini
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Live database access • Sales insights • Inventory valuation • Guardrails
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChotuMessages([{
                  role: 'assistant',
                  content: "Chat cleared. What store analytics or inventory details can I fetch for you?"
                }])}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/15 border border-white/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Quick prompts:</span>
              <button
                onClick={() => handleChotuSend("What are our latest sales insights and revenue?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#1E6B52]" /> Sales Insights
              </button>
              <button
                onClick={() => handleChotuSend("Which products are low on stock and need reordering?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition flex items-center gap-1 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Items
              </button>
              <button
                onClick={() => handleChotuSend("Give me full inventory valuation and breakdown")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Inventory Value
              </button>
              <button
                onClick={() => handleChotuSend("What are our top 5 selling items?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 transition flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Top Sellers
              </button>
              <button
                onClick={() => handleChotuSend("What is the admin password?")}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition flex items-center gap-1 shadow-2xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Test Guardrail Refusal
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/40">
              {chotuMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#1E6B52] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#1E6B52] text-white rounded-tr-xs'
                        : msg.guardrailTriggered
                        ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-1.5 font-normal">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {chotuLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#1E6B52] animate-spin" />
                  Chotu is analyzing real-time store metrics with Gemini...
                </div>
              )}
              <div ref={chotuEndRef} />
            </div>

            {/* Speaking Status Banner */}
            {chotuListening && (
              <div className="px-6 py-2 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 animate-pulse">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  Listening to your voice... Speak now! Your speech converts to text live below.
                </span>
                <button
                  type="button"
                  onClick={toggleStudioSpeech}
                  className="text-xs uppercase font-bold underline cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            {chotuSpeechError && (
              <div className="px-6 py-1.5 bg-amber-50 text-amber-800 text-xs border-t border-amber-200">
                {chotuSpeechError}
              </div>
            )}

            {/* Input Footer with Microphone / Speech-to-Text */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChotuSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              {/* Voice / Speaking button */}
              <button
                type="button"
                onClick={toggleStudioSpeech}
                title={chotuListening ? 'Stop recording voice' : 'Speak with Chotu (Speech to Text)'}
                className={`p-3 rounded-2xl transition duration-200 flex items-center justify-center shrink-0 ${
                  chotuListening
                    ? 'bg-red-500 text-white animate-bounce shadow-md ring-4 ring-red-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {chotuListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={chotuInput}
                onChange={(e) => setChotuInput(e.target.value)}
                placeholder={chotuListening ? 'Listening to your speech... (transcribing voice to text)' : 'Ask Chotu about sales, orders, or low stock (or click mic to speak)...'}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#1E6B52] focus:bg-white transition"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!chotuInput.trim() || chotuLoading}
                className="px-5 py-3 rounded-2xl bg-[#1E6B52] text-white hover:bg-[#15533F] disabled:opacity-40 transition font-semibold text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
