'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, User, Ticket } from 'lucide-react';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        localStorage.setItem('viewer_name', name);
        localStorage.setItem('viewer_code', code);
        
        // Find an active webinar to join
        const webinarRes = await fetch('/api/admin/webinars');
        const webinars = await webinarRes.json();
        
        if (webinars.length > 0) {
          // Redirect to the first available webinar
          router.push(`/webinar/${webinars[0].id}`);
        } else {
          setError('Наразі немає активних вебінарів.');
        }
      } else {
        setError('Невірний код запрошення');
      }
    } catch (err) {
      setError('Сталася помилка. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div className="glass" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2.5rem',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--accent)' }}>Auto</span>Webinar
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Введіть дані для входу</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <User size={16} /> Ваше Ім'я
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Олександр"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Ticket size={16} /> Код запрошення
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Перевірка...' : <><LogIn size={18} /> Увійти</>}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
