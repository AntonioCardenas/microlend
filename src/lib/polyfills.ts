import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  if (!(window as any).Buffer) {
    (window as any).Buffer = Buffer;
  }
  if (!(window as any).global) {
    (window as any).global = window;
  }
}

export { Buffer };
