import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: React.ReactNode;
  range?: number;
  strength?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  range = 45,
  strength = 0.35,
  className = '',
  onClick,
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const springConfig = { stiffness: 150, damping: 15, mass: 0.6 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Center point of the button
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Calculate distance
    const dist = Math.hypot(clientX - centerX, clientY - centerY);

    if (dist < range) {
      // Magnetic pull
      const targetX = (clientX - centerX) * strength;
      const targetY = (clientY - centerY) * strength;
      x.set(targetX);
      y.set(targetY);
    } else {
      // Return to center
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      style={{ x, y }}
      className={cn(
        "relative inline-flex items-center justify-center transition-all cursor-pointer select-none",
        !disabled && "hover:scale-[1.03]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="relative z-10 block pointer-events-none w-full h-full flex items-center justify-center gap-inherit">{children}</span>
    </motion.button>
  );
}
