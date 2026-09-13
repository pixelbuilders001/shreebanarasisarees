"use client";

import React from 'react';
import { useStore } from '../context/StoreContext';
import { AuthModal } from './AuthModal';

export const GlobalAuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen } = useStore();

  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
    />
  );
};
