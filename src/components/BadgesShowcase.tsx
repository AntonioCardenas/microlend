import React, { useState, useEffect } from 'react';
import { getStore, subscribeStore } from '../lib/store';
import { 
  Medal, 
  Lock, 
  CheckCircle, 
  Sparkle, 
  Plant, 
  PottedPlant, 
  Tree, 
  TreeEvergreen, 
  DiamondsFour 
} from '@phosphor-icons/react';

export default function BadgesShowcase() {
  const [store, setStore] = useState(getStore());

  useEffect(() => {
    return subscribeStore(() => {
      setStore({ ...getStore() });
    });
  }, []);

  const renderBadgeIcon = (tier: string, isUnlocked: boolean) => {
    const props = { size: 28, weight: "bold" as const, className: isUnlocked ? "text-indigo-400" : "text-slate-600" };
    switch (tier) {
      case 'Seedling':
        return <Plant {...props} />;
      case 'Cultivator':
        return <PottedPlant {...props} />;
      case 'Grower':
        return <Tree {...props} />;
      case 'Catalyst':
        return <TreeEvergreen {...props} />;
      case 'Patron':
      default:
        return <DiamondsFour {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Medal size={22} className="text-indigo-400" />
            <h3 className="text-xl font-bold text-white font-['Syne']">Lender Impact Badges</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifiable on-chain recognition tiers earned through cumulative micro-lending capital deployment.
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-[#090e1a] border border-[#172554] text-xs font-mono text-indigo-400 tabular-nums">
          Deployed: ${store.portfolio.totalLentUSD} USD
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {store.badges.map((badge) => {
          const isUnlocked = badge.unlocked;
          const progressPct = Math.min(100, Math.round((store.portfolio.totalLentUSD / badge.thresholdUSD) * 100));

          return (
            <div
              key={badge.tier}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-[#0e1526] border-indigo-500/50 shadow-md'
                  : 'bg-[#090e1a] border-slate-800/80 opacity-75'
              }`}
            >
              {/* Badge Header with Phosphor Icon (Zero emojis) */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    isUnlocked 
                      ? 'bg-indigo-950/80 border-indigo-700/60' 
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    {renderBadgeIcon(badge.tier, isUnlocked)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block font-mono">
                      Tier: {badge.tier}
                    </span>
                    <h4 className="text-sm font-bold text-white font-['Syne']">
                      {badge.title}
                    </h4>
                  </div>
                </div>

                {isUnlocked ? (
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-600/40 text-[10px] font-bold flex items-center space-x-1">
                    <CheckCircle size={12} weight="bold" />
                    <span>Minted</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-semibold flex items-center space-x-1">
                    <Lock size={12} />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 my-4 leading-relaxed">
                {badge.description}
              </p>

              {/* Perks List */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800/80 mb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Perks & Privileges
                </span>
                {badge.perks.map((perk, i) => (
                  <div key={i} className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                    <Sparkle size={10} className="text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{perk}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar / Unlocked Status */}
              <div>
                {isUnlocked ? (
                  <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-center">
                    <span className="text-[11px] font-medium text-indigo-300 font-mono">
                      Unlocked on {badge.unlockedAt || '2026-09-05'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>Progress</span>
                      <span>${store.portfolio.totalLentUSD} / ${badge.thresholdUSD}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-900 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
