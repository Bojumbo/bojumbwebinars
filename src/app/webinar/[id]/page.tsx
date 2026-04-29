'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { Users, Send, Clock, Play, Maximize } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  time: number;
}

export default function WebinarPage(props: any) {
  const resolved = use(props.params);
  const currentWebinarId = resolved.id;
  const [mounted, setMounted] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [webinarData, setWebinarData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const fetchWebinar = async () => {
      try {
        const res = await fetch('/api/admin/webinars');
        const data = await res.json();
        const current = data.find((w: any) => w.id === currentWebinarId);
        if (current) {
          setWebinarData({
            ...current,
            startTime: new Date(current.startTime)
          });

          // Track attendance if 'u' (telegram ID) is present
          const urlParams = new URLSearchParams(window.location.search);
          const userId = urlParams.get('u');
          if (userId) {
            // Register attendance
            fetch('/api/analytics/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webinarId: currentWebinarId, userId })
            }).catch(console.error);

            // Fetch user name to set in local storage
            const usersRes = await fetch('/api/admin/users');
            if (usersRes.ok) {
              const users = await usersRes.json();
              const user = users.find((u: any) => u.id === userId);
              if (user) {
                localStorage.setItem('viewer_name', user.name);
              }
            }
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchWebinar();
    return () => window.removeEventListener('resize', checkMobile);
  }, [currentWebinarId]);

  const isFinishedRef = useRef(false);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!webinarData || isFinished || !mounted) return;

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
        
        const base = parseInt(webinarData.fakeViewersBase || 0);
        const fluctuation = Math.floor(Math.random() * 11) - 5;
        setViewerCount(Math.max(0, base + fluctuation));

        // Логіка синхронізації відео (MP4)
        const video = videoRef.current;
        if (video && !video.src.includes('youtube')) {
          const nowMs = Date.now();
          const drift = Math.abs(video.currentTime - offset);

          // Перевіряємо синхронізацію не частіше ніж раз на 5 секунд
          // І тільки якщо відео не в процесі перемотки (seeking)
          if (nowMs - lastSyncRef.current > 5000 && !video.seeking) {
            // Збільшили допустимий поріг до 15 секунд для смартфонів
            if (offset < video.duration && drift > 15) {
              console.log(`Syncing video: drift is ${drift.toFixed(1)}s`);
              video.currentTime = offset;
              lastSyncRef.current = nowMs;
            }
          }
          
          // Автозапуск, якщо відео стало на паузу випадково
          if (video.paused && !video.ended && hasInteracted && !video.seeking) {
            video.play().catch(() => {});
          }
        }

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
  }, [webinarData, isFinished, hasInteracted, mounted]);

  // Polling for real-time messages (every 3 seconds)
  useEffect(() => {
    if (!mounted || isFinished) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/webinar/comment?webinarId=${currentWebinarId}`);
        if (res.ok) {
          const dbMessages = await res.json();
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = dbMessages
              .filter((m: any) => !existingIds.has(m.id))
              .map((m: any) => ({
                id: m.id,
                sender: m.senderName,
                text: m.text,
                time: new Date(m.sentAt).getTime()
              }));
            
            if (newMessages.length === 0) return prev;
            return [...prev, ...newMessages].sort((a, b) => a.time - b.time);
          });
        }
      } catch (e) { console.error('Polling error:', e); }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [mounted, isFinished, currentWebinarId]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const video = videoRef.current;
    const videoTime = video ? Math.floor(video.currentTime) : 0;
    const userName = localStorage.getItem('viewer_name') || 'Гість';

    const msgId = Date.now().toString();
    const newMsg = {
      id: msgId,
      sender: userName,
      text: inputText,
      time: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Save to DB
    const userId = new URLSearchParams(window.location.search).get('u');
    if (userId) {
      fetch('/api/webinar/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          userId,
          webinarId: currentWebinarId,
          senderName: userName,
          text: inputText,
          timestamp: videoTime
        })
      }).catch(err => console.error('Error saving comment:', err));
    }
  };

  const toggleFullScreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    // Спеціальна логіка для iOS (iPhone/iPad), де працює тільки перегляд відео на весь екран
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS && video && (video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
      return;
    }

    // Стандартна логіка для інших пристроїв
    const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (!mounted || !webinarData) return <div style={{ textAlign: 'center', padding: '5rem' }}>Завантаження...</div>;

  const ytId = getYouTubeId(webinarData.videoUrl);

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .webinar-grid { display: grid; grid-template-columns: 1fr 350px; flex: 1; overflow: hidden; }
        @media (max-width: 768px) {
          .webinar-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; overflow-y: auto; }
          .video-container { height: 250px !important; flex: none !important; }
          .chat-aside { height: 400px !important; flex: none !important; }
          header { padding: 0.75rem 1rem !important; }
          h1 { font-size: 1rem !important; }
        }
        .fs-button:hover { background: rgba(0,0,0,0.8) !important; transform: scale(1.1); }
      `}</style>
      
      <header style={{ background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
        <div style={{ overflow: 'hidden' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{webinarData.title}</h1>
          {isLive && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>● В ЕФІРІ</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '10px' }}>
          <Users size={16} style={{ color: '#4f46e5' }} />
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{viewerCount}</span>
        </div>
      </header>

      <div className="webinar-grid">
        <div 
          ref={containerRef}
          className="video-container" 
          style={{ background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {!isLive && !isFinished && (
            <div style={{ textAlign: 'center', color: '#fff', padding: '2rem' }}>
              <Clock size={isMobile ? 40 : 64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', marginBottom: '0.5rem' }}>Початок через:</h2>
              <div style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 800 }}>{countdown}</div>
            </div>
          )}
          
          {isLive && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Кнопка повного екрана */}
              {hasInteracted && (
                <button
                  className="fs-button"
                  onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
                  style={{ 
                    position: 'absolute', 
                    bottom: '20px', 
                    right: '20px', 
                    zIndex: 40, 
                    background: 'rgba(0,0,0,0.6)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '50%', 
                    width: '44px', 
                    height: '44px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="На весь екран"
                >
                  <Maximize size={22} />
                </button>
              )}

              {ytId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                ></iframe>
              ) : (
                <video 
                  ref={videoRef}
                  src={webinarData.videoUrl} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  playsInline
                  autoPlay
                  muted={isMuted}
                  preload="auto"
                  onPlay={() => setHasInteracted(true)}
                />
              )}
              
              {(!hasInteracted || isMuted) && (
                <div 
                  onClick={() => { 
                    setHasInteracted(true); 
                    setIsMuted(false); 
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                      videoRef.current.volume = 1.0;
                      videoRef.current.play().catch(() => {
                        videoRef.current!.muted = false;
                        videoRef.current!.play();
                      });
                    }
                  }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '1rem', zIndex: 20 }}
                >
                  <Play size={48} fill="currentColor" />
                  <p style={{ textAlign: 'center', padding: '0 1rem', fontWeight: 600 }}>Натисніть для звуку</p>
                </div>
              )}
            </div>
          )}

          {isFinished && (
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <h2>Трансляція завершена</h2>
              <p>Дякуємо за увагу!</p>
            </div>
          )}
        </div>

        <aside className="chat-aside" style={{ background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#64748b' }}>Чат трансляції</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <span style={{ fontWeight: 800, color: '#4f46e5', marginRight: '0.4rem', fontSize: '0.85rem' }}>{msg.sender}:</span>
                <span style={{ color: '#1e293b', fontSize: '0.85rem' }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Чат..." 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                style={{ fontSize: '0.9rem', padding: '0.6rem 0.8rem' }}
              />
              <button type="submit" className="btn-primary" style={{ width: '44px', padding: '0' }}><Send size={18} /></button>
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}