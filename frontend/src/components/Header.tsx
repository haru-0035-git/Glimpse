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
          {isLoggedIn ? (
            <Link to={authLinkTo} className="header-link">管理</Link>
          ) : (
            <>
              <Link to="/login" className="header-link">ログイン</Link>
              <Link to="/signup" className="header-link">新規登録</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
