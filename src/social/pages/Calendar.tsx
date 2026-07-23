import { useState, useEffect } from 'react';
import type { Platform, ContentType, PostStatus, CalendarEntry } from '../lib/types';
import { getCalendarEntries, addCalendarEntry } from '../lib/store';
import { fetchLiveGoogleSheet } from '../lib/google-sync';
import PlatformBadge from '../components/PlatformBadge';

const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() && 
           a.getMonth() === b.getMonth() && 
           a.getDate() === b.getDate();
};

const isToday = (date: Date) => isSameDay(date, new Date());

const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Padding before
    const startPadding = firstDay.getDay(); // 0 is Sunday
    for (let i = startPadding - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
    }
    
    // Days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }
    
    // Padding after
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i));
    }
    
    return days;
};

const toDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Calendar() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        date: toDateString(new Date()),
        platform: 'x' as Platform,
        contentType: 'text' as ContentType,
        status: 'draft' as PostStatus
    });

    useEffect(() => {
        setEntries(getCalendarEntries());
    }, []);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry = addCalendarEntry({
            title: formData.title,
            date: formData.date,
            platform: formData.platform,
            contentType: formData.contentType,
            status: formData.status
        });
        setEntries([...entries, newEntry]);
        setShowAddModal(false);
        setFormData({ ...formData, title: '' }); // reset title
    };

    const [syncingSheet, setSyncingSheet] = useState(false);

    const handleSyncSheet = async () => {
        setSyncingSheet(true);
        const rows = await fetchLiveGoogleSheet();
        for (const r of rows) {
            addCalendarEntry({
                title: `[${r.group}] ${r.topic}`,
                date: toDateString(new Date()),
                platform: 'x',
                contentType: 'text',
                status: r.isCompleted ? 'posted' : 'scheduled'
            });
        }
        setEntries(getCalendarEntries());
        setSyncingSheet(false);
    };

    const days = getDaysInMonth(currentMonth);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Upcoming events this week
    const today = new Date();
    const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const upcomingEvents = entries.filter(e => {
        const d = new Date(e.date + 'T12:00:00'); // hack to avoid tz shift
        return d >= new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) && d <= nextWeek;
    }).sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="page-container calendar-page">
            <header className="page-header">
                <h1>📅 Content Calendar</h1>
                <p>Plan and track your content across all platforms</p>
            </header>

            <div className="calendar-controls glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', borderRadius: '12px' }}>
                <div className="month-nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={prevMonth} className="btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>&lt; Prev</button>
                    <h2 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>{formatMonthYear(currentMonth)}</h2>
                    <button onClick={nextMonth} className="btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Next &gt;</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSyncSheet} className="btn-secondary" disabled={syncingSheet} style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid var(--primary-mint)', color: 'var(--primary-mint)', fontWeight: 700, padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
                        {syncingSheet ? '🔄 Syncing Sheet...' : '🔄 Sync Live Google Sheet'}
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ background: 'var(--primary-mint)', border: 'none', color: 'black', fontWeight: 'bold', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>+ Schedule Event</button>
                </div>
            </div>

            <div className="calendar-grid glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-light)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
                {dayNames.map(name => (
                    <div key={name} className="calendar-header-cell" style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {name}
                    </div>
                ))}
                
                {days.map((day, idx) => {
                    const dateStr = toDateString(day);
                    const dayEntries = entries.filter(e => e.date === dateStr);
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isTodayCell = isToday(day);

                    return (
                        <div key={idx} className={`calendar-cell ${isTodayCell ? 'today' : ''}`} style={{ 
                            minHeight: '120px', 
                            padding: '0.5rem', 
                            background: isCurrentMonth ? 'var(--bg-glass)' : 'var(--bg-secondary)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            borderLeft: idx % 7 !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            opacity: isCurrentMonth ? 1 : 0.5
                        }}>
                            <div className="day-number" style={{ 
                                fontWeight: isTodayCell ? 'bold' : 'normal',
                                color: isTodayCell ? '#00e5a0' : 'inherit',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{day.getDate()}</span>
                            </div>
                            
                            <div className="day-events" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {dayEntries.map(entry => (
                                    <div key={entry.id} className="event-pill" style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        background: 'rgba(255,255,255,0.1)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <PlatformBadge platform={entry.platform} size="sm" showLabel={false} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <section className="upcoming-section" style={{ marginTop: '2rem' }}>
                <h2>Upcoming This Week</h2>
                <div className="posts-list glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', borderRadius: '12px' }}>
                    {upcomingEvents.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>No events scheduled for the next 7 days.</p>
                    ) : (
                        upcomingEvents.map(entry => (
                            <div key={entry.id} className="post-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <PlatformBadge platform={entry.platform} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{entry.title}</h4>
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{new Date(entry.date + 'T12:00:00').toLocaleDateString()}</span>
                                </div>
                                <span className={`badge ${entry.contentType}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{entry.contentType}</span>
                                <span className={`badge status ${entry.status}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>{entry.status}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {showAddModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="modal-content glass-panel" style={{ width: '400px', padding: '2rem', borderRadius: '16px' }}>
                        <h2 style={{ marginTop: 0 }}>Add Calendar Event</h2>
                        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Title</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Date</label>
                                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <label>Platform</label>
                                    <select value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as Platform})} style={{ padding: '0.75rem', borderRadius: '8px', background: '#12141d', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                                        <option value="youtube">YouTube</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="x">X / Twitter</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="discord">Discord</option>
                                        <option value="telegram">Telegram</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                    <label>Content Type</label>
                                    <select value={formData.contentType} onChange={e => setFormData({...formData, contentType: e.target.value as ContentType})} style={{ padding: '0.75rem', borderRadius: '8px', background: '#12141d', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                                        <option value="video">Video</option>
                                        <option value="image">Image</option>
                                        <option value="text">Text</option>
                                        <option value="thread">Thread</option>
                                        <option value="reel">Reel</option>
                                        <option value="short">Short</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label>Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PostStatus})} style={{ padding: '0.75rem', borderRadius: '8px', background: '#12141d', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="approved">Approved</option>
                                    <option value="posted">Posted</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#00e5a0', border: 'none', color: '#08090d', fontWeight: 'bold', cursor: 'pointer' }}>Save Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
