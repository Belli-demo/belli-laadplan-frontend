import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import AppWithOnboarding from './AppWithOnboarding';
import Login from './Login';

function Root() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;
  return <AppWithOnboarding currentUser={user} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
