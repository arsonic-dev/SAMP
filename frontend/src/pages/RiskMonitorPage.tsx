import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { policyApi } from '../api/policy'
import { RiskGauge } from '../components/RiskGauge'
import * as THREE from 'three'

import Globe from 'react-globe.gl'
import { useEffect, useState, useMemo } from 'react'

function ThreatGlobe({ riskScore }: { riskScore: number }) {
  const globeRef = useRef<any>()
  const [countries, setCountries] = useState({ features: [] })

  useEffect(() => {
    // Auto-rotate the globe
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 1.2
      globeRef.current.controls().enableZoom = false
      
      // Set a custom ambient light for that sci-fi glow
      const scene = globeRef.current.scene()
      const ambientLight = new THREE.AmbientLight(0x00d4ff, 0.3)
      scene.add(ambientLight)
    }

    // Fetch GeoJSON for countries to create hex polygons
    fetch('https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
  }, [])

  // Generate random data for arcs, rings, and points to visualize global threat traffic
  const { arcsData, ringsData, pointsData } = useMemo(() => {
    const N = 40
    const arcs = [...Array(N).keys()].map(() => ({
      startLat: (Math.random() - 0.5) * 180,
      startLng: (Math.random() - 0.5) * 360,
      endLat: (Math.random() - 0.5) * 180,
      endLng: (Math.random() - 0.5) * 360,
      color: ['#00D4FF', '#E8FF47', '#FF3B3B'][Math.floor(Math.random() * 3)]
    }))
    
    const rings = arcs.map(arc => ({
      lat: arc.endLat,
      lng: arc.endLng,
      color: arc.color,
      maxR: Math.random() * 8 + 3,
      propagationSpeed: (Math.random() - 0.5) * 2 + 3,
      repeatPeriod: Math.random() * 2000 + 1000
    }))

    const points = [...Array(N * 2).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360,
      size: Math.random() * 0.5 + 0.1,
      color: ['#00d4ff', '#e8ff47', '#ffffff'][Math.floor(Math.random() * 3)]
    }))
    
    return { arcsData: arcs, ringsData: rings, pointsData: points }
  }, [])

  // Custom material for the dark, high-tech globe surface
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial()
    mat.color = new THREE.Color('#020813')
    mat.emissive = new THREE.Color('#001122')
    mat.emissiveIntensity = 0.5
    mat.shininess = 1.0
    return mat
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center cursor-move">
      <Globe
        ref={globeRef}
        width={750}
        height={750}
        backgroundColor="rgba(0,0,0,0)"
        
        // Base surface
        globeMaterial={globeMaterial}
        showAtmosphere={true}
        atmosphereColor="#00d4ff"
        atmosphereAltitude={0.25}
        
        // Hex Polygons for continents (Sci-Fi Map)
        hexPolygonsData={countries.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.3}
        hexPolygonColor={() => 'rgba(0, 212, 255, 0.4)'}
        hexPolygonAltitude={0.015}
        
        // Network Arcs
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcAltitudeAutoScale={0.4}
        arcStroke={0.5}
        
        // Ping Rings
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        
        // Active Nodes
        pointsData={pointsData}
        pointColor="color"
        pointAltitude={0.02}
        pointRadius="size"
        pointsMerge={true}
      />
    </div>
  )
}

export function RiskMonitorPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['risk-monitor', user?.id],
    queryFn: () =>
      policyApi.evaluate({
        userId: user?.id ?? '',
        resource: 'risk-monitor',
        action: 'view',
        context: { ipAddress: '192.168.1.1' },
      }),
    enabled: !!user?.id && user.id !== '',
    refetchInterval: 30_000,
  })

  const result = data?.data
  const riskScore = result?.riskScore ?? 0

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">
      <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4 shrink-0">
        <div>
          <h1 className="font-display-wordmark text-[24px] text-white leading-none tracking-wider uppercase">RISK MONITOR</h1>
          <p className="font-status-ui text-status-ui text-white/40 mt-2 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 ${riskScore > 60 ? 'bg-error' : 'bg-primary-fixed'} block animate-pulse`}></span> 
            {riskScore > 60 ? 'CRITICAL THREAT LEVEL DETECTED' : 'SYSTEM NOMINAL // THREAT DETECTION ACTIVE'}
          </p>
        </div>
        <div className="font-data-mono text-data-mono text-right flex flex-col items-end gap-1">
          <div className="text-white/40 flex items-center gap-2">
            <span className="text-[#E8FF47]">SYS_TIME:</span> {new Date().toLocaleTimeString([], { hour12: false })} UTC
          </div>
          <div className="text-white/40 flex items-center gap-2">
            <span className="text-[#E8FF47]">USER_ID:</span> {user?.id?.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Tri-Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 h-full min-h-0">
        {/* LEFT COLUMN: Metadata & Latency */}
        <div className="lg:col-span-3 flex flex-col gap-10 h-full min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {/* Panel 1: Network Resolve */}
          <div className="border border-white/10 bg-white/5 flex flex-col">
            <div className="border-b border-white/10 px-3 py-2 bg-surface-container-high/40 flex justify-between items-center">
              <span className="font-status-ui text-status-ui text-white/40 uppercase tracking-widest">NETWORK RESOLVE</span>
              <span className="material-symbols-outlined text-[14px] text-[#E8FF47]" style={{ fontVariationSettings: "'FILL' 0" }}>dns</span>
            </div>
            <div className="p-4 flex flex-col gap-3 font-data-mono text-data-mono">
              <div className="flex justify-between items-end border-b border-white/5 pb-1">
                <span className="text-white/40">ACTIVE_NODES</span>
                <span className="text-[#E8FF47] font-bold">14,204</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1">
                <span className="text-white/40">FAILED_NODES</span>
                <span className="text-error">0,012</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1">
                <span className="text-white/40">SYNC_RATE</span>
                <span className="text-on-surface">99.8%</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1">
                <span className="text-white/40">RISK_SCORE</span>
                <span className={`font-bold ${riskScore > 60 ? 'text-error' : 'text-[#E8FF47]'}`}>{riskScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Latency Stream */}
          <div className="border border-white/10 bg-white/5 flex flex-col flex-1 min-h-[200px]">
            <div className="border-b border-white/10 px-3 py-2 bg-surface-container-high/40 flex justify-between items-center">
              <span className="font-status-ui text-status-ui text-white/40 uppercase tracking-widest">LATENCY STREAM</span>
              <span className="material-symbols-outlined text-[14px] text-white/40" style={{ fontVariationSettings: "'FILL' 0" }}>timeline</span>
            </div>
            <div className="p-3 flex flex-col gap-1 font-data-mono text-data-mono text-[10px] overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:50]</span> <span className="text-on-surface flex-1">PING_EU_CENTRAL</span> <span className="text-[#E8FF47]">12ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:51]</span> <span className="text-on-surface flex-1">PING_US_EAST</span> <span className="text-[#E8FF47]">45ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1 bg-error/10 border-l border-error pl-2"><span className="text-white/40/50">[14:02:52]</span> <span className="text-on-surface flex-1">PING_AP_SOUTHEAST</span> <span className="text-error">210ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:53]</span> <span className="text-on-surface flex-1">PING_SA_EAST</span> <span className="text-[#E8FF47]">88ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:54]</span> <span className="text-on-surface flex-1">PING_EU_WEST</span> <span className="text-[#E8FF47]">15ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:55]</span> <span className="text-on-surface flex-1">PING_US_WEST</span> <span className="text-[#E8FF47]">62ms</span></div>
              <div className="flex gap-3 hover:bg-surface-container/50 px-1"><span className="text-white/40/50">[14:02:56]</span> <span className="text-on-surface flex-1">PING_AF_SOUTH</span> <span className="text-[#E8FF47]">140ms</span></div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: 3D Globe Visualization */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-0 border border-white/10 bg-white/1 relative p-1">
          {/* HUD Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 hud-corner-tl border-primary-fixed/40 m-2 pointer-events-none z-20"></div>
          <div className="absolute top-0 right-0 w-8 h-8 hud-corner-tr border-primary-fixed/40 m-2 pointer-events-none z-20"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 hud-corner-bl border-primary-fixed/40 m-2 pointer-events-none z-20"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 hud-corner-br border-primary-fixed/40 m-2 pointer-events-none z-20"></div>
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 font-status-ui text-status-ui text-[#E8FF47]/70 tracking-widest bg-black/50 px-4 py-1 border border-primary-fixed/20 z-10">GLOBAL_THREAT_MATRIX</div>
          
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-high/40 to-black">
            {/* Crosshair Center */}
            <div className="absolute w-full h-[1px] bg-primary-fixed/10 pointer-events-none"></div>
            <div className="absolute h-full w-[1px] bg-primary-fixed/10 pointer-events-none"></div>
            <div className="absolute w-16 h-16 border rounded-full border-primary-fixed/20 pointer-events-none"></div>
            
            <div className="w-full h-full opacity-80 mix-blend-screen flex items-center justify-center pointer-events-auto">
              <ThreatGlobe riskScore={riskScore} />
            </div>

            {/* Overlay Targeting UI */}
            {riskScore > 40 && (
              <div className="absolute top-1/4 right-1/4 flex items-center gap-2 pointer-events-none z-10">
                <div className="w-2 h-2 bg-error rounded-full animate-ping"></div>
                <div className="border border-error bg-black/60 px-2 py-1 font-status-ui text-status-ui text-error flex flex-col">
                  <span>ANOMALY DETECTED</span>
                  <span className="text-[8px] opacity-70">LAT: 45.42 // LNG: -75.69</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Risk Factor Breakdown */}
        <div className="lg:col-span-3 flex flex-col gap-10 h-full min-h-0 overflow-y-auto pl-2 custom-scrollbar">
          <div className="border border-white/10 bg-white/5 flex flex-col">
            <div className="border-b border-white/10 px-3 py-2 bg-surface-container-high/40 flex justify-between items-center">
              <span className="font-status-ui text-status-ui text-white/40 uppercase tracking-widest">RISK FACTOR BREAKDOWN</span>
              <span className="material-symbols-outlined text-[14px] text-error" style={{ fontVariationSettings: "'FILL' 0" }}>warning</span>
            </div>
            <div className="p-4 flex flex-col gap-5 font-data-mono text-data-mono">
              {/* Factor 1 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-on-surface">IP REPUTATION</span>
                  <span className={`font-bold text-status-ui ${riskScore > 70 ? 'text-error' : 'text-[#E8FF47]'}`}>
                    {riskScore > 70 ? 'CRITICAL_RISK' : 'NOMINAL'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest border border-white/10 flex relative">
                  <div 
                    className={`h-full relative overflow-hidden transition-all duration-1000 ${riskScore > 70 ? 'bg-error' : 'bg-primary-fixed'}`} 
                    style={{ width: `${Math.min(riskScore + 10, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
                  </div>
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">SCORE: {Math.min(riskScore + 10, 100).toFixed(0)}/100</div>
              </div>
              {/* Factor 2 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-on-surface">VELOCITY RATIO</span>
                  <span className="text-[#E8FF47] font-bold text-status-ui">ELEVATED</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest border border-white/10 flex relative">
                  <div className="h-full bg-primary-fixed w-[62%]"></div>
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">REQ/SEC: 4,022</div>
              </div>
              {/* Factor 3 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-on-surface">GEO-MISMATCH</span>
                  <span className="text-white/40 font-bold text-status-ui">NOMINAL</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest border border-white/10 flex relative">
                  <div className="h-full bg-white/40 w-[12%]"></div>
                </div>
                <div className="text-[10px] text-white/40 mt-1 text-right">DEVIATION: 1.2%</div>
              </div>
            </div>
          </div>

          {/* Security Events Stream */}
          <div className="border border-white/10 bg-white/5 flex flex-col flex-1 min-h-[200px]">
            <div className="border-b border-white/10 px-3 py-2 bg-surface-container-high/40 flex justify-between items-center">
              <span className="font-status-ui text-status-ui text-white/40 uppercase tracking-widest">SECURITY EVENTS</span>
              <span className="material-symbols-outlined text-[14px] text-white/40" style={{ fontVariationSettings: "'FILL' 0" }}>list</span>
            </div>
            <div className="p-3 flex flex-col gap-2 font-data-mono text-data-mono text-[10px] overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex gap-2 text-white/40 break-all leading-tight"><span className="text-white/40/50">[SYS]</span> Auth token generated for op_01</div>
              <div className="flex gap-2 text-white/40 break-all leading-tight"><span className="text-white/40/50">[NET]</span> Route optimized via node_x7</div>
              {riskScore > 50 && (
                <div className="flex gap-2 text-error break-all leading-tight"><span className="text-error/50">[SEC]</span> BLOCKED: Malformed packet from 192.168.x.x</div>
              )}
              <div className="flex gap-2 text-white/40 break-all leading-tight"><span className="text-white/40/50">[SYS]</span> Garbage collection completed</div>
              <div className="flex gap-2 text-[#E8FF47] break-all leading-tight"><span className="text-[#E8FF47]/50">[SEC]</span> Signature database updated <span className="text-[#E8FF47] ml-auto font-bold">OK</span></div>
              <div className="flex gap-2 text-white/40 break-all leading-tight"><span className="text-white/40/50">[NET]</span> Ping threshold nominal</div>
              <div className="flex gap-2 text-white/40 break-all leading-tight"><span className="text-white/40/50">[SYS]</span> Process thread idle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

