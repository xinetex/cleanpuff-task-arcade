import { useState } from 'react';
import { getToolkit } from '../lib/store';
import ToolCard from '../components/ToolCard';

export default function Toolkit() {
    const [activeTab, setActiveTab] = useState<string>('All');
    const toolkit = getToolkit();

    const tabs = ['All', 'Scheduler', 'Analytics', 'Creation', 'Listening', 'Community'];

    const filteredToolkit = activeTab === 'All' 
        ? toolkit 
        : toolkit.filter(tool => tool.category.toLowerCase() === activeTab.toLowerCase());

    const totalCost = toolkit.reduce((sum, tool) => {
        if (tool.price === 'Free') return sum;
        // Basic extraction of number from $49/mo
        const match = tool.price.match(/\$(\d+)/);
        if (match) return sum + parseInt(match[1], 10);
        return sum;
    }, 0);

    return (
        <div className="page-container toolkit-page">
            <header className="page-header">
                <h1>🧰 SMM Toolkit</h1>
                <p>Your social media management stack for CleanPuff</p>
            </header>

            <section className="workflow-section">
                <h2>Content Pipeline</h2>
                <div className="workflow-pipeline">
                    <div className="pipeline-step">
                        <div className="step-circle">1</div>
                        <div className="step-emoji">🎨</div>
                        <div className="step-label">Create</div>
                        <div className="step-tools">Canva / CapCut</div>
                    </div>
                    <div className="pipeline-line"></div>
                    <div className="pipeline-step">
                        <div className="step-circle">2</div>
                        <div className="step-emoji">✍️</div>
                        <div className="step-label">Draft</div>
                        <div className="step-tools">This Dashboard</div>
                    </div>
                    <div className="pipeline-line"></div>
                    <div className="pipeline-step">
                        <div className="step-circle">3</div>
                        <div className="step-emoji">📋</div>
                        <div className="step-label">Review</div>
                        <div className="step-tools">Team Approval</div>
                    </div>
                    <div className="pipeline-line"></div>
                    <div className="pipeline-step">
                        <div className="step-circle">4</div>
                        <div className="step-emoji">📅</div>
                        <div className="step-label">Schedule</div>
                        <div className="step-tools">Buffer</div>
                    </div>
                    <div className="pipeline-line"></div>
                    <div className="pipeline-step">
                        <div className="step-circle">5</div>
                        <div className="step-emoji">🚀</div>
                        <div className="step-label">Publish</div>
                        <div className="step-tools">Multi-Platform</div>
                    </div>
                    <div className="pipeline-line"></div>
                    <div className="pipeline-step">
                        <div className="step-circle">6</div>
                        <div className="step-emoji">📊</div>
                        <div className="step-label">Analyze</div>
                        <div className="step-tools">Metricool</div>
                    </div>
                </div>
            </section>

            <section className="stack-section">
                <h2>Recommended Stack</h2>
                <div className="filter-tabs">
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="toolkit-grid">
                    {filteredToolkit.map(tool => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            </section>

            <div className="dashboard-grid" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <section className="cost-section glass-panel">
                    <h2>Monthly Cost Estimate</h2>
                    <table className="cost-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tool</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Plan</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Monthly Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {toolkit.map(tool => (
                                <tr key={tool.id}>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tool.name}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tool.status}</td>
                                    <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tool.price}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} style={{ padding: '0.5rem', fontWeight: 'bold' }}>Total Estimated Cost</td>
                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#ffc107' }}>${totalCost}/mo</td>
                            </tr>
                        </tfoot>
                    </table>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                        *Estimated costs for a small creative team (1-5 people)
                    </p>
                </section>

                <section className="links-section">
                    <h2>Resources & Templates</h2>
                    <div className="links-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <a href="https://hootsuite.com/resources/social-media-toolkit" target="_blank" rel="noopener noreferrer" className="link-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ fontSize: '2rem' }}>🦉</span>
                            <h3 style={{ margin: 0 }}>Hootsuite Free Toolkit</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>A comprehensive set of templates and guides.</p>
                        </a>
                        <a href="https://zoho.com/social/toolkit/" target="_blank" rel="noopener noreferrer" className="link-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ fontSize: '2rem' }}>📊</span>
                            <h3 style={{ margin: 0 }}>Zoho Social Templates</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Templates for planning and reporting.</p>
                        </a>
                        <a href="https://buffer.com/resources" target="_blank" rel="noopener noreferrer" className="link-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ fontSize: '2rem' }}>📚</span>
                            <h3 style={{ margin: 0 }}>Buffer Blog</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Social media marketing guides and tips.</p>
                        </a>
                        <a href="https://canva.com/pro/content-planner" target="_blank" rel="noopener noreferrer" className="link-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', textDecoration: 'none', color: 'inherit' }}>
                            <span style={{ fontSize: '2rem' }}>🗓️</span>
                            <h3 style={{ margin: 0 }}>Canva Content Planner</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Plan and schedule content directly from Canva.</p>
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
