'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, List, Trash2, ExternalLink, Calendar, Play, Upload, Database, Lock, Share2, Book, Users as UsersIcon } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'library' | 'stats' | 'users' | 'sendpulse'>('list');
  const [spStatus, setSpStatus] = useState<any>(null);
  const [webinars, setWebinars] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedWebinarStats, setSelectedWebinarStats] = useState<any>(null);
  const [attendees, setAttendees] = useState([]);
  const [globalUsers, setGlobalUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: '', phone: '' });
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('all'); // all, attended, missed
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
      if (activeTab === 'users') {
        const resU = await fetch('/api/admin/users/stats');
        if (resU.ok) setGlobalUsers(await resU.json());
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUser.id, ...editUserData })
    });
    if (res.ok) {
      setIsEditingUser(false);
      setSelectedUser(null);
      fetchData();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цього користувача та всю його історію?')) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      setSelectedUser(null);
      fetchData();
    }
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

  const fetchSpStatus = async () => {
    try {
      const res = await fetch('/api/admin/sendpulse/check');
      const data = await res.json();
      setSpStatus(data);
    } catch (e) {
      console.error(e);
    }
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
          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}>Користувачі</button>
          <button onClick={() => { setActiveTab('sendpulse'); fetchSpStatus(); }} className={activeTab === 'sendpulse' ? 'btn-primary' : 'glass'} style={{ padding: '0.8rem 1.5rem' }}><Share2 size={16} /> SendPulse</button>
        </div>

        <div className="glass" style={{ padding: '2rem', background: '#fff' }}>
          {activeTab === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {webinars.map((w: any) => {
                const now = new Date().getTime();
                const start = new Date(w.startTime).getTime();
                const end = start + (w.duration || 3600) * 1000;
                
                let status = { label: 'Заплановано', color: '#4f46e5', bg: '#e0e7ff' };
                if (now >= start && now <= end) {
                  status = { label: 'Онлайн', color: '#10b981', bg: '#dcfce7' };
                } else if (now > end) {
                  status = { label: 'Завершено', color: '#64748b', bg: '#f1f5f9' };
                }

                return (
                  <div key={w.id} className="glass" style={{ padding: '1.5rem', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      right: '1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '12px',
                      background: status.bg,
                      color: status.color,
                      textTransform: 'uppercase'
                    }}>
                      {status.label}
                    </div>
                    <h3 style={{ marginBottom: '0.5rem', paddingRight: '5rem' }}>{w.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}><Calendar size={14} /> {new Date(w.startTime).toLocaleString()}</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/webinar/${w.id}`} target="_blank" className="btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>Перегляд</Link>
                      <button onClick={() => fetchStats(w.id)} className="glass" style={{ flex: 1, fontSize: '0.8rem' }}>Статистика</button>
                      <button onClick={() => handleDeleteWebinar(w.id)} className="glass" style={{ color: '#ef4444', padding: '0.5rem' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
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

          {activeTab === 'users' && (
            <div className="glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Глобальна база користувачів</h3>
                
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
                  <input 
                    type="text" 
                    placeholder="Пошук (ім'я, тел, TG)..." 
                    className="input-field"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <select 
                    className="input-field" 
                    value={filterAttendance}
                    onChange={(e) => setFilterAttendance(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="all">Всі користувачі</option>
                    <option value="attended">✅ Прийшли (хоча б раз)</option>
                    <option value="missed">❌ Не прийшли (ні разу)</option>
                  </select>
                </div>
              </div>

              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.5rem' }}>Ім'я</th>
                    <th style={{ padding: '0.5rem' }}>Телефон</th>
                    <th style={{ padding: '0.5rem' }}>Telegram</th>
                    <th style={{ padding: '0.5rem' }}>Реєстрація</th>
                    <th style={{ padding: '0.5rem' }}>Статус відвідування</th>
                  </tr>
                </thead>
                <tbody>
                  {globalUsers
                    .filter((u: any) => {
                      const searchLower = filterSearch.toLowerCase();
                      const matchesSearch = 
                        u.name.toLowerCase().includes(searchLower) ||
                        u.phone.includes(filterSearch) ||
                        u.id.includes(filterSearch);
                      
                      const hasAttended = u.attendedCount > 0;
                      const matchesAttendance = 
                        filterAttendance === 'all' ||
                        (filterAttendance === 'attended' && hasAttended) ||
                        (filterAttendance === 'missed' && !hasAttended);
                        
                      return matchesSearch && matchesAttendance;
                    })
                    .map((u: any, i: number) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td 
                        style={{ padding: '1rem', fontWeight: 600, color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setSelectedUser(u)}
                      >
                        {u.name}
                      </td>
                      <td style={{ padding: '1rem' }}>{u.phone}</td>
                      <td style={{ padding: '1rem' }}>{u.username !== 'N/A' ? `@${u.username}` : u.id}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{new Date(u.registeredAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>
                        {u.attendedCount > 0 ? (
                          <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            ✅ ПРИЙШОВ ({u.attendedCount})
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            ❌ НЕ ПРИЙШОВ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sendpulse' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Статус SendPulse CRM</h3>
              {spStatus ? (
                <div className="glass" style={{ padding: '2rem', border: `2px solid ${spStatus.status === 'success' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: spStatus.status === 'success' ? '#10b981' : '#ef4444' }}></div>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                      {spStatus.status === 'success' ? 'Підключено' : 'Помилка'}
                    </span>
                  </div>
                  
                  <p style={{ marginBottom: '1rem', color: '#64748b' }}>{spStatus.message}</p>
                  
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>Client ID:</span>
                      <span style={{ fontWeight: 600 }}>{spStatus.details?.clientId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Pipeline ID:</span>
                      <span style={{ fontWeight: 600 }}>{spStatus.details?.pipelineId}</span>
                    </div>
                  </div>
                  
                  <button onClick={fetchSpStatus} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Оновити статус</button>
                </div>
              ) : (
                <p>Завантаження статусу...</p>
              )}
              
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '10px', fontSize: '0.85rem', color: '#1e40af' }}>
                <p><strong>Порада:</strong> Якщо статус "Помилка", перевірте змінні оточення `SENDPULSE_CLIENT_ID` та `SENDPULSE_CLIENT_SECRET` у Portainer.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedUser(null)}>
          <div className="glass" style={{ background: '#fff', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Профіль користувача</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isEditingUser ? (
                  <button onClick={() => { setEditUserData({ name: selectedUser.name, phone: selectedUser.phone }); setIsEditingUser(true); }} className="glass" style={{ color: '#4f46e5' }}>Редагувати</button>
                ) : (
                  <button onClick={handleUpdateUser} className="btn-primary">Зберегти</button>
                )}
                <button onClick={() => handleDeleteUser(selectedUser.id)} className="glass" style={{ color: '#ef4444' }}>Видалити</button>
                <button onClick={() => { setSelectedUser(null); setIsEditingUser(false); }} className="glass" style={{ padding: '0.5rem 1rem' }}>Закрити</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ІМ'Я</p>
                {isEditingUser ? (
                  <input type="text" className="input-field" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} />
                ) : (
                  <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.name}</p>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ТЕЛЕФОН</p>
                {isEditingUser ? (
                  <input type="text" className="input-field" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} />
                ) : (
                  <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.phone}</p>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TELEGRAM</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.username !== 'N/A' ? `@${selectedUser.username}` : selectedUser.id}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ПЕРША РЕЄСТРАЦІЯ</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(selectedUser.registeredAt).toLocaleString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#4f46e5' }}>📋 Історія записів ({selectedUser.registrationHistory?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedUser.registrationHistory?.map((r: any, idx: number) => (
                    <div key={idx} className="glass" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 700 }}>{r.title}</p>
                      <p style={{ color: '#64748b' }}>📅 {new Date(r.time).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#10b981' }}>🎓 Історія відвідувань ({selectedUser.attendanceHistory?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedUser.attendanceHistory?.map((a: any, idx: number) => (
                    <div key={idx} className="glass" style={{ padding: '0.8rem', fontSize: '0.85rem', borderColor: '#10b981' }}>
                      <p style={{ fontWeight: 700 }}>{a.title}</p>
                      <p style={{ color: '#10b981' }}>✅ Зайшов: {new Date(a.joinedAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {(!selectedUser.attendanceHistory || selectedUser.attendanceHistory.length === 0) && (
                    <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Жодного вебінару ще не відвідано</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#f59e0b' }}>💬 Повідомлення в чаті ({selectedUser.comments?.length || 0})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {selectedUser.comments?.map((c: any, idx: number) => {
                  const mins = Math.floor(c.videoTime / 60);
                  const secs = c.videoTime % 60;
                  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                  return (
                    <div key={idx} className="glass" style={{ padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#b45309' }}>{c.webinarTitle}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', background: '#f59e0b', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{timeStr}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#1e293b' }}>{c.text}</p>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>{new Date(c.sentAt).toLocaleString()}</p>
                    </div>
                  );
                })}
                {(!selectedUser.comments || selectedUser.comments.length === 0) && (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Користувач ще не писав у чат</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
