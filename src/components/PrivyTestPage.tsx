import React, { useState } from 'react';
import PrivySolanaProvider from './PrivySolanaProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { Lightning, WarningCircle } from '@phosphor-icons/react';

function PrivyTestContent() {
  const [log, setLog] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const solanaWallet = wallets?.[0] ?? null;

  const addLog = (msg: string) =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);

  const handleLogin = async () => {
    try {
      addLog('Initiating Privy login...');
      await login();
      addLog('Login modal opened');
    } catch (e: any) {
      addLog(`Login error: ${e?.message ?? e}`);
    }
  };

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      addLog('Creating Privy Solana embedded wallet...');
      const { wallet: w } = await createWallet();
      addLog(`Wallet created: ${w?.address}`);
    } catch (e: any) {
      addLog(`Create wallet error: ${e?.message ?? e}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      addLog('Logging out...');
      await logout();
      addLog('Logged out');
    } catch (e: any) {
      addLog(`Logout error: ${e?.message ?? e}`);
    }
  };

  const privyAppId = (() => {
    try {
      const id = String(import.meta.env?.PUBLIC_PRIVY_APP_ID ?? '').trim();
      return (id.startsWith('cl') || id.startsWith('cm')) && id.length === 25 ? id : null;
    } catch { return null; }
  })();

  const isConfigured = !!privyAppId;

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-mono mb-4">
            <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>Privy SDK {isConfigured ? 'Configured' : 'Not Configured'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Syne'] tracking-tight">
            Privy Integration Test
          </h1>
          <p className="text-sm text-slate-400">
            Test wallet connect, embedded wallet creation, and account status
          </p>
        </div>

        {/* Config Warning */}
        {!isConfigured && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-3">
            <div className="flex items-center space-x-2">
              <WarningCircle size={20} className="text-amber-400 flex-shrink-0" weight="bold" />
              <span className="text-amber-300 font-bold text-sm">Privy App ID Not Configured</span>
            </div>
            <p className="text-amber-200/70 text-xs leading-relaxed">
              The Privy provider won't load without a valid App ID. Follow these steps:
            </p>
            <ol className="text-xs text-amber-200/70 space-y-1.5 list-decimal list-inside">
              <li>
                Go to{' '}
                <a href="https://dashboard.privy.io" target="_blank" rel="noreferrer"
                  className="text-amber-300 underline hover:text-amber-100">
                  dashboard.privy.io
                </a>{' '}
                and sign in
              </li>
              <li>Create a new app (or select existing)</li>
              <li>Copy the App ID from Settings (25 chars, starts with <code className="font-mono bg-amber-900/50 px-1 rounded">cl</code>)</li>
              <li>
                Edit{' '}
                <code className="font-mono bg-amber-900/50 px-1 rounded">.env</code>:
                {' '}<code className="font-mono bg-amber-900/50 px-1 rounded">PUBLIC_PRIVY_APP_ID=cl...</code>
              </li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border text-center ${ready ? 'bg-emerald-950/30 border-emerald-700/40' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-xs text-slate-400 mb-1">SDK Ready</div>
            <div className={`text-sm font-bold font-mono ${ready ? 'text-emerald-400' : 'text-slate-500'}`}>
              {ready ? 'Yes' : 'Loading...'}
            </div>
          </div>
          <div className={`p-3 rounded-xl border text-center ${authenticated ? 'bg-indigo-950/40 border-indigo-700/40' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-xs text-slate-400 mb-1">Authenticated</div>
            <div className={`text-sm font-bold font-mono ${authenticated ? 'text-indigo-400' : 'text-slate-500'}`}>
              {authenticated ? 'Yes' : 'No'}
            </div>
          </div>
          <div className={`p-3 rounded-xl border text-center ${solanaWallet ? 'bg-violet-950/30 border-violet-700/40' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-xs text-slate-400 mb-1">Solana Wallet</div>
            <div className={`text-sm font-bold font-mono ${solanaWallet ? 'text-violet-400' : 'text-slate-500'}`}>
              {solanaWallet ? 'Active' : 'None'}
            </div>
          </div>
        </div>

        {/* User Info */}
        {authenticated && user && (
          <div className="p-4 rounded-xl bg-[#0e1526] border border-slate-800 space-y-2 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Privy User</div>
            <div className="flex justify-between">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-slate-200 truncate max-w-[200px]">{user.id}</span>
            </div>
            {solanaWallet && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wallet Address</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-indigo-300 truncate max-w-[180px]">{solanaWallet.address}</span>
                  <a
                    href={`https://explorer.solana.com/address/${solanaWallet.address}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-indigo-400 transition-colors"
                    title="View on Solana Explorer"
                  >
                    ↗
                  </a>
                </div>
              </div>
            )}
            {wallets && wallets.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Wallets count</span>
                <span className="font-mono text-slate-200">{wallets.length}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!authenticated ? (
            <button
              id="privy-connect-btn"
              onClick={handleLogin}
              disabled={!isConfigured || !ready}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center space-x-3 transition-all shadow-lg shadow-indigo-900/40 cursor-pointer"
            >
              <Lightning size={20} weight="fill" />
              <span>Connect Wallet via Privy</span>
            </button>
          ) : (
            <div className="space-y-3">
              {!solanaWallet && (
                <button
                  id="privy-create-wallet-btn"
                  onClick={handleCreateWallet}
                  disabled={isCreating}
                  className="w-full py-4 px-6 rounded-2xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white font-bold text-base flex items-center justify-center space-x-3 transition-all shadow-lg cursor-pointer"
                >
                  <span>+</span>
                  <span>{isCreating ? 'Creating Wallet…' : 'Create Privy Solana Wallet'}</span>
                </button>
              )}
              <button
                id="privy-logout-btn"
                onClick={handleLogout}
                className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 hover:text-rose-300 font-semibold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>↩</span>
                <span>Disconnect / Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">Event Log</div>
          {log.length === 0 ? (
            <p className="text-xs text-slate-600 font-mono">No events yet — click a button above to start testing</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className="text-xs font-mono text-slate-300 leading-relaxed">{entry}</div>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to LendingChain
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PrivyTestPage() {
  return (
    <PrivySolanaProvider>
      <PrivyTestContent />
    </PrivySolanaProvider>
  );
}
