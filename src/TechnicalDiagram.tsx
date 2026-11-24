import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type DiagramType =
	| 'data_flow'
	| 'code_crash'
	| 'reactor_core'
	| 'dam_cross_section'
	| 'bridge_stress'
	| 'swiss_cheese'
	| 'server_grid'
	| 'loss_chart';

export type DiagramNode = {
	tag?: string;
	title: string;
	sub?: string;
	badge?: string;
	status?: 'ok' | 'warn' | 'fail';
};
export type SwissLayer = {title: string; sub: string};
export type ServerItem = {label: string; sub?: string; status: 'ok' | 'warn' | 'fail'};
export type ChartPoint = {x: string; y: number; label?: string; alert?: boolean};

export type DiagramProps = {
	type: DiagramType;
	title?: string;
	subtitle?: string;
	rootCause?: string;
	metrics?: {label: string; value: string; alert?: boolean}[];
	highlightNode?: number;
	nodes?: DiagramNode[];
	layers?: SwissLayer[];
	servers?: ServerItem[];
	points?: ChartPoint[];
	unit?: string;
};

const STATUS_COLORS: Record<'ok' | 'warn' | 'fail', {fill: string; stroke: string; text: string; badgeBg: string}> = {
	ok: {fill: '#111927', stroke: '#00dcff', text: '#4ade80', badgeBg: '#0f2922'},
	warn: {fill: '#1f1910', stroke: '#f59e0b', text: '#fbbf24', badgeBg: '#2e220d'},
	fail: {fill: '#1c0d12', stroke: '#ff3b30', text: '#ff453a', badgeBg: '#2d1215'},
};

const DEFAULT_DATA_FLOW_NODES: DiagramNode[] = [
	{tag: 'CLOUD DISPATCH', title: 'SERVER', sub: 'SYNC ACTIVE', status: 'ok'},
	{tag: 'LOGIC PAYLOAD', title: 'Channel File 291', badge: '21 FIELDS vs 20', status: 'fail'},
	{tag: 'KERNEL MEMORY', title: 'RING 0 CRASH', sub: 'OUT-OF-BOUNDS READ', badge: 'PAGE_FAULT_IN_NONPAGED', status: 'fail'},
	{tag: 'GLOBAL IMPACT', title: ':( BSOD', sub: '8.5M COMPUTERS', badge: 'SYSTEM HALTED', status: 'fail'},
];

// 1. Data Flow & IT Crash Diagram (Dynamic per-episode nodes with CrowdStrike fallback)
const DataFlowDiagram: React.FC<{
	nodes?: DiagramNode[];
	rootCause?: string;
	subtitle?: string;
	highlightNode?: number;
	frame: number;
	fps: number;
}> = ({nodes, rootCause, subtitle, highlightNode = 2, frame}) => {
	const pulse = (Math.sin(frame / 4) + 1) / 2;
	const packetOffset = (frame * 6) % 300;
	const items = (nodes && nodes.length >= 3 ? nodes.slice(0, 4) : DEFAULT_DATA_FLOW_NODES).map((n, idx) => ({
		...n,
		status: n.status ?? (idx < highlightNode ? 'ok' : idx === highlightNode ? 'warn' : 'fail'),
	}));
	const footerText =
		rootCause || subtitle || 'IPC Template (21 fields) vs Sensor (20 fields) caused out-of-bounds read in Ring 0';

	// Coordinates for 3 or 4 nodes arranged in a clean pipeline + crash drop
	const positions =
		items.length === 3
			? [
					{x: 60, y: 150, w: 210, h: 130},
					{x: 345, y: 150, w: 210, h: 130},
					{x: 630, y: 150, w: 210, h: 130},
				]
			: [
					{x: 55, y: 120, w: 185, h: 115},
					{x: 350, y: 115, w: 200, h: 125},
					{x: 350, y: 315, w: 200, h: 135},
					{x: 655, y: 120, w: 190, h: 115},
				];

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
					<path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 220, 255, 0.12)" strokeWidth="1" />
				</pattern>
			</defs>

			<rect width="900" height="520" fill="#090d16" rx="16" stroke="#00dcff" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#grid)" rx="16" />

			{/* Connection lines */}
			{items.length === 3 ? (
				<>
					<path d="M 270 215 L 345 215" stroke="#00dcff" strokeWidth="4" strokeDasharray="8 4" opacity="0.65" />
					<path d="M 555 215 L 630 215" stroke="#ff3b30" strokeWidth="4" strokeDasharray="8 4" />
					<circle cx={270 + (packetOffset % 75)} cy={215} r="6" fill="#00ffff" />
				</>
			) : (
				<>
					<path d="M 240 177 L 350 177" stroke="#00dcff" strokeWidth="4" strokeDasharray="8 4" opacity="0.6" />
					<circle cx={240 + (packetOffset % 110)} cy={177} r="6" fill="#00ffff" />
					<path
						d="M 450 240 L 450 315"
						stroke={highlightNode >= 2 ? '#ff2a2a' : '#00dcff'}
						strokeWidth="4"
						strokeDasharray="6 4"
					/>
					<path
						d="M 550 177 L 655 177"
						stroke={highlightNode >= 3 ? '#ff2a2a' : '#00dcff'}
						strokeWidth="4"
					/>
				</>
			)}

			{items.map((node, i) => {
				const pos = positions[i];
				const colors = STATUS_COLORS[node.status];
				const isAlert = node.status === 'fail';
				const cx = pos.w / 2;
				return (
					<g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
						<rect
							width={pos.w}
							height={pos.h}
							rx="10"
							fill={colors.fill}
							stroke={colors.stroke}
							strokeWidth={isAlert ? 3 : 2}
							filter={isAlert ? 'drop-shadow(0 0 12px rgba(255, 42, 42, 0.35))' : undefined}
						/>
						{node.tag && (
							<text x={cx} y="28" fill={colors.text} fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
								{node.tag.slice(0, 22)}
							</text>
						)}
						<text x={cx} y={node.tag ? 56 : 46} fill="#ffffff" fontSize="15" fontFamily="Arial Black, sans-serif" textAnchor="middle">
							{node.title.slice(0, 20)}
						</text>
						{node.sub && (
							<text x={cx} y={pos.h - (node.badge ? 38 : 22)} fill="#cbd5e1" fontSize="11" fontFamily="monospace" textAnchor="middle">
								{node.sub.slice(0, 24)}
							</text>
						)}
						{node.badge && (
							<>
								<rect
									x="12"
									y={pos.h - 30}
									width={pos.w - 24}
									height="22"
									rx="4"
									fill={isAlert ? '#ff2a2a' : colors.badgeBg}
									opacity={isAlert ? 0.35 + 0.65 * pulse : 1}
									stroke={colors.stroke}
									strokeWidth="1"
								/>
								<text x={cx} y={pos.h - 15} fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
									{node.badge.slice(0, 24)}
								</text>
							</>
						)}
					</g>
				);
			})}

			<rect x="30" y="475" width="840" height="32" rx="6" fill="#192231" stroke="#334155" strokeWidth="1" />
			<text x="46" y="496" fill="#00ffff" fontSize="12" fontFamily="monospace" fontWeight="bold">
				ROOT CAUSE:
			</text>
			<text x="145" y="496" fill="#e2e8f0" fontSize="12" fontFamily="monospace">
				{footerText.slice(0, 88)}
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

const DEFAULT_SWISS_LAYERS: SwissLayer[] = [
	{title: 'LAYER 1', sub: 'System Design'},
	{title: 'LAYER 2', sub: 'Operator Training'},
	{title: 'LAYER 3', sub: 'Safety Protocol'},
	{title: 'LAYER 4', sub: 'Emergency Backup'},
];

// 4. Swiss Cheese Model / Failure Chain Diagram (Dynamic 3-5 layers)
const SwissCheeseDiagram: React.FC<{layers?: SwissLayer[]; frame: number; fps: number}> = ({layers, frame}) => {
	const items = layers && layers.length >= 3 ? layers.slice(0, 5) : DEFAULT_SWISS_LAYERS;
	const arrowOffset = Math.min(780, frame * 20);
	const sliceW = items.length >= 5 ? 72 : 80;
	const startX = items.length >= 5 ? 95 : 130;
	const stepX = items.length >= 5 ? 162 : items.length === 4 ? 185 : 240;

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<linearGradient id="cheeseGrad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#f59e0b" />
					<stop offset="100%" stopColor="#b45309" />
				</linearGradient>
			</defs>

			<rect width="900" height="520" fill="#0b0f19" rx="16" stroke="#f59e0b" strokeWidth="2" />

			{items.map((layer, i) => {
				const x = startX + i * stepX;
				const holeY = 260;
				return (
					<g key={i}>
						<rect
							x={x}
							y="90"
							width={sliceW}
							height="330"
							rx="12"
							fill="url(#cheeseGrad)"
							stroke="#fbbf24"
							strokeWidth="3"
							transform="skewY(-10)"
							opacity="0.9"
						/>
						<ellipse
							cx={x + sliceW / 2}
							cy={holeY - x * 0.17}
							rx="24"
							ry="17"
							fill="#0b0f19"
							stroke="#ff3b30"
							strokeWidth="2"
						/>
						<ellipse cx={x + sliceW / 2} cy={160 - x * 0.17} rx="14" ry="11" fill="#0b0f19" opacity="0.6" />
						<ellipse cx={x + sliceW / 2} cy={370 - x * 0.17} rx="16" ry="12" fill="#0b0f19" opacity="0.6" />

						<text x={x + sliceW / 2} y="445" fill="#fde68a" fontSize="13" fontFamily="Arial Black" textAnchor="middle">
							{layer.title.slice(0, 14)}
						</text>
						<text x={x + sliceW / 2} y="468" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle">
							{layer.sub.slice(0, 18)}
						</text>
					</g>
				);
			})}

			{/* Red Trajectory Arrow Penetrating All Holes (The Disaster Path) */}
			<line
				x1="50"
				y1="235"
				x2={50 + arrowOffset}
				y2="235"
				stroke="#ff2a2a"
				strokeWidth="7"
				strokeLinecap="round"
				filter="drop-shadow(0 0 10px #ff2a2a)"
			/>
			{arrowOffset > 700 && (
				<g transform="translate(835, 235)">
					<circle r="34" fill="#ff2a2a" filter="drop-shadow(0 0 20px #ff2a2a)" />
					<text y="5" fill="#fff" fontSize="13" fontFamily="Arial Black" textAnchor="middle">
						CRASH!
					</text>
				</g>
			)}

			<text x="450" y="45" fill="#f59e0b" fontSize="18" fontFamily="Arial Black" textAnchor="middle" letterSpacing="3">
				THE SWISS CHEESE MODEL: ALIGNMENT OF LATENT FAILURES
			</text>
		</svg>
	);
};

const DEFAULT_SERVERS: ServerItem[] = Array.from({length: 8}, (_, i) => ({
	label: `SRV-0${i + 1}`,
	sub: i === 7 ? 'OLD CODE' : 'UPDATED',
	status: i === 7 ? 'fail' : 'ok',
}));

// 5. Server / Node Cluster Grid Diagram
const ServerGridDiagram: React.FC<{servers?: ServerItem[]; rootCause?: string; subtitle?: string; frame: number}> = ({
	servers,
	rootCause,
	subtitle,
	frame,
}) => {
	const items = servers && servers.length > 0 ? servers.slice(0, 8) : DEFAULT_SERVERS;
	const pulse = (Math.sin(frame / 3.5) + 1) / 2;
	const cols = items.length <= 4 ? items.length : 4;
	const cardW = 180;
	const cardH = 148;
	const gapX = 24;
	const gapY = 28;
	const totalW = cols * cardW + (cols - 1) * gapX;
	const offsetX = (900 - totalW) / 2;
	const footerText = rootCause || subtitle || 'Cluster node state snapshot';

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<pattern id="srvGrid" width="30" height="30" patternUnits="userSpaceOnUse">
					<path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 220, 255, 0.1)" strokeWidth="1" />
				</pattern>
			</defs>
			<rect width="900" height="520" fill="#090d16" rx="16" stroke="#00dcff" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#srvGrid)" rx="16" />

			<text x="450" y="46" fill="#94a3b8" fontSize="13" fontFamily="monospace" textAnchor="middle" letterSpacing="2" fontWeight="bold">
				PRODUCTION CLUSTER TELEMETRY
			</text>

			{items.map((srv, i) => {
				const col = i % cols;
				const row = Math.floor(i / cols);
				const x = offsetX + col * (cardW + gapX);
				const y = 78 + row * (cardH + gapY);
				const c = STATUS_COLORS[srv.status];
				const isFail = srv.status === 'fail';
				return (
					<g key={i} transform={`translate(${x}, ${y})`}>
						<rect
							width={cardW}
							height={cardH}
							rx="10"
							fill={c.fill}
							stroke={c.stroke}
							strokeWidth={isFail ? 3 : 2}
							filter={isFail ? 'drop-shadow(0 0 12px rgba(255,59,48,0.4))' : undefined}
						/>
						{/* Rack slot lines */}
						<rect x="16" y="18" width={cardW - 32} height="12" rx="3" fill="#1e293b" />
						<rect x="16" y="36" width={cardW - 32} height="12" rx="3" fill="#1e293b" />
						<circle
							cx={cardW - 24}
							cy="24"
							r="5"
							fill={c.text}
							opacity={isFail ? 0.35 + 0.65 * pulse : 1}
						/>
						<text x={cardW / 2} y="88" fill="#ffffff" fontSize="18" fontFamily="Arial Black, sans-serif" textAnchor="middle">
							{srv.label.slice(0, 14)}
						</text>
						{srv.sub && (
							<>
								<rect x="18" y="104" width={cardW - 36} height="26" rx="5" fill={isFail ? '#ff2a2a' : c.badgeBg} opacity={isFail ? 0.85 : 1} />
								<text x={cardW / 2} y="122" fill="#ffffff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
									{srv.sub.slice(0, 18)}
								</text>
							</>
						)}
					</g>
				);
			})}

			<rect x="30" y="470" width="840" height="32" rx="6" fill="#192231" stroke="#334155" strokeWidth="1" />
			<text x="46" y="491" fill="#00ffff" fontSize="12" fontFamily="monospace" fontWeight="bold">
				STATUS:
			</text>
			<text x="115" y="491" fill="#e2e8f0" fontSize="12" fontFamily="monospace">
				{footerText.slice(0, 90)}
			</text>
		</svg>
	);
};

const DEFAULT_POINTS: ChartPoint[] = [
	{x: '09:30', y: 0, label: '$0'},
	{x: '09:40', y: -110, label: '-$110M'},
	{x: '09:58', y: -220, label: '-$220M', alert: true},
	{x: '10:15', y: -440, label: '-$440M', alert: true},
];

// 6. Animated Telemetry / Loss Chart Diagram
const LossChartDiagram: React.FC<{
	points?: ChartPoint[];
	unit?: string;
	rootCause?: string;
	subtitle?: string;
	frame: number;
}> = ({points, unit = '', rootCause, subtitle, frame}) => {
	const data = points && points.length >= 2 ? points : DEFAULT_POINTS;
	const ys = data.map((p) => p.y);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const spanY = Math.max(1e-6, maxY - minY);

	const left = 95;
	const right = 815;
	const top = 75;
	const bottom = 405;
	const w = right - left;
	const h = bottom - top;

	const coords = data.map((p, i) => ({
		...p,
		px: left + (i / (data.length - 1)) * w,
		py: top + ((maxY - p.y) / spanY) * h,
	}));

	const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(' ');
	const areaPath = `${linePath} L ${coords[coords.length - 1].px.toFixed(1)} ${bottom} L ${coords[0].px.toFixed(1)} ${bottom} Z`;
	const reveal = Math.min(1, frame / 32);
	const dashTotal = 1600;
	const pulse = (Math.sin(frame / 4) + 1) / 2;
	const footerText = rootCause || subtitle || 'Cumulative impact trajectory';

	return (
		<svg viewBox="0 0 900 520" width="100%" height="100%">
			<defs>
				<pattern id="chartGrid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
				</pattern>
				<linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ff3b30" stopOpacity="0.45" />
					<stop offset="100%" stopColor="#ff3b30" stopOpacity="0.02" />
				</linearGradient>
			</defs>

			<rect width="900" height="520" fill="#090d16" rx="16" stroke="#ff3b30" strokeWidth="2" />
			<rect width="900" height="520" fill="url(#chartGrid)" rx="16" />

			{/* Axes */}
			<line x1={left} y1={top} x2={left} y2={bottom} stroke="#475569" strokeWidth="2" />
			<line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#475569" strokeWidth="2" />
			<text x={left - 12} y={top + 6} fill="#94a3b8" fontSize="12" fontFamily="monospace" textAnchor="end">
				{`${maxY}${unit}`}
			</text>
			<text x={left - 12} y={bottom} fill="#ff6b6b" fontSize="12" fontFamily="monospace" textAnchor="end">
				{`${minY}${unit}`}
			</text>

			{/* Area + Animated Line */}
			<path d={areaPath} fill="url(#lossFill)" opacity={reveal} />
			<path
				d={linePath}
				fill="none"
				stroke="#ff3b30"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={dashTotal}
				strokeDashoffset={dashTotal * (1 - reveal)}
				filter="drop-shadow(0 0 8px rgba(255,59,48,0.6))"
			/>

			{/* Data Points */}
			{coords.map((c, i) => {
				const threshold = i / Math.max(1, coords.length - 1);
				if (reveal < threshold * 0.85) return null;
				const labelY = c.py > bottom - 45 ? c.py - 18 : c.py + 26;
				return (
					<g key={i}>
						{c.alert && (
							<circle cx={c.px} cy={c.py} r={12 + 5 * pulse} fill="rgba(255, 59, 48, 0.28)" />
						)}
						<circle cx={c.px} cy={c.py} r={c.alert ? 8 : 6} fill={c.alert ? '#ff3b30' : '#f8fafc'} stroke="#090d16" strokeWidth="2" />
						<text x={c.px} y={bottom + 24} fill="#cbd5e1" fontSize="12" fontFamily="monospace" textAnchor="middle">
							{c.x}
						</text>
						<text
							x={c.px}
							y={labelY}
							fill={c.alert ? '#ff6b6b' : '#e2e8f0'}
							fontSize="13"
							fontFamily="Arial Black, sans-serif"
							textAnchor="middle"
						>
							{c.label || `${c.y}${unit}`}
						</text>
					</g>
				);
			})}

			<rect x="30" y="470" width="840" height="32" rx="6" fill="#192231" stroke="#334155" strokeWidth="1" />
			<text x="46" y="491" fill="#ff6b6b" fontSize="12" fontFamily="monospace" fontWeight="bold">
				IMPACT:
			</text>
			<text x="115" y="491" fill="#e2e8f0" fontSize="12" fontFamily="monospace">
				{footerText.slice(0, 90)}
			</text>
		</svg>
	);
};

export const TechnicalDiagram: React.FC<DiagramProps> = ({
	type,
	title,
	subtitle,
	rootCause,
	highlightNode,
	nodes,
	layers,
	servers,
	points,
	unit,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pop = spring({frame, fps, config: {damping: 12}});

	return (
		<div
			style={{
				position: 'absolute',
				left: 820,
				top: 275,
				width: 1020,
				height: 545,
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
						top: -36,
						left: 16,
						right: 16,
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
					}}
				>
					<span
						style={{
							backgroundColor: '#00dcff',
							color: '#000',
							fontSize: 13,
							fontFamily: 'Arial Black',
							padding: '3px 10px',
							borderRadius: 4,
							letterSpacing: 1.5,
							flexShrink: 0,
						}}
					>
						SCHEMATIC
					</span>
					<span
						style={{
							fontFamily: 'Arial Black, Impact, sans-serif',
							fontSize: 22,
							color: '#fff',
							letterSpacing: 0.5,
							textShadow: '0 2px 10px rgba(0,0,0,0.8)',
							flexShrink: 0,
						}}
					>
						{title}
					</span>
					{subtitle && (
						<span style={{fontFamily: 'monospace', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis'}}>
							// {subtitle}
						</span>
					)}
				</div>
			)}

			{/* Diagram Graphic Content */}
			{type === 'data_flow' || type === 'code_crash' ? (
				<DataFlowDiagram
					nodes={nodes}
					rootCause={rootCause}
					subtitle={subtitle}
					highlightNode={highlightNode}
					frame={frame}
					fps={fps}
				/>
			) : type === 'reactor_core' ? (
				<ReactorDiagram frame={frame} fps={fps} />
			) : type === 'dam_cross_section' ? (
				<DamCrossSectionDiagram frame={frame} fps={fps} />
			) : type === 'server_grid' ? (
				<ServerGridDiagram servers={servers} rootCause={rootCause} subtitle={subtitle} frame={frame} />
			) : type === 'loss_chart' ? (
				<LossChartDiagram points={points} unit={unit} rootCause={rootCause} subtitle={subtitle} frame={frame} />
			) : (
				<SwissCheeseDiagram layers={layers} frame={frame} fps={fps} />
			)}
		</div>
	);
};
