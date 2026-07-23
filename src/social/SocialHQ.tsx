import { useEffect, useState } from 'react';
import './social.css';
import Dashboard from './pages/Dashboard';
import Drafts from './pages/Drafts';
import Scheduled from './pages/Scheduled';
import History from './pages/History';
import Generate from './pages/Generate';
import Trends from './pages/Trends';
import Toolkit from './pages/Toolkit';
import Calendar from './pages/Calendar';
import { getPostsByStatus, seedDemoData } from './lib/store';

type Page = 'dashboard' | 'trends' | 'drafts' | 'scheduled' | 'history' | 'generate' | 'toolkit' | 'calendar';

const NAV_ITEMS: { page: Page; icon: string; label: string; countFn?: () => number }[] = [
    { page: 'dashboard', icon: '🎮', label: 'Command Center' },
    { page: 'calendar', icon: '📅', label: 'Calendar' },
    { page: 'trends', icon: '📡', label: 'Trend Radar' },
    { page: 'generate', icon: '✨', label: 'Create' },
    { page: 'drafts', icon: '📝', label: 'Drafts', countFn: () => getPostsByStatus('draft').length },
    { page: 'scheduled', icon: '⏰', label: 'Scheduled', countFn: () => [...getPostsByStatus('approved'), ...getPostsByStatus('scheduled')].length },
    { page: 'history', icon: '✅', label: 'History' },
    { page: 'toolkit', icon: '🧰', label: 'Toolkit' },
];

export default function SocialHQ() {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [, setTick] = useState(0);

    useEffect(() => {
        seedDemoData();
    }, []);

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        setTick(n => n + 1);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'calendar': return <Calendar />;
            case 'trends': return <Trends />;
            case 'generate': return <Generate />;
            case 'drafts': return <Drafts />;
            case 'scheduled': return <Scheduled />;
            case 'history': return <History />;
            case 'toolkit': return <Toolkit />;
        }
    };

    return (
        <div className="social-hq-container" style={{
            position: 'relative',
            zIndex: 20,
            background: 'var(--bg-primary)',
            minHeight: 'calc(100vh - 60px)',
            color: 'var(--text-primary)',
            paddingBottom: '40px'
        }}>
            <div className="social-subnav" style={{
                display: 'flex',
                gap: '8px',
                padding: '14px 24px',
                background: 'var(--bg-glass)',
                borderBottom: '1px solid var(--border-light)',
                overflowX: 'auto',
                backdropFilter: 'blur(12px)'
            }}>
                {NAV_ITEMS.map(item => {
                    const count = item.countFn?.();
                    const active = currentPage === item.page;
                    return (
                        <button
                            key={item.page}
                            type="button"
                            onClick={() => handleNavigate(item.page)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: active ? 'var(--primary-mint)' : 'transparent',
                                background: active ? 'var(--bg-glass-hover)' : 'transparent',
                                color: active ? 'var(--primary-mint)' : 'var(--text-secondary)',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                            {count !== undefined && count > 0 && (
                                <span style={{
                                    background: 'var(--primary-mint)',
                                    color: 'var(--bg-primary)',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '10px'
                                }}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ padding: '24px 32px' }}>
                {renderPage()}
            </div>
        </div>
    );
}
