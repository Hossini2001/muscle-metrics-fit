import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Download, RefreshCw } from "lucide-react";

export const FatigueAnalysis = () => {
  const fatigueData = [
    { muscle: "Biceps", fatigue: 65, status: "moderate" },
    { muscle: "Triceps", fatigue: 45, status: "low" },
    { muscle: "Quadriceps", fatigue: 78, status: "high" },
    { muscle: "Hamstrings", fatigue: 52, status: "moderate" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low": return "bg-medical-green";
      case "moderate": return "bg-medical-orange";
      case "high": return "bg-medical-red";
      default: return "bg-muted";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "low": return "secondary";
      case "moderate": return "default";
      case "high": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-primary">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Fatigue Analysis</h3>
            <p className="text-sm text-muted-foreground">Real-time muscle fatigue assessment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fatigueData.map((item) => (
          <div key={item.muscle} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.muscle}</span>
              <Badge variant={getStatusVariant(item.status)}>
                {item.fatigue}% {item.status}
              </Badge>
            </div>
            <Progress 
              value={item.fatigue} 
              className="h-3"
            />
            <div className="text-xs text-muted-foreground">
              {item.fatigue < 50 && "Optimal performance range"}
              {item.fatigue >= 50 && item.fatigue < 70 && "Monitor closely, consider rest"}
              {item.fatigue >= 70 && "High fatigue detected, rest recommended"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-subtle rounded-lg border border-border">
        <h4 className="font-medium mb-2">Analysis Summary</h4>
        <p className="text-sm text-muted-foreground">
          Overall fatigue level is <span className="font-medium text-medical-orange">moderate</span>. 
          Quadriceps showing elevated fatigue levels. Consider reducing load or taking a recovery break.
          Heart rate variability indicates good cardiovascular response.
        </p>
      </div>
    </Card>
  );
};