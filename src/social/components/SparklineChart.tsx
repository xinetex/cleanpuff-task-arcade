interface SparklineChartProps {
    data: number[];
    color?: string;
    height?: number;
    barCount?: number;
}

export default function SparklineChart({
    data,
    color = '#00e5a0',
    height = 40,
    barCount = 7,
}: SparklineChartProps) {
    const displayData = data.slice(-barCount);
    const maxVal = Math.max(...displayData, 1);

    return (
        <div
            className="sparkline"
            style={{
                '--sparkline-height': `${height}px`,
                '--sparkline-color': color,
            } as React.CSSProperties}
        >
            {displayData.map((value, i) => {
                const barHeight = (value / maxVal) * 100;
                return (
                    <div
                        key={i}
                        className="sparkline-bar"
                        style={{
                            '--bar-height': `${barHeight}%`,
                            '--animation-delay': `${i * 0.1}s`,
                        } as React.CSSProperties}
                        title={value.toString()}
                    />
                );
            })}
        </div>
    );
}
