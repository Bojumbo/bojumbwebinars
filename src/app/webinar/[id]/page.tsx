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
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header className="glass" style={{ margin: '1rem', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{webinarData.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4b4b', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', background: '#ff4b4b', borderRadius: '50%', boxShadow: '0 0 10px #ff4b4b' }} />
            {isLive ? 'LIVE' : 'WAITING'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
            <Users size={16} /> {viewerCount}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', padding: '0 1rem 1rem 1rem', gap: '1rem', overflow: 'hidden' }}>
        {/* Video Side */}
        <div style={{ flex: 2, position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
          {!isLive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
              <Clock size={48} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{countdown === "Завершено" ? "Трансляцію завершено" : "Вебінар скоро почнеться"}</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '2px' }}>{countdown}</p>
            </div>
          )}
          
          {isLive && (
            <>
              {!hasInteracted && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <button 
                    className="btn-primary" 
                    style={{ scale: '1.2' }}
                    onClick={() => {
                      setHasInteracted(true);
                      setIsMuted(false);
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play();
                      }
                    }}
                  >
                    Приєднатися та увімкнути звук
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

              {hasInteracted && isMuted && (
                <button 
                  className="glass" 
                  style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 30, padding: '0.5rem 1rem' }}
                  onClick={() => { setIsMuted(false); if (videoRef.current) videoRef.current.muted = false; }}
                >
                  Увімкнути звук 🔊
                </button>
              )}

              <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '10px 20px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', pointerEvents: 'none' }}>
                Пряма трансляція
              </div>
            </>
          )}
        </div>

        {/* Chat Side */}
        <aside className="glass" style={{ flex: 0.8, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Чат трансляції</div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ animation: 'slideIn 0.3s ease-out' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: '0.5rem' }}>{msg.sender}:</span>
                <span style={{ color: '#fff' }}>{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Напишіть повідомлення..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}><Send size={18} /></button>
          </form>
        </aside>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </main>
  );
}
