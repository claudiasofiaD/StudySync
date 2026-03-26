import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./style/App.css";
import reportWebVitals from './reportWebVitals';

// Toast provider
import { Toaster } from "react-hot-toast";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <>
    {/* Global toast notifications */}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2500,
        style: {
          background: "#1f2937",
          color: "#fff",
          borderRadius: "6px",
        },
      }}
    />

    <App />
  </>
);

reportWebVitals();
