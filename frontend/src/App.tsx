import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import ArticleForm from './pages/ArticleForm';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/new" element={<ProtectedRoute><ArticleForm /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute><ArticleForm /></ProtectedRoute>} />
          <Route path="/admin/articles/:id" element={<ProtectedRoute><ArticleDetail showAdminButtons={true} /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
