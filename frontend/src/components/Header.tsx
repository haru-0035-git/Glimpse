import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Header.css';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const updateAuthState = useCallback(() => {
    setIsLoggedIn(!!localStorage.getItem('jwtToken'));
  }, []);

  useEffect(() => {
    updateAuthState();

    const handleStorageChange = () => updateAuthState();
    const handleCustomTokenEvent = () => updateAuthState();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('jwt-token-update', handleCustomTokenEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jwt-token-update', handleCustomTokenEvent);
    };
  }, [updateAuthState]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('jwtToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    window.dispatchEvent(new Event('jwt-token-update'));
    navigate('/');
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const authLinkTo = isLoggedIn ? '/admin' : '/login';

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header-logo" onClick={closeMenu}>Glimpse</Link>
        <button
          type="button"
          className={`header-menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="メニューを開く"
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          {isLoggedIn ? (
            <>
              <Link to={authLinkTo} className="header-button" onClick={closeMenu}>管理</Link>
              <button type="button" className="header-button" onClick={handleLogout}>ログアウト</button>
            </>
          ) : (
            <Link to="/login" className="header-button" onClick={closeMenu}>ログイン</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
