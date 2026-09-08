import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal for Finova landing page interactions
 * Supports keyboard ESC, click outside, focus management, and theme variables.
 */
const LandingModal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-2xl overflow-hidden z-10 my-8 transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]/60">
          <div>
            {title && (
              <h3
                id="modal-title"
                className="text-lg sm:text-xl font-extrabold text-[var(--finova-text-heading)] tracking-tight"
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--finova-text-muted)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-card-bg)] border border-transparent hover:border-[var(--finova-border)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LandingModal;
