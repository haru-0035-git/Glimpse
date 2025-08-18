import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header-logo">Glimpse</Link>
        <nav className="header-nav">
          <Link to="/">Home</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/login">Login</Link> {/* Added Login Link */}
        </nav>
      </div>
    </header>
  );
};

export default Header;
