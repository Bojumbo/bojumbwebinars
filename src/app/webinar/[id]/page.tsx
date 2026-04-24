'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, Clock, Play } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  time: number;
}

export default function WebinarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [isLive, setIsLive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const [webinarData, setWebinarData] = useState<any>(null);

  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const res = await fetch('/api/admin/webinars');
        const data = await res.json();
        const current = data.find((w: any) => w.id === id);
        if (current) {
          setWebinarData({
            ...current,
            startTime: new Date(current.startTime)
          });
        }
      } catch (e) { console.error(e); }
    };
    fetchWebinar();
  }, [id]);

  const isFinishedRef = useRef(false);

  useEffect(() => {
    if (!webinarData || isFinished) return;

    const timer = setInterval(() => {
      if (isFinished || isFinishedRef.current) {
        clearInterval(timer);
        return;
      }
      
      const now = new Date();
      const diff = webinarData.startTime.getTime() - now.getTime();
      const durationMs = (webinarData.duration || 3600) * 1000;
      const offset = Math.abs(diff) / 1000;

      if (diff > 0) {
        setIsLive(false);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${mins}:${secs < 10 ? '0' : ''}${secs}`);

        // Набір глядачів за 1 хвилину до старту
        if (diff <= 60000) {
          const progress = 1 - (diff / 60000);
          const base = parseInt(webinarData.fakeViewersBase || 0);
          setViewerCount(Math.floor(base * progress));
        } else {
          setViewerCount(0);
        }
      } else if (Math.abs(diff) < durationMs) {
        setIsLive(true);
        setCountdown(null);
        
        // Жива пульсація глядачів ±5 осіб
        const base = parseInt(webinarData.fakeViewersBase || 0);
        const fluctuation = Math.floor(Math.random() * 11) - 5;
        setViewerCount(Math.max(0, base + fluctuation));

        if (videoRef.current) {
          const drift = Math.abs(videoRef.current.currentTime - offset);
          if (offset < videoRef.current.duration && drift > 5) {
            videoRef.current.currentTime = offset;
          }
          if (hasInteracted && videoRef.current.paused && !videoRef.current.ended) {
            videoRef.current.play().catch(() => {});
          }
        }

        // Впорскування фейкових повідомлень
        if (webinarData.chatPresets) {
          const currentOffset = Math.floor(offset);
          const newFakeMsgs = webinarData.chatPresets.filter((m: any) => m.timestamp === currentOffset);
          if (newFakeMsgs.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNew = newFakeMsgs
                .filter((m: any) => !existingIds.has(m.id))
                .map((m: any) => ({
                  id: m.id,
                  sender: m.senderName,
                  text: m.text,
                  time: Date.now()
                }));
              return [...prev, ...uniqueNew];
            });
          }
        }
      } else {
        setIsLive(false);
        setCountdown("Завершено");
        setIsFinished(true);
        isFinishedRef.current = true;

        // Вихід глядачів після завершення (протягом 60 сек)
        const afterEnd = Math.abs(diff) - durationMs;
        if (afterEnd <= 60000) {
          const progress = 1 - (afterEnd / 60000);
          const base = parseInt(webinarData.fakeViewersBase || 0);
          setViewerCount(Math.floor(base * progress));
        } else {
          setViewerCount(0);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [webinarData, isFinished, hasInteracted]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: localStorage.getItem('viewer_name') || 'Гість',
      text: inputText,
      time: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  if (!webinarData) return <div style={{ textAlign: 'center', padding: '5rem' }}>Завантаження...</div>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{webinarData.title}</h1>
          {isLive && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 800 }}>● В ЕФІРІ</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '12px' }}>
          <Users size={18} style={{ color: '#4f46e5' }} />
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{viewerCount}</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', flex: 1, overflow: 'hidden' }}>
        <div style={{ background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!isLive && !isFinished && (
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <Clock size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Трансляція розпочнеться через:</h2>
              <div style={{ fontSize: '4rem', fontWeight: 800 }}>{countdown}</div>
            </div>
          )}
          
          {isLive && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video 
                ref={videoRef}
                src={webinarData.videoUrl} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                playsInline
                muted={isMuted}
                onPlay={() => setHasInteracted(true)}
              />
              {!hasInteracted && (
                <div 
                  onClick={() => { setIsMuted(false); setHasInteracted(true); videoRef.current?.play(); }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '1rem' }}
                >
                  <Play size={64} fill="currentColor" />
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Натисніть, щоб дивитися зі звуком</p>
                </div>
              )}
            </div>
          )}

          {isFinished && (
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <h2>Трансляція завершена</h2>
              <p>Дякуємо, що були з нами!</p>
            </div>
          )}
        </div>

        <aside style={{ background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Чат трансляції</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <span style={{ fontWeight: 800, color: '#4f46e5', marginRight: '0.5rem', fontSize: '0.9rem' }}>{msg.sender}:</span>
                <span style={{ color: '#1e293b', fontSize: '0.9rem' }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Повідомлення..." 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}><Send size={18} /></button>
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}
