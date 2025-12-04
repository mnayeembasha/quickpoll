import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/context/SocketContext';
import { store } from '@/store';

import HomePage from '@/components/HomePage';
import TeacherDashboard from '@/components/TeacherDashboard';
import StudentInterface from '@/components/StudentInterface';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <Provider store={store}>
      <SocketProvider>
        <div className="min-h-screen">
          {currentPath === '/' && <HomePage />}
          {currentPath === '/teacher' && <TeacherDashboard />}
          {currentPath === '/student' && <StudentInterface />}
        </div>
        <Toaster position="top-right" />
      </SocketProvider>
    </Provider>
  );
};

export default App;