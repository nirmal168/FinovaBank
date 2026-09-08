import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger | primary | warning
  isLoading = false,
  icon: CustomIcon,
}) => {
  let iconComponent = <AlertTriangle className="h-6 w-6 text-rose-600" />;
  let iconBg = 'bg-rose-100';

  if (variant === 'warning') {
    iconComponent = <AlertTriangle className="h-6 w-6 text-amber-600" />;
    iconBg = 'bg-amber-100';
  } else if (variant === 'primary') {
    iconComponent = <Info className="h-6 w-6 text-brand-600" />;
    iconBg = 'bg-brand-100';
  } else if (variant === 'success') {
    iconComponent = <CheckCircle2 className="h-6 w-6 text-emerald-600" />;
    iconBg = 'bg-emerald-100';
  }

  if (CustomIcon) {
    iconComponent = <CustomIcon className="h-6 w-6" />;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              variant === 'danger'
                ? '!bg-rose-600 hover:!bg-rose-700 !text-white'
                : variant === 'warning'
                ? '!bg-amber-600 hover:!bg-amber-700 !text-white'
                : ''
            }
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
          {iconComponent}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
