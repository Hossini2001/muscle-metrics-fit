import { Card } from "@/components/ui/card";
import { useState, useEffect } from 'react';

interface SensorChartProps {
  title: string;
  type: 'emg' | 'ecg';
  color: string;
}

export const SensorChart = ({ title, type, color }: SensorChartProps) => {
  const [data, setData] = useState<Array<{ time: number; value: number }>>([]);

  // Simulate real-time sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData];
        const time = Date.now();
        
        // Generate different signal patterns for EMG vs ECG
        let value;
        if (type === 'emg') {
          // EMG signal - more random with occasional spikes
          value = Math.sin(time / 1000) * 50 + Math.random() * 30 - 15;
        } else {
          // ECG signal - more regular heartbeat pattern
          const heartbeat = Math.sin(time / 300) * 100;
          const spike = Math.abs(Math.sin(time / 300)) > 0.9 ? Math.random() * 200 : 0;
          value = heartbeat + spike;
        }
        
        newData.push({ time: time % 10000, value });
        
        // Keep only last 50 points for smooth animation
        if (newData.length > 50) {
          newData.shift();
        }
        
        return newData;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [type]);

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse-glow"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="h-64 relative bg-card rounded-lg border overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          {/* Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Signal Path */}
          <path
            d={data.length > 1 ? 
              `M ${data.map((point, index) => 
                `${(index / (data.length - 1)) * 100}% ${50 + (point.value / 200) * 20}%`
              ).join(' L ')}` 
              : ''
            }
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="animate-data-flow"
          />
          
          {/* Filled area */}
          <path
            d={data.length > 1 ? 
              `M ${data.map((point, index) => 
                `${(index / (data.length - 1)) * 100}% ${50 + (point.value / 200) * 20}%`
              ).join(' L ')} L 100% 100% L 0% 100% Z` 
              : ''
            }
            fill={`url(#gradient-${type})`}
          />
        </svg>
        
        {/* Overlay text */}
        <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
          {data.length > 0 && `${data[data.length - 1]?.value.toFixed(1)} μV`}
        </div>
      </div>
    </Card>
  );
};
