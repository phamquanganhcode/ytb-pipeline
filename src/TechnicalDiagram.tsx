import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type DiagramType =
	| 'data_flow'
	| 'code_crash'
	| 'reactor_core'
	| 'dam_cross_section'
	| 'bridge_stress'
	| 'swiss_cheese';

export type DiagramProps = {
	type: DiagramType;
	title?: string;
	subtitle?: string;
	metrics?: {label: string; value: string; alert?: boolean}[];
	highlightNode?: number;
};

// 1. Data Flow & IT Crash Diagram (CrowdStrike, Pipeline, DDoS, Integer Overflow)
const DataFlowDiagram: React.FC<{highlightNode?: number; frame: number; fps: number}> = ({
	highlightNode = 2,
	frame,
	fps,
}) => {
	const pulse = (Math.sin(frame / 4) + 1) / 2;
	const packetOffset = (frame * 6) % 300;

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				{/* Blueprint Grid Pattern */}
				<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
					<path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 220, 255, 0.12)" strokeWidth="1" />
				</pattern>
				<linearGradient id="alertGrad" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#ff2a2a" />
					<stop offset="100%" stopColor="#ff6b6b" />
				</linearGradient>
			</defs>

			{/* Background Blueprint Canvas */}
			<rect width="900" height="520" fill="#090d16" rx="16" stroke="#00dcff" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#grid)" rx="16" />

			{/* Connection Cables / Bus Lines */}
			{/* Node 1 to Node 2 */}
			<path d="M 220 180 L 420 180" stroke="#00dcff" strokeWidth="4" strokeDasharray="8 4" opacity="0.6" />
			{/* Moving Data Packets */}
			<circle cx={220 + (packetOffset % 200)} cy={180} r="6" fill="#00ffff" filter="drop-shadow(0 0 6px #00ffff)" />

			{/* Node 2 to Node 3 (Fault Line) */}
			<path d="M 480 230 L 480 320" stroke={highlightNode >= 2 ? '#ff2a2a' : '#00dcff'} strokeWidth="4" strokeDasharray="6 4" />
			{/* Node 2 to Node 4 */}
			<path d="M 540 180 L 710 180" stroke={highlightNode >= 3 ? '#ff2a2a' : '#00dcff'} strokeWidth="4" />

			{/* --- NODE 1: Cloud Update Server --- */}
			<g transform="translate(60, 130)">
				<rect width="160" height="100" rx="8" fill="#111927" stroke="#00dcff" strokeWidth="2.5" />
				<text x="80" y="35" fill="#88c0d0" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CLOUD DISPATCH</text>
				<text x="80" y="65" fill="#eceff4" fontSize="16" fontFamily="Arial Black" textAnchor="middle">SERVER</text>
				<circle cx="25" cy="85" r="5" fill="#4ade80" />
				<text x="38" y="89" fill="#4ade80" fontSize="11" fontFamily="monospace">SYNC ACTIVE</text>
			</g>

			{/* --- NODE 2: Channel File / Bad Pointer --- */}
			<g transform="translate(380, 120)">
				<rect
					width="180"
					height="120"
					rx="10"
					fill={highlightNode >= 1 ? 'rgba(255, 42, 42, 0.15)' : '#111927'}
					stroke={highlightNode >= 1 ? '#ff3b30' : '#00dcff'}
					strokeWidth={highlightNode >= 1 ? 3 : 2}
				/>
				<text x="90" y="32" fill="#ff6b6b" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					LOGIC PAYLOAD
				</text>
				<text x="90" y="62" fill="#fff" fontSize="15" fontFamily="Arial Black" textAnchor="middle">
					Channel File 291
				</text>
				<rect x="20" y="76" width="140" height="26" rx="4" fill="#2a1215" stroke="#ff453a" strokeWidth="1" />
				<text x="90" y="94" fill="#ff453a" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					21 FIELDS vs 20
				</text>
			</g>

			{/* --- NODE 3: Kernel Space (Ring 0) Crash --- */}
			<g transform="translate(380, 320)">
				<rect
					width="180"
					height="140"
					rx="10"
					fill="#1c0d12"
					stroke="#ff2a2a"
					strokeWidth="3"
					filter="drop-shadow(0 0 15px rgba(255, 42, 42, 0.4))"
				/>
				<text x="90" y="35" fill="#ff453a" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					KERNEL MEMORY
				</text>
				<text x="90" y="65" fill="#fff" fontSize="18" fontFamily="Arial Black" textAnchor="middle">
					RING 0 CRASH
				</text>
				<text x="90" y="95" fill="#ff3b30" fontSize="12" fontFamily="monospace" textAnchor="middle">
					OUT-OF-BOUNDS READ
				</text>
				<rect x="15" y="108" width="150" height="20" rx="3" fill="#ff2a2a" opacity={0.3 + 0.7 * pulse} />
				<text x="90" y="123" fill="#ffffff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					PAGE_FAULT_IN_NONPAGED
				</text>
			</g>

			{/* --- NODE 4: Global Host Crash (BSOD) --- */}
			<g transform="translate(680, 130)">
				<rect
					width="170"
					height="100"
					rx="8"
					fill="#0044aa"
					stroke="#ffffff"
					strokeWidth="2"
					filter="drop-shadow(0 0 12px rgba(0, 100, 255, 0.5))"
				/>
				<text x="85" y="35" fill="#ffffff" fontSize="18" fontFamily="Arial Black" textAnchor="middle">:( BSOD</text>
				<text x="85" y="65" fill="#d0e2ff" fontSize="12" fontFamily="monospace" textAnchor="middle">8.5M COMPUTERS</text>
				<text x="85" y="85" fill="#ffea79" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SYSTEM HALTED</text>
			</g>

			{/* Warning Banner along bottom */}
			<rect x="30" y="475" width="840" height="32" rx="6" fill="#192231" stroke="#334155" strokeWidth="1" />
			<text x="50" y="496" fill="#00ffff" fontSize="12" fontFamily="monospace" fontWeight="bold">
				ROOT CAUSE:
			</text>
			<text x="160" y="496" fill="#e2e8f0" fontSize="12" fontFamily="monospace">
				IPC Template (21 fields) vs Sensor (20 fields) caused out-of-bounds read in Ring 0
			</text>
		</svg>
	);
};

// 2. Nuclear Reactor Core & Positive Void Diagram (Chernobyl)
const ReactorDiagram: React.FC<{frame: number; fps: number}> = ({frame}) => {
	const boil = (Math.sin(frame / 3) + 1) * 15;
	const powerLevel = Math.min(33000, Math.floor(200 + frame * 350));
	const isDanger = powerLevel > 1500;

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<pattern id="reactorGrid" width="25" height="25" patternUnits="userSpaceOnUse">
					<path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 100, 0, 0.15)" strokeWidth="1" />
				</pattern>
				<linearGradient id="heatGrad" x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor="#ff2200" />
					<stop offset="60%" stopColor="#ff8800" />
					<stop offset="100%" stopColor="#ffee55" />
				</linearGradient>
			</defs>

			<rect width="900" height="520" fill="#0c0e14" rx="16" stroke="#ff6b00" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#reactorGrid)" rx="16" />

			{/* Main Reactor Pressure Vessel */}
			<rect x="250" y="90" width="400" height="340" rx="20" fill="#161922" stroke="#4a5568" strokeWidth="8" />

			{/* Upper Biological Shield (1000 Ton Lid) */}
			<rect x="230" y="60" width="440" height="34" rx="4" fill="#2d3748" stroke="#718096" strokeWidth="3" />
			<text x="450" y="83" fill="#cbd5e0" fontSize="13" fontFamily="Arial Black" textAnchor="middle" letterSpacing="2">
				UPPER BIOLOGICAL SHIELD (1,000 TONS)
			</text>

			{/* Fuel Channels & Graphite Core */}
			{Array.from({length: 8}).map((_, i) => {
				const x = 290 + i * 42;
				return (
					<g key={i}>
						{/* Fuel rod tube */}
						<rect x={x} y={130} width="22" height="260" rx="3" fill="#1a202c" stroke="#ff8800" strokeWidth="1.5" />
						{/* Coolant / Boiling Steam Bubbles */}
						<circle cx={x + 11} cy={350 - boil - i * 12} r="5" fill="#00d4ff" opacity="0.8" />
						<circle cx={x + 11} cy={270 - boil + i * 8} r="6" fill="#ffeeaa" opacity="0.9" />
						{/* Glowing Uranium Fuel pellets */}
						<rect x={x + 4} y={170} width="14" height="190" fill="url(#heatGrad)" opacity={0.85} />
					</g>
				);
			})}

			{/* Control Rods descending with GRAPHITE TIPS */}
			<g transform={`translate(0, ${Math.min(100, frame * 2)})`}>
				{/* Boron Absorber (Upper) */}
				<rect x="330" y="20" width="240" height="80" rx="4" fill="#4a5568" stroke="#cbd5e0" strokeWidth="2" />
				<text x="450" y="65" fill="#fff" fontSize="14" fontFamily="Arial Black" textAnchor="middle">
					BORON ABSORBER
				</text>
				{/* Fateful Graphite Tip (Lower) */}
				<rect x="330" y="100" width="240" height="35" rx="2" fill="#ff3b30" stroke="#ffdd00" strokeWidth="2" />
				<text x="450" y="123" fill="#fff" fontSize="13" fontFamily="Arial Black" textAnchor="middle">
					⚠️ GRAPHITE DISPLACER TIP (+REACTIVITY)
				</text>
			</g>

			{/* Side Telemetry Panel */}
			<g transform="translate(680, 80)">
				<rect width="190" height="360" rx="10" fill="#131620" stroke="#ff453a" strokeWidth="2" />
				<text x="95" y="35" fill="#ff453a" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					LIVE TELEMETRY
				</text>

				{/* Power Gauge */}
				<text x="20" y="80" fill="#94a3b8" fontSize="11" fontFamily="monospace">THERMAL OUTPUT</text>
				<text x="20" y="115" fill={isDanger ? '#ff2a2a' : '#4ade80'} fontSize="26" fontFamily="Arial Black">
					{powerLevel.toLocaleString()} MW
				</text>

				{/* Pressure Gauge */}
				<text x="20" y="165" fill="#94a3b8" fontSize="11" fontFamily="monospace">CORE STEAM RATIO</text>
				<text x="20" y="195" fill="#00e5ff" fontSize="22" fontFamily="Arial Black">
					{Math.min(98, 40 + Math.floor(frame * 1.5))}% STEAM
				</text>

				{/* Positive Void Coeff Alert */}
				<rect x="15" y="235" width="160" height="95" rx="6" fill="#2d1215" stroke="#ff3b30" strokeWidth="1.5" />
				<text x="95" y="260" fill="#ff453a" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					VOID COEFFICIENT
				</text>
				<text x="95" y="285" fill="#ffcc00" fontSize="18" fontFamily="Arial Black" textAnchor="middle">
					+ POSITIVE
				</text>
				<text x="95" y="312" fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle">
					Steam boosts nuclear fission
				</text>
			</g>

			{/* Bottom Rule Stamp */}
			<rect x="250" y="445" width="400" height="32" rx="4" fill="#201518" stroke="#ff3b30" strokeWidth="1" />
			<text x="450" y="466" fill="#ff8800" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
				AZ-5 SCRAM FLAW: Graphite tips enter core first, spiking power
			</text>
		</svg>
	);
};

// 3. Dam Cross-Section & Hydraulic Failure Diagram (Banqiao / St. Francis / Oroville)
const DamCrossSectionDiagram: React.FC<{frame: number; fps: number}> = ({frame}) => {
	const waterLevel = Math.min(380, 260 + frame * 2.5);
	const crackProgress = Math.min(100, frame * 3);

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<pattern id="damGrid" width="30" height="30" patternUnits="userSpaceOnUse">
					<path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 180, 255, 0.1)" strokeWidth="1" />
				</pattern>
				<linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#00b4d8" stopOpacity="0.85" />
					<stop offset="100%" stopColor="#03045e" stopOpacity="0.95" />
				</linearGradient>
			</defs>

			<rect width="900" height="520" fill="#080e1a" rx="16" stroke="#00b4d8" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#damGrid)" rx="16" />

			{/* Water Reservoir (Upstream Left) */}
			<rect x="40" y={440 - waterLevel} width="320" height={waterLevel} fill="url(#waterGrad)" />
			<text x="180" y={470 - waterLevel} fill="#caf0f8" fontSize="14" fontFamily="Arial Black" textAnchor="middle">
				WATER LEVEL: +{Math.floor(waterLevel / 4)}M OVER DESIGN
			</text>

			{/* Hydrostatic Pressure Vectors (Arrows pushing on dam wall) */}
			{[1, 2, 3, 4, 5].map((level) => {
				const y = 140 + level * 50;
				const arrowLen = 30 + level * 25;
				return (
					<g key={level} transform={`translate(${330 - arrowLen}, ${y})`}>
						<line x1="0" y1="0" x2={arrowLen} y2="0" stroke="#ff3b30" strokeWidth="4" />
						<polygon points={`${arrowLen},0 ${arrowLen - 10},-6 ${arrowLen - 10},6`} fill="#ff3b30" />
					</g>
				);
			})}
			<text x="210" y="320" fill="#ff453a" fontSize="12" fontFamily="monospace" fontWeight="bold">
				HYDROSTATIC FORCE P = ρ·g·h
			</text>

			{/* Concrete Gravity Dam Trapezoid Cross Section */}
			<polygon points="360,100 460,100 680,440 360,440" fill="#334155" stroke="#94a3b8" strokeWidth="5" />
			<text x="500" y="240" fill="#f8fafc" fontSize="20" fontFamily="Arial Black" textAnchor="middle" transform="rotate(-35 500 240)">
				CONCRETE DAM WALL
			</text>

			{/* Structural Failure Crack Line */}
			{crackProgress > 20 && (
				<path
					d="M 440 280 L 480 320 L 470 350 L 520 400"
					stroke="#ff2a2a"
					strokeWidth="5"
					fill="none"
					filter="drop-shadow(0 0 8px #ff2a2a)"
				/>
			)}
			{crackProgress > 60 && (
				<text x="560" y="350" fill="#ff3b30" fontSize="14" fontFamily="Arial Black">
					⚡ SHEAR FAILURE
				</text>
			)}

			{/* Downstream Bed */}
			<rect x="680" y="440" width="180" height="40" fill="#1e293b" />
			<text x="770" y="465" fill="#64748b" fontSize="12" fontFamily="monospace" textAnchor="middle">
				DOWNSTREAM VALLEY
			</text>

			{/* Right Info Box */}
			<g transform="translate(680, 80)">
				<rect width="180" height="280" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
				<text x="90" y="30" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					SAFETY MARGIN
				</text>
				<text x="20" y="70" fill="#94a3b8" fontSize="11" fontFamily="monospace">SPILLWAY CAPACITY</text>
				<text x="20" y="95" fill="#ff3b30" fontSize="18" fontFamily="Arial Black">EXCEEDED</text>

				<text x="20" y="140" fill="#94a3b8" fontSize="11" fontFamily="monospace">OVERTOPPING</text>
				<text x="20" y="165" fill="#f59e0b" fontSize="20" fontFamily="Arial Black">0.8 METERS</text>

				<rect x="15" y="195" width="150" height="65" rx="4" fill="#3b070c" stroke="#ef4444" strokeWidth="1" />
				<text x="90" y="220" fill="#fca5a5" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
					FAILURE MODE:
				</text>
				<text x="90" y="242" fill="#fff" fontSize="11" fontFamily="Arial Black" textAnchor="middle">
					FOUNDATION UPLIFT
				</text>
			</g>
		</svg>
	);
};

// 4. Swiss Cheese Model / Failure Chain Diagram
const SwissCheeseDiagram: React.FC<{frame: number; fps: number}> = ({frame}) => {
	const arrowOffset = Math.min(750, frame * 20);

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<linearGradient id="cheeseGrad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#f59e0b" />
					<stop offset="100%" stopColor="#b45309" />
				</linearGradient>
			</defs>

			<rect width="900" height="520" fill="#0b0f19" rx="16" stroke="#f59e0b" strokeWidth="2" />

			{/* 4 Swiss Cheese Layers (Defense-in-Depth) */}
			{[
				{x: 140, title: 'LAYER 1', sub: 'System Design', holeY: 260},
				{x: 320, title: 'LAYER 2', sub: 'Operator Training', holeY: 260},
				{x: 500, title: 'LAYER 3', sub: 'Safety Protocol', holeY: 260},
				{x: 680, title: 'LAYER 4', sub: 'Emergency Backup', holeY: 260},
			].map((layer, i) => (
				<g key={i}>
					{/* Cheese Slice */}
					<rect
						x={layer.x}
						y="90"
						width="80"
						height="340"
						rx="12"
						fill="url(#cheeseGrad)"
						stroke="#fbbf24"
						strokeWidth="3"
						transform={`skewY(-10)`}
						opacity="0.9"
					/>
					{/* Latent Failure Holes */}
					<ellipse cx={layer.x + 40} cy={layer.holeY - layer.x * 0.17} rx="26" ry="18" fill="#0b0f19" stroke="#ff3b30" strokeWidth="2" />
					{/* Decoy random holes */}
					<ellipse cx={layer.x + 40} cy={160 - layer.x * 0.17} rx="16" ry="12" fill="#0b0f19" opacity="0.6" />
					<ellipse cx={layer.x + 40} cy={380 - layer.x * 0.17} rx="18" ry="14" fill="#0b0f19" opacity="0.6" />

					{/* Label */}
					<text x={layer.x + 40} y="445" fill="#fde68a" fontSize="13" fontFamily="Arial Black" textAnchor="middle">
						{layer.title}
					</text>
					<text x={layer.x + 40} y="468" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
						{layer.sub}
					</text>
				</g>
			))}

			{/* Red Trajectory Arrow Penetrating All Holes (The Disaster Path) */}
			<line
				x1="60"
				y1="235"
				x2={60 + arrowOffset}
				y2="235"
				stroke="#ff2a2a"
				strokeWidth="7"
				strokeLinecap="round"
				filter="drop-shadow(0 0 10px #ff2a2a)"
			/>
			{arrowOffset > 700 && (
				<g transform="translate(800, 235)">
					<circle r="36" fill="#ff2a2a" filter="drop-shadow(0 0 20px #ff2a2a)" />
					<text y="6" fill="#fff" fontSize="14" fontFamily="Arial Black" textAnchor="middle">
						CRASH!
					</text>
				</g>
			)}

			{/* Top Header */}
			<text x="450" y="45" fill="#f59e0b" fontSize="18" fontFamily="Arial Black" textAnchor="middle" letterSpacing="3">
				THE SWISS CHEESE MODEL: ALIGNMENT OF LATENT FAILURES
			</text>
		</svg>
	);
};

export const TechnicalDiagram: React.FC<DiagramProps> = ({
	type,
	title,
	subtitle,
	metrics = [],
	highlightNode,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pop = spring({frame, fps, config: {damping: 12}});

	return (
		<div
			style={{
				position: 'absolute',
				left: 820,
				top: 140,
				width: 1020,
				height: 600,
				transform: `scale(${pop})`,
				transformOrigin: 'left center',
				zIndex: 20,
				filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.85))',
			}}
		>
			{/* Top Header Bar */}
			{title && (
				<div
					style={{
						position: 'absolute',
						top: -35,
						left: 20,
						display: 'flex',
						alignItems: 'baseline',
						gap: 14,
					}}
				>
					<span
						style={{
							backgroundColor: '#00dcff',
							color: '#000',
							fontSize: 14,
							fontFamily: 'Arial Black',
							padding: '3px 10px',
							borderRadius: 4,
							letterSpacing: 1.5,
						}}
					>
						SCHEMATIC
					</span>
					<span
						style={{
							fontFamily: 'Arial Black, Impact, sans-serif',
							fontSize: 24,
							color: '#fff',
							letterSpacing: 1,
							textShadow: '0 2px 10px rgba(0,0,0,0.8)',
						}}
					>
						{title}
					</span>
					{subtitle && (
						<span style={{fontFamily: 'monospace', fontSize: 14, color: '#94a3b8'}}>
							// {subtitle}
						</span>
					)}
				</div>
			)}

			{/* Diagram Graphic Content */}
			{type === 'data_flow' || type === 'code_crash' ? (
				<DataFlowDiagram highlightNode={highlightNode} frame={frame} fps={fps} />
			) : type === 'reactor_core' ? (
				<ReactorDiagram frame={frame} fps={fps} />
			) : type === 'dam_cross_section' ? (
				<DamCrossSectionDiagram frame={frame} fps={fps} />
			) : (
				<SwissCheeseDiagram frame={frame} fps={fps} />
			)}
		</div>
	);
};
