import React, { useState } from 'react';

const USERS = [
  { username: 'Administrator', password: 'Laadplan-2026!' },
  { username: 'Jochen',        password: 'Laadplan-Belli' },
];

const C = {
  darkBg:  '#0d1c22',
  panelBg: '#122028',
  border:  '#1e3a46',
  teal:    '#9EC5CB',
  tealDark:'#2B5F6E',
  green:   '#B7D2AE',
  gold:    '#D0AC41',
  text:    '#ffffff',
  textMid: '#b0d4db',
  textDim: '#7aacb4',
  warn:    '#E8683A',
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      const match = USERS.find(u => u.username === username && u.password === password);
      if (match) {
        onLogin(match.username);
      } else {
        setError('Gebruikersnaam of wachtwoord onjuist.');
        setLoading(false);
      }
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: C.darkBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Achtergrond decoratie */}
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 500, height: 500, borderRadius: '50%',
        background: C.tealDark, opacity: 0.12,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: '#3A6B4A', opacity: 0.10,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 480, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>
            belli
          </div>
          <div style={{ width: 48, height: 2, background: C.teal, margin: '0 auto' }} />
        </div>

        {/* Titel */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 42, fontWeight: 800, color: C.text,
            margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px',
          }}>
            Strategisch Laadplan
          </h1>
          <p style={{
            fontSize: 16, color: C.textMid, marginTop: 14,
            fontWeight: 400, lineHeight: 1.5,
          }}>
            Datagedreven laadinfrastructuur<br />voor uw gemeente
          </p>
          <div style={{
            display: 'inline-block', marginTop: 14,
            fontSize: 11, fontWeight: 700, color: C.gold,
            background: C.gold + '18', border: `1px solid ${C.gold}44`,
            borderRadius: 4, padding: '3px 10px', letterSpacing: '0.5px',
          }}>
            2026
          </div>
        </div>

        {/* Login card */}
        <div style={{
          width: '100%',
          background: C.panelBg,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '36px 36px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              GEBRUIKERSNAAM
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
              placeholder="Voer uw naam in"
              style={{
                width: '100%', background: '#0a1620',
                border: `1px solid ${error ? C.warn : C.border}`,
                borderRadius: 8, padding: '12px 14px',
                color: C.text, fontSize: 14, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = C.teal}
              onBlur={e => e.target.style.borderColor = error ? C.warn : C.border}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.textDim, letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              WACHTWOORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Voer uw wachtwoord in"
              style={{
                width: '100%', background: '#0a1620',
                border: `1px solid ${error ? C.warn : C.border}`,
                borderRadius: 8, padding: '12px 14px',
                color: C.text, fontSize: 14, outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = C.teal}
              onBlur={e => e.target.style.borderColor = error ? C.warn : C.border}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: C.warn, marginBottom: 16,
              background: C.warn + '18', border: `1px solid ${C.warn}44`,
              borderRadius: 6, padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !username || !password}
            style={{
              width: '100%', padding: '13px 0',
              background: (!username || !password) ? '#1e3a46' : C.tealDark,
              color: (!username || !password) ? C.textDim : '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: (!username || !password) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Inloggen…' : 'Inloggen'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, fontSize: 11, color: C.textDim, textAlign: 'center', lineHeight: 1.8 }}>
          Belli BV &nbsp;·&nbsp; Onafhankelijk advies laadinfrastructuur &nbsp;·&nbsp; belli.eu
        </div>
      </div>
    </div>
  );
}
