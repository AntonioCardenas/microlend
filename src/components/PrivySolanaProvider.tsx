import React, { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

function getPrivyAppId(): string | null {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_PRIVY_APP_ID) {
      const id = String(import.meta.env.PUBLIC_PRIVY_APP_ID).trim();
      // Valid Privy App IDs are 25 chars starting with "cl" or "cm"
      if ((id.startsWith('cl') || id.startsWith('cm')) && id.length === 25) return id;
    }
  } catch {
    // Ignore SSR errors
  }
  return null;
}

interface PrivySolanaProviderProps {
  children: React.ReactNode;
}

export default function PrivySolanaProvider({ children }: PrivySolanaProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const appId = getPrivyAppId();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (!appId) {
    // Render children without Privy if no valid App ID configured
    console.warn(
      '[PrivySolanaProvider] No valid PUBLIC_PRIVY_APP_ID found.\n' +
      '  1. Go to https://dashboard.privy.io\n' +
      '  2. Create an app → copy the App ID (25 chars, starts with "cl")\n' +
      '  3. Add PUBLIC_PRIVY_APP_ID=<your-id> to .env\n' +
      '  4. Restart the dev server'
    );
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#4f46e5',
          showWalletLoginFirst: false,
          walletList: ['phantom', 'solflare', 'backpack'],
        },
        loginMethods: ['email', 'wallet', 'google'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
