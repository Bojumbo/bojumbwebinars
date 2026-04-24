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
      padding: '1rem',
      background: 'var(--background)'
    }}>
      <div className="glass" style={{ 
        width: '100%', 
        maxWidth: '430px', 
        padding: '3rem',
        animation: 'fadeIn 0.8s ease-out',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Accent Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent)' }} />

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent)' }}>
            <LogIn size={32} />
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            Приєднатися
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Будь ласка, введіть ваші дані для доступу</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              <User size={14} /> ВАШЕ ІМ'Я
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Як вас звати?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', width: '100%', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              <Ticket size={14} /> КОД ЗАПРОШЕННЯ
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', width: '100%', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--error)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem', 
              marginTop: '1rem', 
              height: '56px', 
              fontSize: '1.05rem',
              width: '100%'
            }}
          >
            {loading ? 'Перевірка...' : 'Увійти до вебінару'}
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
