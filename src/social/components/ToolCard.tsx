import type { ToolkitItem } from '../lib/types';

interface ToolCardProps {
    tool: ToolkitItem;
}

export default function ToolCard({ tool }: ToolCardProps) {
    return (
        <div className={`tool-card ${tool.recommended ? 'recommended' : ''}`}>
            <div className="tool-card-header">
                <span className="tool-icon">{tool.emoji}</span>
                <h3 className="tool-name">{tool.name}</h3>
                {tool.recommended && (
                    <span className="badge recommended">Recommended</span>
                )}
            </div>
            
            <p className="tool-description">{tool.description}</p>
            
            {tool.features && tool.features.length > 0 && (
                <ul className="tool-features">
                    {tool.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                    ))}
                </ul>
            )}
            
            <div className="tool-card-footer">
                <div className="tool-tags">
                    {tool.price && (
                        <span className="tag price">{tool.price}</span>
                    )}
                    {tool.status && (
                        <span className={`tag status ${tool.status.toLowerCase()}`}>
                            {tool.status}
                        </span>
                    )}
                    {tool.category && (
                        <span className="tag category">{tool.category}</span>
                    )}
                </div>
                
                {tool.url && (
                    <a 
                        href={tool.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="tool-link"
                    >
                        Visit Tool
                    </a>
                )}
            </div>
        </div>
    );
};
