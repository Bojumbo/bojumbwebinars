'use client';

import { useState, useEffect } from 'react';
import { Upload, Calendar, Plus, Play, Database, List, ShieldCheck, Lock, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
    duration: '3600'
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2856023b') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      fetchData();
    } else {
      alert('Невірний пароль');
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

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Lock size={48} style={{ marginBottom: '1.5rem', color: 'var(--accent)' }} />
          <h2 style={{ marginBottom: '2rem' }}>Вхід в Адмін-панель</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary">Увійти</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck color="var(--accent)" size={32} /> Панель Керування
          </h1>
          <button className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }} onClick={() => {
            sessionStorage.removeItem('admin_auth');
            setIsAuthenticated(false);
          }}>Вийти</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <button className={`btn-primary ${activeTab !== 'list' ? 'glass' : ''}`} onClick={() => setActiveTab('list')} style={{ background: activeTab === 'list' ? '' : 'transparent' }}>
            <List size={18} /> Список вебінарів
          </button>
          <button className={`btn-primary ${activeTab !== 'create' ? 'glass' : ''}`} onClick={() => setActiveTab('create')} style={{ background: activeTab === 'create' ? '' : 'transparent' }}>
            <Plus size={18} /> Створити
          </button>
          <button className={`btn-primary ${activeTab !== 'library' ? 'glass' : ''}`} onClick={() => setActiveTab('library')} style={{ background: activeTab === 'library' ? '' : 'transparent' }}>
            <Upload size={18} /> Бібліотека
          </button>
          <button className={`btn-primary ${activeTab !== 'codes' ? 'glass' : ''}`} onClick={() => setActiveTab('codes')} style={{ background: activeTab === 'codes' ? '' : 'transparent' }}>
            <Database size={18} /> Коди
          </button>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          {activeTab === 'list' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {webinars.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Вебінарів ще не створено</p>}
                {webinars.map(w => {
                  const now = new Date().getTime();
                  const start = new Date(w.startTime).getTime();
                  const end = start + (w.duration || 3600) * 1000;
                  
                  let status = { text: 'Заплановано', color: 'var(--text-muted)' };
                  if (now >= start && now < end) {
                    status = { text: 'ОНЛАЙН', color: '#ff4b4b' };
                  } else if (now >= end) {
                    status = { text: 'Завершено', color: 'var(--success)' };
                  }

                  return (
                    <div key={w.id} className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{w.title}</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: status.color, border: `1px solid ${status.color}44` }}>
                          {status.text}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> {new Date(w.startTime).toLocaleString()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Play size={14} /> {Math.round(w.duration / 60)} хв.</div>
                      </div>
                      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <Link href={`/webinar/${w.id}`} target="_blank" className="btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', padding: '0.5rem' }}>
                          <ExternalLink size={14} /> Перегляд
                        </Link>
                        <button 
                          className="glass" 
                          style={{ padding: '0.5rem', color: 'var(--error)', cursor: 'pointer' }}
                          onClick={() => handleDeleteWebinar(w.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateWebinar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="col-span-2">
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Назва вебінару</label>
                  <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Відео URL (або завантажте в бібліотеці)</label>
                  <input type="text" className="input-field" placeholder="/uploads/video.mp4" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Час початку</label>
                  <input type="datetime-local" className="input-field" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Глядачі (база)</label>
                  <input type="number" className="input-field" value={formData.fakeViewersBase} onChange={e => setFormData({...formData, fakeViewersBase: e.target.value})} />
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>Чат пресети (авто-повідомлення)</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Формат: [секунда] | [ім'я] | [текст] (наприклад: 10 | Іван | Всім привіт!)</p>
                <textarea 
                  className="input-field" 
                  style={{ height: '150px', fontFamily: 'monospace' }} 
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

              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}><Plus size={18} /> Створити автовебінар</button>
            </form>
          )}

          {activeTab === 'library' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3>Ваші відео</h3>
                <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Upload size={18} /> {uploading ? 'Завантаження...' : 'Завантажити нове'}
                  <input type="file" hidden onChange={handleFileUpload} accept="video/*" />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {uploadedFiles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Відео поки немає</p>}
                {uploadedFiles.map(file => (
                  <div key={file.url} className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ height: '100px', background: '#000', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={24} />
                    </div>
                    <p style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                    <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', marginTop: '0.5rem' }} onClick={() => setFormData({...formData, videoUrl: file.url})}>Вибрати</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'codes' && (
             <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <h3>Реєстрації (Коди доступу)</h3>
                  <button className="btn-primary" onClick={fetchData}>Оновити список</button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1rem' }}>Код</th>
                      <th style={{ padding: '1rem' }}>Ім’я</th>
                      <th style={{ padding: '1rem' }}>Контакт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.length === 0 && (
                       <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Реєстрацій поки немає</td></tr>
                    )}
                    {codes.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{c.code}</td>
                        <td style={{ padding: '1rem' }}>{c.usedBy || '—'}</td>
                        <td style={{ padding: '1rem' }}>{c.contact || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>
    </main>
  );
}
