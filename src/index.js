import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App tab="home" />);