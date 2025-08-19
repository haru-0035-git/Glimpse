import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    setIsLoggedIn(!!token);

    // Optional: Add an event listener for storage changes if you want real-time updates
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('jwtToken'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const authLinkTo = isLoggedIn ? '/admin' : '/login';

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header-logo">Glimpse</Link>
        <nav className="header-nav">
          <Link to={authLinkTo} className="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
