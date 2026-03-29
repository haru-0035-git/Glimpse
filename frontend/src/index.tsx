import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ensureCsrfToken } from './auth';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
axios.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();
  if (!['get', 'head', 'options', 'trace'].includes(method)) {
    await ensureCsrfToken();
  }
  return config;
});

void ensureCsrfToken();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
