import React, { useState } from 'react';
import { supabase } from './supabase.js';

function LoginView({ accent = "#3fb98a" }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let errorResult;

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      errorResult = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      errorResult = error;
    }

    if (errorResult) {
      setError(errorResult.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container" style={{ "--accent": accent }}>
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark" style={{ background: accent }} />
          <span className="brand-name">Cadence</span>
        </div>
        
        <h2 className="login-title">{isRegister ? "Create an account" : "Welcome back"}</h2>
        <p className="login-sub">
          {isRegister ? "Sign up to start tracking your habits." : "Sign in to continue to your calendar."}
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Email address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>
          <button type="submit" className="login-btn" style={{ background: accent }} disabled={loading}>
            {loading ? "Please wait..." : (isRegister ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div className="login-toggle">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" className="ghost-btn-inline" style={{ color: accent }} onClick={() => { setIsRegister(!isRegister); setError(null); }}>
            {isRegister ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
      
      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          justify-content: center;
        }
        .login-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          text-align: center;
        }
        .login-sub {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 24px 0;
          text-align: center;
        }
        .login-error {
          background: rgba(240, 88, 106, 0.1);
          color: #f0586a;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          border: 1px solid rgba(240, 88, 106, 0.3);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
        }
        .login-field input {
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 12px;
          border-radius: 8px;
          color: var(--text);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-field input:focus {
          border-color: var(--accent);
        }
        .login-btn {
          margin-top: 10px;
          border: none;
          padding: 12px;
          border-radius: 8px;
          color: #0b0b10;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .login-btn:hover {
          opacity: 0.9;
        }
        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .login-toggle {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: var(--muted);
        }
        .ghost-btn-inline {
          background: none;
          border: none;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        .ghost-btn-inline:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default LoginView;
