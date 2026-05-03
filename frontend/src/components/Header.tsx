import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AUTH_STATE_EVENT, fetchCurrentUser, logout } from "../auth";
import "./Header.css";

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const updateAuthState = useCallback(async () => {
    const user = await fetchCurrentUser();
    setIsLoggedIn(Boolean(user));
  }, []);

  useEffect(() => {
    updateAuthState();

    const handleAuthEvent = () => {
      void updateAuthState();
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthEvent);
    window.addEventListener("focus", handleAuthEvent);

    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthEvent);
      window.removeEventListener("focus", handleAuthEvent);
    };
  }, [updateAuthState]);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    navigate("/");
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const authLinkTo = isLoggedIn ? "/admin" : "/login";

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          Glimpse
        </Link>
        <button
          type="button"
          className={`header-menu-toggle ${isMenuOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`header-nav ${isMenuOpen ? "open" : ""}`}>
          {isLoggedIn ? (
            <>
              <Link to={authLinkTo} className="header-button" onClick={closeMenu}>
                管理
              </Link>
              <button type="button" className="header-button" onClick={handleLogout}>
                ログアウト
              </button>
            </>
          ) : (
            <Link to="/login" className="header-button" onClick={closeMenu}>
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
