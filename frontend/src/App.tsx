import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ArticleForm from './pages/ArticleForm';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/new" element={<ArticleForm />} />
          <Route path="/admin/edit/:id" element={<ArticleForm />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
