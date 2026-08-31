import React from 'react';
import { useApp } from '../../context/AppContext';
import { UnifiedAuthCard } from '../common/UnifiedAuthCard';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, setAuthRedirectMessage } = useApp();

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setAuthRedirectMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-up">
        <UnifiedAuthCard
          onClose={handleClose}
          onSuccessCustomer={handleClose}
          embeddedInModal={true}
        />
      </div>
    </div>
  );
};
