import React, { useMemo } from 'react';
import HeatMap from '../components/Map/HeatMap';
import SimulationToggle from '../components/SimulationToggle/SimulationToggle';
import Dashboard from '../components/Dashboard/Dashboard';
import StatCards from '../components/StatCards/StatCards';
import LiveAlerts from '../components/LiveAlerts/LiveAlerts';
import ResponseReadiness from '../components/ResponseReadiness/ResponseReadiness';
import EmergencyShelters from '../components/EmergencyShelters/EmergencyShelters';
import AIPrediction from '../components/AIPrediction/AIPrediction';
import { useApp } from '../context/AppContext';
import { MapPin, Thermometer, ShieldAlert, Users, CheckCircle2, AlertTriangle, MessageSquareWarning } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// Stable sparkline generator (seeded by baseTemp to avoid re-render thrash)
const buildSparkline = (baseTemp) =>
  Array.from({ length: 12 }, (_, i) => ({
    time: i,
    temp: baseTemp + Math.sin(i / 2) * 5 + (i % 3 - 1)
  }));

function AuthorityDashboard() {
  const { selectedWard } = useApp();

  // Memoize sparkline so it only recomputes when the base temperature changes
  const sparklineData = useMemo(
    () => buildSparkline(selectedWard?.latestRisk?.forecastTempC || 35),
    [selectedWard?.latestRisk?.forecastTempC]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-5 md:gap-8 font-sans">

      {/* Top Stat Cards */}
      <StatCards />

      {/* Map + Sidebar Hero Row (560px Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 md:gap-6 items-stretch">
        
        {/* Main Map Area */}
        <div className="glass-panel relative w-full h-[350px] md:h-[450px] lg:h-[560px] min-h-[300px] overflow-hidden">
          <HeatMap />
        </div>

        {/* Right Sidebar Controls */}
        <div className="flex flex-col gap-4 md:gap-6 lg:h-[560px] overflow-hidden">
          
          {/* Simulation Demo Control Panel */}
          <SimulationToggle />

          {/* Selected Ward Details Panel */}
          <div className="glass-panel p-6 flex-1 flex flex-col overflow-y-auto">
            
            {selectedWard ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{selectedWard.name}</h3>
                    <div className="flex items-center text-xs text-gray-400 gap-2 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" /> {selectedWard.wardId}
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                    ${selectedWard.latestRisk?.riskTier === 'Extreme' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                    ${selectedWard.latestRisk?.riskTier === 'Severe' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                    ${selectedWard.latestRisk?.riskTier === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                    ${selectedWard.latestRisk?.riskTier === 'Low' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : ''}
                  `}>
                    {selectedWard.latestRisk?.riskTier || 'Unknown'} Risk
                  </div>
                </div>
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/40 rounded-lg p-3.5 border border-white/10">
                    <div className="text-gray-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><Thermometer className="w-3.5 h-3.5 text-orange-400"/> Forecast Temp</div>
                    <div className="text-2xl font-bold text-white tabular-data">{selectedWard.latestRisk?.forecastTempC ?? '—'}°C</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3.5 border border-white/10">
                    <div className="text-gray-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><ShieldAlert className="w-3.5 h-3.5 text-red-400"/> Heat Index (HVI)</div>
                    <div className="text-2xl font-bold text-white tabular-data">{selectedWard.latestRisk?.hvi ?? '—'}</div>
                  </div>
                  <div className="col-span-2 bg-black/40 rounded-lg p-3.5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-gray-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><Users className="w-3.5 h-3.5 text-teal-400"/> Vulnerability Score</div>
                      <div className="text-lg font-bold text-white tabular-data">{selectedWard.vulnerabilityScore ?? 'N/A'}/100</div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>Elderly Share: <strong className="text-white">{(selectedWard.pctElderly * 100).toFixed(0)}%</strong></div>
                      <div>Outdoor Workers: <strong className="text-white">{(selectedWard.pctOutdoorWorkers * 100).toFixed(0)}%</strong></div>
                    </div>
                  </div>
                </div>

                {/* Sparkline (24h Trend) */}
                <div className="mb-6">
                  <div className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">24h Temperature Trend</div>
                  <div className="h-16 w-full opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedWard.latestRisk?.riskTier === 'Extreme' ? '#EF4444' : '#FB7A3C'} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={selectedWard.latestRisk?.riskTier === 'Extreme' ? '#EF4444' : '#FB7A3C'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="temp" stroke={selectedWard.latestRisk?.riskTier === 'Extreme' ? '#EF4444' : '#FB7A3C'} strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Recommended Actions */}
                <div>
                  <div className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider">Recommended Actions</div>
                  <ul className="space-y-2.5 text-sm">
                    {(selectedWard.latestRisk?.riskTier === 'Extreme' || selectedWard.latestRisk?.riskTier === 'Severe') ? (
                      <>
                        <li className="flex items-start gap-2.5 text-gray-200"><AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0"/> Issue SMS alert to vulnerable populations</li>
                        <li className="flex items-start gap-2.5 text-gray-200"><CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0"/> Open emergency cooling centers</li>
                        <li className="flex items-start gap-2.5 text-gray-200"><MessageSquareWarning className="w-4 h-4 text-orange-400 mt-0.5 shrink-0"/> Dispatch water tankers to high-density zones</li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2 text-gray-400 italic">No immediate action required. Monitor forecasts.</li>
                    )}
                  </ul>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                <MapPin className="w-12 h-12 mb-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-300">No Ward Selected</p>
                <p className="text-xs text-gray-400 mt-1">Select a ward on the map<br/>to view vulnerability context.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Alerts + Response Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <LiveAlerts />
        <ResponseReadiness />
      </div>

      {/* Analytics Charts & Alerts Table (Full Width) */}
      <Dashboard />

      {/* Emergency Shelters + AI Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <EmergencyShelters />
        <AIPrediction />
      </div>
    </div>
  );
}

export default AuthorityDashboard;
