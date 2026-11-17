import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

const SIZES = { md: 'max-w-xl', lg: 'max-w-2xl' };

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, size = 'md', className, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-4 pt-[8vh] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'mb-8 w-full rounded-xl bg-white shadow-2xl ring-1 ring-zinc-200 animate-modal-in',
          SIZES[size],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
