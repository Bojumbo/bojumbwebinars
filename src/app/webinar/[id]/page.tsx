'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, Clock } from 'lucide-react';

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
      } catch (e) {
        console.error(e);
      }
    };
    fetchWebinar();
  }, [id]);

  const isFinishedRef = useRef(false);

  useEffect(() => {
    if (!webinarData || isFinished) return;

    const timer = setInterval(() => {
      // Check both state and ref for safety
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
      } else if (Math.abs(diff) < durationMs) {
        setIsLive(true);
        setCountdown(null);
        
        if (videoRef.current) {
          const drift = Math.abs(videoRef.current.currentTime - offset);
          const videoDuration = videoRef.current.duration;
          
          if (videoDuration && offset < videoDuration && drift > 5) {
            videoRef.current.currentTime = offset;
          }
          
          if (hasInteracted && videoRef.current.paused && !videoRef.current.ended) {
            videoRef.current.play().catch(e => console.warn("Playback resumed:", e));
          }
        }

        // Fake messages injection
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
      }

      setViewerCount(Math.max(0, webinarData.fakeViewersBase || 0));
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

  if (!webinarData) {
    return (
      <main style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Завантаження вебінару...</p>
      </main>
    );
  }

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{webinarData.title}</h2>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', background: '#fef2f2', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #fee2e2' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
            НАЖИВО
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 600, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
            <Users size={16} /> {viewerCount}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', padding: '1.5rem', gap: '1.5rem', overflow: 'hidden' }}>
        {/* Video Side */}
        <div style={{ flex: 2.2, position: 'relative', background: '#000', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          {!isLive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b' }}>
              <Clock size={64} style={{ marginBottom: '1.5rem', color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', fontWeight: 800, color: '#fff' }}>{countdown === "Завершено" ? "Трансляцію завершено" : "Вебінар скоро почнеться"}</h3>
              <p style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '4px', color: 'var(--accent)' }}>{countdown}</p>
            </div>
          )}
          
          {isLive && (
            <>
              {!hasInteracted && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '1.25rem 2.5rem', borderRadius: '16px', fontSize: '1.2rem', boxShadow: '0 0 40px rgba(79, 70, 229, 0.4)' }}
                    onClick={() => {
                      setHasInteracted(true);
                      setIsMuted(false);
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play();
                      }
                    }}
                  >
                    Приєднатися до трансляції
                  </button>
                </div>
              )}

              <video 
                ref={videoRef}
                src={webinarData.videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                playsInline
                muted={isMuted}
                autoPlay
                controls={false}
                onContextMenu={(e) => e.preventDefault()}
                onEnded={() => {
                  setIsLive(false);
                  setIsFinished(true);
                  isFinishedRef.current = true;
                  setCountdown("Завершено");
                }}
              />

              <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 30, display: 'flex', gap: '10px' }}>
                {hasInteracted && isMuted && (
                  <button 
                    className="btn-primary" 
                    style={{ background: '#fff', color: '#000', padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}
                    onClick={() => { setIsMuted(false); if (videoRef.current) videoRef.current.muted = false; }}
                  >
                    Увімкнути звук 🔊
                  </button>
                )}
                <div style={{ padding: '0.6rem 1.2rem', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  HD 1080p
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chat Side */}
        <aside style={{ flex: 0.8, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
            ЧАТ ТРАНСЛЯЦІЇ
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Поки немає повідомлень. Будьте першим!
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ animation: 'slideIn 0.3s ease-out', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>{msg.sender}</span>
                <span style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '14px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ваше повідомлення..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: '0.6rem 0.8rem', width: '100%', fontSize: '0.9rem', boxShadow: 'none' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem', borderRadius: '10px', height: '40px', width: '40px' }}><Send size={18} /></button>
            </div>
          </form>
        </aside>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
