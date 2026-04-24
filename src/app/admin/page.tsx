'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, List, Trash2, ExternalLink, Calendar, Play, Upload, Database, Lock, Send } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'library' | 'codes'>('list');
  const [webinars, setWebinars] = useState([]);
  const [codes, setCodes] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
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
      const resC = await fetch('/api/admin/codes');
      if (resC.ok) setCodes(await resC.json());
      const resL = await fetch('/api/admin/library');
      if (resL.ok) setUploadedFiles(await resL.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    let duration = 3600;
    if (formData.videoUrl) {
      const vid = document.createElement('video');
      vid.src = formData.videoUrl;
      await new Promise((r) => {
        vid.onloadedmetadata = () => { duration = Math.round(vid.duration); r(null); };
        vid.onerror = () => r(null);
      });
    }
    const res = await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, duration }),
    });
    if (res.ok) { alert('Створено!'); fetchData(); setActiveTab('list'); }
  };

  const handleDeleteWebinar = async (id: string) => {
    if (!confirm('Видалити?')) return;
    const res = await fetch(`/api/admin/webinars?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    if (res.ok) { alert('Завантажено!'); fetchData(); }
    setUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="glass" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Shield size={48} style={{ marginBottom: '1.5rem', color: '#4f46e5' }} />
          <h2 style={{ marginBottom: '2rem', color: '#1e293b' }}>Вхід в Адмін-панель</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin123') { setIsAuthenticated(true); sessionStorage.setItem('admin_auth', 'true'); }
            else alert('Невірний пароль');
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
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}><Shield /> Панель</h1>
          <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => { sessionStorage.clear(); location.reload(); }}>Вихід</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'btn-primary' : 'glass'} style={{ padding: '0.5rem 1rem' }}>Список</button>
          <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'btn-primary' : 'glass'} style={{ padding: '0.5rem 1rem' }}>Створити</button>
          <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'btn-primary' : 'glass'} style={{ padding: '0.5rem 1rem' }}>Медіа</button>
          <button onClick={() => setActiveTab('codes')} className={activeTab === 'codes' ? 'btn-primary' : 'glass'} style={{ padding: '0.5rem 1rem' }}>Коди</button>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          {activeTab === 'create' && (
            <form onSubmit={handleCreateWebinar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label>Назва вебінару</label>
              <input type="text" className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              
              <label>Джерело відео</label>
              <select className="input-field" onChange={(e) => setFormData({...formData, videoUrl: e.target.value === 'custom' ? '' : e.target.value})}>
                <option value="custom">Посилання (URL)</option>
                {uploadedFiles.map(f => <option key={f.url} value={f.url}>{f.name}</option>)}
              </select>

              <input type="text" className="input-field" placeholder="URL відео" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
              
              <label>Час початку</label>
              <input type="datetime-local" className="input-field" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
              
              <button type="submit" className="btn-primary">Зберегти вебінар</button>
            </form>
          )}

          {activeTab === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {webinars.map((w:any) => (
                <div key={w.id} className="glass" style={{ padding: '1rem' }}>
                  <h3>{w.title}</h3>
                  <p>{new Date(w.startTime).toLocaleString()}</p>
                  <button onClick={() => handleDeleteWebinar(w.id)} style={{ color: 'red', marginTop: '1rem' }}>Видалити</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
