import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/header/header';
import Footer from './components/footer/footer';
import { ContextProvider } from './components/login/context';
import Topbar from './components/topbar/topbar';
import { setupAxiosInterceptors } from './components/login/userService';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  return (
    <ContextProvider>
      <div>
        <div className='topbar'>
          <Topbar />
        </div>
        <div className='header'>
          <Header />
        </div>
        <div className='outlet'>
          <Outlet />
        </div>
        <div className='footer'>
          <Footer />
        </div>
      </div>
    </ContextProvider>
  );
}

export default App;