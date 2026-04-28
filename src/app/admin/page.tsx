'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, List, Trash2, ExternalLink, Calendar, Play, Upload, Database, Lock } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'library' | 'stats'>('list');
  const [webinars, setWebinars] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedWebinarStats, setSelectedWebinarStats] = useState<any>(null);
  const [attendees, setAttendees] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    startTime: '',
    fakeViewersBase: '50',
    chatPresets: []
  });

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const fetchData = async () => {
    try {
      const resW = await fetch('/api/admin/webinars');
      if (resW.ok) setWebinars(await resW.json());
      const resL = await fetch('/api/admin/library');
      if (resL.ok) setUploadedFiles(await resL.json());
    } catch (e) { console.error(e); }
  };

  const fetchStats = async (webinarId: string) => {
    try {
      const res = await fetch(`/api/admin/stats?webinarId=${webinarId}`);
      if (res.ok) setAttendees(await res.json());
      setSelectedWebinarStats(webinarId);
      setActiveTab('stats');
    } catch (e) { console.error(e); }
  };

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    let duration = 3600;
    if (formData.videoUrl) {
      const vid = document.createElement('video');
      vid.src = formData.videoUrl;
      await new Promise((resolve) => {
        vid.onloadedmetadata = () => { duration = Math.round(vid.duration); resolve(null); };
        vid.onerror = () => resolve(null);
      });
    }

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
  };

  const handleDeleteWebinar = async (id: string) => {
    if (!confirm('Видалити цей вебінар?')) return;
    const res = await fetch(`/api/admin/webinars?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        alert('Відео завантажено успішно!');
        fetchData();
      } else {
        alert('Помилка завантаження');
      }
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      alert('Сталася помилка мережі');
      setUploading(false);
    };

    xhr.open('POST', '/api/admin/upload');
    xhr.send(fd);
  };

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="glass" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Shield size={48} style={{ marginBottom: '1.5rem', color: '#4f46e5' }} />
          <h2 style={{ marginBottom: '2rem', color: '#1e293b' }}>Вхід в Адмін-панель</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin123') {
              setIsAuthenticated(true);
              sessionStorage.setItem('admin_auth', 'true');
            } else alert('Невірний пароль');
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="password" className="input-field" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">Увійти</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}><Shield /> Панель керування</h1>
          <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => { sessionStorage.clear(); location.reload(); }}>Вихід</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}>Вебінари</button>
          <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}>Створити</button>
          <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}>Бібліотека</button>
          <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}>Статистика</button>
        </div>

        <div className="glass" style={{ padding: '2rem', background: '#fff' }}>
          {activeTab === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {webinars.map((w: any) => (
                <div key={w.id} className="glass" style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{w.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}><Calendar size={14} /> {new Date(w.startTime).toLocaleString()}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/webinar/${w.id}`} target="_blank" className="btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>Перегляд</Link>
                    <button onClick={() => fetchStats(w.id)} className="glass" style={{ flex: 1, fontSize: '0.8rem' }}>Статистика</button>
                    <button onClick={() => handleDeleteWebinar(w.id)} className="glass" style={{ color: '#ef4444', padding: '0.5rem' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateWebinar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label style={{ fontWeight: 600, color: '#64748b' }}>Назва вебінару</label>
              <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              
              <label style={{ fontWeight: 600, color: '#64748b' }}>Джерело відео</label>
              <select className="input-field" value={uploadedFiles.some(f => f.url === formData.videoUrl) ? formData.videoUrl : "custom"} onChange={(e) => setFormData({...formData, videoUrl: e.target.value === 'custom' ? '' : e.target.value})}>
                <option value="custom">🔗 Власне посилання (URL / YouTube)</option>
                {uploadedFiles.map(f => <option key={f.url} value={f.url}>📹 {f.name}</option>)}
              </select>

              <input type="text" className="input-field" placeholder="URL відео" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
              
              <label style={{ fontWeight: 600, color: '#64748b' }}>Час початку</label>
              <input type="datetime-local" className="input-field" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />

              <label style={{ fontWeight: 600, color: '#64748b' }}>Фейкові глядачі (база)</label>
              <input type="number" className="input-field" value={formData.fakeViewersBase} onChange={e => setFormData({...formData, fakeViewersBase: e.target.value})} />

              <label style={{ fontWeight: 600, color: '#64748b' }}>Чат пресети (сек | ім'я | текст)</label>
              <textarea 
                className="input-field" 
                style={{ height: '150px', fontFamily: 'monospace' }} 
                placeholder="10 | Іван | Привіт!&#10;20 | Марія | Чи буде запис?"
                onChange={(e) => {
                  const presets = e.target.value.split('\n').map(line => {
                    const [time, name, text] = line.split('|').map(s => s.trim());
                    return (time && name && text) ? { id: Math.random().toString(), senderName: name, text, timestamp: parseInt(time) } : null;
                  }).filter(Boolean);
                  setFormData({...formData, chatPresets: presets} as any);
                }}
              />
              
              <button type="submit" className="btn-primary" style={{ padding: '1rem' }}>Створити автовебінар</button>
            </form>
          )}

          {activeTab === 'library' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3>Бібліотека відео</h3>
                <label className="btn-primary" style={{ cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  <Upload size={18} /> {uploading ? `Завантаження ${uploadProgress}%` : 'Завантажити відео'}
                  <input type="file" hidden onChange={handleFileUpload} accept="video/*" disabled={uploading} />
                </label>
              </div>

              {uploading && (
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#4f46e5', transition: 'width 0.3s ease' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {uploadedFiles.map(file => (
                  <div key={file.url} className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                    <Play size={32} style={{ margin: '0 auto 0.5rem', color: '#4f46e5' }} />
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</p>
                    <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem', height: '32px' }} onClick={() => { setFormData({...formData, videoUrl: file.url}); setActiveTab('create'); }}>Обрати</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>
                {selectedWebinarStats 
                  ? `Глядачі: ${webinars.find((w: any) => w.id === selectedWebinarStats)?.title}` 
                  : 'Виберіть вебінар у списку для перегляду статистики'}
              </h3>
              {selectedWebinarStats && (
                <table style={{ width: '100%', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.5rem' }}>Ім'я</th>
                      <th style={{ padding: '0.5rem' }}>Телефон</th>
                      <th style={{ padding: '0.5rem' }}>Telegram</th>
                      <th style={{ padding: '0.5rem' }}>Дата перегляду</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a: any, i: number) => (
                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{a.user?.name || '—'}</td>
                        <td style={{ padding: '1rem' }}>{a.user?.phone || '—'}</td>
                        <td style={{ padding: '1rem' }}>{a.user?.username ? `@${a.user.username}` : (a.userId || '—')}</td>
                        <td style={{ padding: '1rem' }}>{new Date(a.joinTime).toLocaleString()}</td>
                      </tr>
                    ))}
                    {attendees.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Реальних глядачів поки немає</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
