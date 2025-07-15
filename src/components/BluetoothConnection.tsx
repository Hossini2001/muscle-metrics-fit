import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bluetooth, BluetoothConnected, Play, Square, Settings } from "lucide-react";
import { useBitalino } from "@/hooks/useBitalino";
import { useState } from "react";

export const BluetoothConnection = () => {
  const { 
    device, 
    isConnecting, 
    isStreaming, 
    latestData,
    connect, 
    disconnect, 
    startStreaming, 
    stopStreaming 
  } = useBitalino();

  const [sampleRate, setSampleRate] = useState(1000);
  const [channels, setChannels] = useState([0, 1]);

  const handleStartStreaming = async () => {
    await startStreaming(sampleRate, channels);
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-primary">
            {device?.isConnected ? (
              <BluetoothConnected className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Bluetooth className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Bitalino Connection</h3>
            <p className="text-sm text-muted-foreground">
              {device?.isConnected ? `Connected to ${device.device.name}` : 'Not connected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {device?.isConnected && (
            <Badge variant={isStreaming ? "default" : "secondary"} className="animate-pulse-glow">
              {isStreaming ? "Streaming" : "Connected"}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          {!device?.isConnected ? (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              variant="medical"
              className="flex-1"
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Bitalino"}
            </Button>
          ) : (
            <Button 
              onClick={disconnect} 
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>

        {device?.isConnected && (
          <>
            <Separator />
            
            {/* Streaming Controls */}
            <div className="space-y-3">
              <h4 className="font-medium">Data Acquisition</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sample Rate (Hz)</label>
                  <select 
                    value={sampleRate} 
                    onChange={(e) => setSampleRate(Number(e.target.value))}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                    disabled={isStreaming}
                  >
                    <option value={100}>100 Hz</option>
                    <option value={1000}>1000 Hz</option>
                    <option value={10000}>10000 Hz</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Active Channels</label>
                  <div className="mt-1 flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map(ch => (
                      <button
                        key={ch}
                        onClick={() => {
                          if (isStreaming) return;
                          setChannels(prev => 
                            prev.includes(ch) 
                              ? prev.filter(c => c !== ch)
                              : [...prev, ch]
                          );
                        }}
                        className={`w-8 h-8 text-xs rounded border ${
                          channels.includes(ch) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background'
                        } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isStreaming}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button 
                    onClick={handleStartStreaming}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Acquisition
                  </Button>
                ) : (
                  <Button 
                    onClick={stopStreaming}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Acquisition
                  </Button>
                )}
              </div>
            </div>

            {/* Data Status */}
            {latestData && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Latest Data</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sequence:</span>
                      <span className="ml-2 font-mono">{latestData.sequence}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Channels:</span>
                      <span className="ml-2 font-mono">{latestData.analog.length}</span>
                    </div>
                    {latestData.analog.map((value, index) => (
                      <div key={index}>
                        <span className="text-muted-foreground">CH{index}:</span>
                        <span className="ml-2 font-mono">{value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
};