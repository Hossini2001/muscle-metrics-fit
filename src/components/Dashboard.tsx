import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { SensorChart } from "./SensorChart";
import { FatigueAnalysis } from "./FatigueAnalysis";
import heroBg from "@/assets/hero-bg.jpg";

export const Dashboard = () => {
  return (
    <div 
      className="min-h-screen bg-gradient-subtle p-6 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(210, 225, 248, 0.85), rgba(210, 225, 248, 0.9)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              FitFit
            </h1>
            <p className="text-muted-foreground">Advanced Fitness Analysis & Muscle Fatigue Monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="animate-pulse-glow">
              <Activity className="w-4 h-4 mr-2" />
              Live Monitoring
            </Badge>
            <Button variant="medical">Start Session</Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 shadow-card hover:shadow-medical transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-primary animate-heartbeat">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                <p className="text-2xl font-bold text-medical-blue">72 BPM</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-medical transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-secondary">
                <Zap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Muscle Activity</p>
                <p className="text-2xl font-bold text-medical-green">85%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-medical transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-medical-orange/20">
                <TrendingUp className="w-6 h-6 text-medical-orange" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fatigue Level</p>
                <p className="text-2xl font-bold text-medical-orange">Medium</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-medical transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-medical-red/20">
                <AlertTriangle className="w-6 h-6 text-medical-red" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-medical-red">Low</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SensorChart 
            title="EMG Signal - Muscle Activity"
            type="emg"
            color="hsl(var(--medical-blue))"
          />
          <SensorChart 
            title="ECG Signal - Heart Activity"
            type="ecg"
            color="hsl(var(--health-green))"
          />
        </div>

        {/* Fatigue Analysis */}
        <FatigueAnalysis />
      </div>
    </div>
  );
};