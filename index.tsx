import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { StoreProvider } from './context/StoreContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  </React.StrictMode>
);