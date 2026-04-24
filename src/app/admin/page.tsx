'use client';

import { useState, useEffect } from 'react';
import { Upload, Calendar, Plus, Play, Database, List, Shield, Lock, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'library' | 'codes'>('list');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, url: string}[]>([]);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    startTime: '',
    fakeViewersBase: '500',
    duration: '3600',
    chatPresets: [] as any[]
  });

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const resW = await fetch('/api/admin/webinars');
      setWebinars(await resW.json());
      
      const resC = await fetch('/api/admin/codes');
      setCodes(await resC.json());

      const resL = await fetch('/api/admin/library');
      if (resL.ok) setUploadedFiles(await resL.json());
    } catch (e) {
      console.error(e);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setUploadedFiles(prev => [...prev, { name: data.name, url: data.url }]);
        setFormData(prev => ({ ...prev, videoUrl: data.url }));
        alert('Файл завантажено!');
      }
    } catch (err) {
      alert('Помилка завантаження');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-detect duration if not set
    let duration = parseInt(formData.duration);
    if (formData.videoUrl) {
      const vid = document.createElement('video');
      vid.src = formData.videoUrl;
      await new Promise((resolve) => {
        vid.onloadedmetadata = () => {
          duration = Math.round(vid.duration);
          resolve(null);
        };
        vid.onerror = () => resolve(null); // Fallback to current
      });
    }

    try {
      const res = await fetch('/api/admin/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, duration }),
      });
      if (res.ok) {
        alert('Вебінар створено!');
        fetchData();
        setActiveTab('list');
      }
    } catch (e) {
      alert('Помилка створення');
    }
  };

  const handleDeleteWebinar = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей вебінар?')) return;
    
    try {
      const res = await fetch(`/api/admin/webinars?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      alert('Помилка видалення');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt...');
    if (password.trim() === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      fetchData();
    } else {
      alert('Невірний пароль');
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c29' }}>
        <div className="glass" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Lock size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent)' }} />
          <h2 style={{ marginBottom: '2rem' }}>Вхід в Адмін-панель</h2>
          <form onSubmit={handleLogin} method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} defaultValue="admin" />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" className="btn-primary">Увійти</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', background: 'var(--background)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Shield size={24} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Панель керування</h1>
          </div>
          <button className="glass" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }} onClick={() => {
            sessionStorage.removeItem('admin_auth');
            setIsAuthenticated(false);
          }}>Вийти</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'list', icon: <List size={18} />, label: 'Вебінари' },
            { id: 'create', icon: <Plus size={18} />, label: 'Створити' },
            { id: 'library', icon: <Upload size={18} />, label: 'Бібліотека' },
            { id: 'codes', icon: <Database size={18} />, label: 'Слухачі' }
          ].map(tab => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? 'btn-primary' : 'glass'} 
              onClick={() => setActiveTab(tab.id as any)} 
              style={{ 
                flex: '1',
                minWidth: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.8rem',
                background: activeTab === tab.id ? 'var(--accent)' : '#fff',
                color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="glass" style={{ padding: '2.5rem', background: '#fff' }}>
          {activeTab === 'list' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                {webinars.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <List size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Вебінарів ще не створено</p>
                  </div>
                )}
                {webinars.map((w: any) => {
                  const now = new Date().getTime();
                  const start = new Date(w.startTime).getTime();
                  const durationValue = parseInt(String(w.duration || 3600));
                  const end = start + durationValue * 1000;
                  
                  let status = { text: 'ЗАПЛАНОВАНО', color: 'var(--text-muted)', bg: '#f1f5f9' };
                  if (now >= start && now < end) {
                    status = { text: 'В ЕФІРІ', color: '#ef4444', bg: '#fef2f2' };
                  } else if (now >= end) {
                    status = { text: 'ЗАВЕРШЕНО', color: 'var(--success)', bg: '#ecfdf5' };
                  }

                  return (
                    <div key={w.id} style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{w.title}</h3>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.4rem 0.6rem', borderRadius: '6px', background: status.bg, color: status.color, border: `1px solid ${status.color}22` }}>
                          {status.text}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Calendar size={16} /> {new Date(w.startTime).toLocaleString('uk-UA')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Play size={16} /> {Math.round(durationValue / 60)} хвилин</div>
                      </div>
                      <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem' }}>
                        <Link href={`/webinar/${w.id}`} target="_blank" className="btn-primary" style={{ flex: 1, fontSize: '0.9rem', height: '44px' }}>
                          <ExternalLink size={16} /> Перегляд
                        </Link>
                        <button 
                          className="glass" 
                          style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', border: '1px solid #fee2e2', background: '#fef2f2' }}
                          onClick={() => handleDeleteWebinar(w.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateWebinar} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>Назва вебінару</label>
                  <input type="text" className="input-field" placeholder="Вебінар по збору контактів" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>Відео URL</label>
                  <input type="text" className="input-field" placeholder="/uploads/video.mp4" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} style={{ border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>Початок</label>
                  <input type="datetime-local" className="input-field" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} style={{ border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>Базова к-сть глядачів</label>
                  <input type="number" className="input-field" value={formData.fakeViewersBase} onChange={e => setFormData({...formData, fakeViewersBase: e.target.value})} style={{ border: '1px solid #e2e8f0' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>Чат пресети</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Формат: [секунда] | [ім'я] | [текст]</p>
                <textarea 
                  className="input-field" 
                  style={{ height: '180px', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid #e2e8f0' }} 
                  placeholder="10 | Іван | Привіт!&#10;15 | Марія | Чи буде запис?"
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    const presets = lines.map(line => {
                      const [time, name, text] = line.split('|').map(s => s.trim());
                      if (time && name && text) {
                        return { id: Math.random().toString(), senderName: name, text, timestamp: parseInt(time) };
                      }
                      return null;
                    }).filter(Boolean);
                    setFormData({...formData, chatPresets: presets} as any);
                  }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>
                Створити автовебінар
              </button>
            </form>
          )}

          {activeTab === 'library' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Медіа бібліотека</h3>
                <label className="btn-primary" style={{ cursor: 'pointer', height: '44px' }}>
                  <Upload size={18} /> {uploading ? 'Завантаження...' : 'Нове відео'}
                  <input type="file" hidden onChange={handleFileUpload} accept="video/*" />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
                {uploadedFiles.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Play size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p>Тут з'являться ваші завантажені відео</p>
                  </div>
                )}
                {uploadedFiles.map(file => (
                  <div key={file.url} style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', background: '#fff', textAlign: 'center' }}>
                    <div style={{ height: '120px', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <Play size={32} />
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '1rem' }}>{file.name}</p>
                    <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem', height: '36px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }} onClick={() => { setFormData({...formData, videoUrl: file.url}); setActiveTab('create'); }}>Обрати відео</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'codes' && (
             <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Список реєстрацій</h3>
                  <button className="glass" style={{ padding: '0.6rem 1.2rem', color: 'var(--accent)', fontWeight: 600, border: '1px solid var(--accent-glow)' }} onClick={fetchData}>Оновити дані</button>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <th style={{ padding: '1rem' }}>КОД ДОСТУПУ</th>
                        <th style={{ padding: '1rem' }}>ІМ'Я ГЛЯДАЧА</th>
                        <th style={{ padding: '1rem' }}>КОНТАКТИ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.length === 0 && (
                         <tr><td colSpan={3} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Дані відсутні</td></tr>
                      )}
                      {codes.map((c: any, i: number) => (
                        <tr key={i} style={{ background: '#f8fafc' }}>
                          <td style={{ padding: '1.25rem', fontWeight: 800, color: 'var(--accent)', borderRadius: '12px 0 0 12px' }}>{c.code}</td>
                          <td style={{ padding: '1.25rem', fontWeight: 600 }}>{c.usedBy || <span style={{ opacity: 0.3 }}>—</span>}</td>
                          <td style={{ padding: '1.25rem', color: 'var(--text-muted)', borderRadius: '0 12px 12px 0' }}>{c.contact || <span style={{ opacity: 0.3 }}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}
