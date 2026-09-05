import React, { useEffect, useState } from 'react';

export default function AppLoader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fast initial progress tick to immediately signal activity
    const timer1 = setTimeout(() => setProgress(65), 100);
    const timer2 = setTimeout(() => setProgress(100), 320);
    const timer3 = setTimeout(() => setFadeOut(true), 450);
    const timer4 = setTimeout(() => setLoading(false), 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      id="app-loader-container"
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={!loading}
    >
      {/* Sleek top indicator bar */}
      <div className="h-0.5 w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
