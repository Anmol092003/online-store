import React, { useEffect, useState } from 'react';
import { Search, Plus, Tag, Sparkles, ShoppingBasket, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { resolveImageUrl } from '../api/client';
import { useStore } from '../context/StoreContext';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 8;

  const { addToCart } = useStore();

  useEffect(() => {
    fetchInitialCatalog();
  }, []);

  const fetchItems = async (catId, subId, query, pageNum) => {
    try {
      setLoading(true);
      const params = { page: pageNum, size: PAGE_SIZE };
      if (query && query.trim()) params.search = query.trim();
      else if (subId && subId !== 'ALL') params.subCategoryId = subId;
      else if (catId && catId !== 'ALL') params.categoryId = catId;

      const res = await api.get('/api/catalog/items', { params });
      if (res.data && res.data.content) {
        setItems(res.data.content);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || res.data.content.length);
        setCurrentPage(res.data.currentPage || 0);
      } else if (Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(Math.ceil(res.data.length / PAGE_SIZE) || 1);
        setTotalElements(res.data.length);
        setCurrentPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load general store catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialCatalog = async () => {
    try {
      setLoading(true);
      const [catRes, subRes] = await Promise.all([
        api.get('/api/catalog/categories'),
        api.get('/api/catalog/sub-categories')
      ]);
      setCategories(catRes.data);
      setSubCategories(subRes.data);
      await fetchItems('ALL', 'ALL', '', 0);
    } catch (err) {
      console.error('Failed to load initial catalog metadata', err);
      setLoading(false);
    }
  };

  const handleFilter = async (catId, subId, query = searchQuery) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(subId);
    setCurrentPage(0);
    await fetchItems(catId, subId, query, 0);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 0 || newPage >= totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    await fetchItems(selectedCategory, selectedSubCategory, searchQuery, newPage);
    document.getElementById('store-aisles')?.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleSubCategories =
    selectedCategory === 'ALL'
      ? subCategories
      : subCategories.filter((s) => s.category?.id === selectedCategory);

  return (
    <div className="pb-20">
      {/* Light & Bright General Store Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#F6F3EC] via-white to-[#EEF5F1] border border-slate-200/90 grid grid-cols-1 lg:grid-cols-12 shadow-xs">
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1E6B52] bg-[#1E6B52]/10 px-3 py-1 rounded-full w-fit mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Your Neighborhood Everything Store
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-slate-900 leading-[1.12] tracking-tight">
              Groceries, gadgets, home essentials & more—all in one basket.
            </h1>
            <p className="text-slate-600 text-base mt-4 max-w-xl leading-relaxed">
              From morning Arabica coffee and cold-pressed oils to wireless earbuds, cookware, skincare, and stationery—shop every aisle effortlessly.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilter('ALL', 'ALL', e.target.value);
                  }}
                  placeholder="Search coffee, earbuds, skillet, honey, serum..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-sm text-slate-900 shadow-2xs focus:outline-none focus:border-[#1E6B52]"
                />
              </div>
              <a
                href="#store-aisles"
                className="px-6 py-3.5 rounded-2xl bg-[#1E6B52] hover:bg-[#16523F] text-white text-sm font-semibold transition inline-flex items-center gap-2 shadow-xs"
              >
                <ShoppingBasket className="w-4 h-4" /> Browse Aisles
              </a>
            </div>
          </div>

          {/* Multi-product General Store Collage */}
          <div className="lg:col-span-5 p-6 grid grid-cols-2 gap-3 bg-white/60">
            <img
              src="https://res.cloudinary.com/xkx66gtv/image/upload/v1795514390/photo-1542838132-92c53300491e.avif"
              alt="Fresh groceries and pantry"
              className="w-full h-44 sm:h-52 object-cover rounded-2xl shadow-2xs"
            />
            <img
              src="https://res.cloudinary.com/xkx66gtv/image/upload/v1795514533/photo-1590658268037-6bf12165a8df.avif"
              alt="Wireless audio and electronics"
              className="w-full h-44 sm:h-52 object-cover rounded-2xl shadow-2xs mt-4"
            />
            <img
              src="https://res.cloudinary.com/xkx66gtv/image/upload/v1795436908/cld-sample-5.jpg"
              alt="Home and kitchenware"
              className="w-full h-44 sm:h-52 object-cover rounded-2xl shadow-2xs -mt-2"
            />
            <img
              src="https://res.cloudinary.com/xkx66gtv/image/upload/v1795514569/cream.avif"
              alt="Personal care and wellness"
              className="w-full h-44 sm:h-52 object-cover rounded-2xl shadow-2xs mt-2"
            />
          </div>
        </div>
      </section>

      {/* Store Aisles (Categories & Sub-Categories) */}
      <section id="store-aisles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilter('ALL', 'ALL', '')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedCategory === 'ALL'
                ? 'bg-[#1E6B52] text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              All Aisles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFilter(cat.id, 'ALL', '')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedCategory === cat.id
                  ? 'bg-[#1E6B52] text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {items.length} {items.length === 1 ? 'item' : 'items'} available
          </span>
        </div>

        {/* Sub-category filter bar */}
        {visibleSubCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Section:
            </span>
            <button
              onClick={() => handleFilter(selectedCategory, 'ALL', '')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSubCategory === 'ALL'
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              Everything
            </button>
            {visibleSubCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleFilter(selectedCategory, sub.id, '')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedSubCategory === sub.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* General Store Product Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 mt-6">
            <p className="font-display text-xl text-slate-800">No items found in this aisle</p>
            <p className="text-sm text-slate-500 mt-1">Try another search term or switch back to All Aisles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square bg-[#F6F3EC] overflow-hidden">
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.subCategory && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs">
                      <Tag className="w-3 h-3 text-[#1E6B52]" />
                      {item.subCategory.name}
                    </span>
                  )}
                  {item.unitLabel && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-slate-900/75 text-white text-[11px] font-medium">
                      {item.unitLabel}
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold uppercase tracking-wider text-[#1E6B52]">
                        {item.brand || 'BazaarOne'}
                      </span>
                      <span>{item.subCategory?.category?.name}</span>
                    </div>
                    <h3 className="font-semibold text-base text-slate-900 line-clamp-1 group-hover:text-[#1E6B52] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </span>
                      {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                        <span className="text-xs text-slate-400 line-through ml-1.5">
                          ₹{Number(item.originalPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={item.stockQuantity === 0}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#1E6B52] hover:bg-[#16523F] text-white text-xs font-semibold transition disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {item.stockQuantity === 0 ? 'Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <nav
            aria-label="Catalog pages"
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200"
          >
            <p className="text-xs text-slate-500 font-medium">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {currentPage * PAGE_SIZE + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800">{totalElements}</span> items
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-2xs"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePageChange(i)}
                    aria-current={currentPage === i ? 'page' : undefined}
                    className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      currentPage === i
                        ? 'bg-[#1E6B52] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-2xs"
                aria-label="Next page"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
