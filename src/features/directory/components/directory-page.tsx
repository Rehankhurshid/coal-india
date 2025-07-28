"use client";

import React from 'react';
import { DirectoryProvider } from '../store/directory.context';
import { DirectoryContent } from './directory-content';

export function DirectoryPage() {
  return (
    <DirectoryProvider>
      <DirectoryContent />
    </DirectoryProvider>
  );
}
