import React, { useState, useEffect } from 'react';
import type { LoanRequest, LoanCategory } from '../lib/types';
import { getStore, subscribeStore } from '../lib/store';
import LoanCard from './LoanCard';
import { MagnifyingGlass, Faders } from '@phosphor-icons/react';

export default function LoanDirectory() {
  const [store, setStore] = useState(getStore());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'progress' | 'recent'>('featured');

  useEffect(() => {
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const categories = [
    'All',
    'Agriculture',
    'Clean Energy',
    'Women-Led',
    'Small Business',
    'Education',
    'Climate Resilience'
  ];

  const filteredLoans = store.loans.filter((loan) => {
    const matchesCategory = selectedCategory === 'All' || loan.category === selectedCategory;
    const matchesSearch = 
      loan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.location.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.location.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    if (sortBy === 'progress') {
      const aPct = a.raisedUSD / a.goalUSD;
      const bPct = b.raisedUSD / b.goalUSD;
      return bPct - aPct;
    }
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0e1526] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search initiatives, country, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#090e1a] border border-[#172554] rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Faders size={18} className="text-slate-400 flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort micro-loans"
            className="w-full sm:w-auto bg-[#090e1a] border border-[#172554] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer min-h-[44px]"
          >
            <option value="featured">Featured First</option>
            <option value="progress">Highest Progress</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Category Tabs (Mobile full-bleed touch swiping, solid Indigo active) */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border min-h-[40px] flex items-center ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-[#0e1526] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loans Grid */}
      {sortedLoans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLoans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#0e1526] border border-slate-800">
          <p className="text-slate-400 text-sm">No micro-loans match your filter criteria.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-3 text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
