import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	interpolate,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export type DocuPrototypeProps = {
	audio: string;
	fps: number;
	durationInFrames: number;
	beats: number[]; // 7 start frames matching the 7 narrative segments
	hasNyseImg: boolean;
	hasFloorImg: boolean;
	hasServerImg: boolean;
};

const SANS = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace";
const SERIF = "'Georgia', 'Times New Roman', serif";
const FADE_FRAMES = 10;

const useFadeEnvelope = (duration: number) => {
	const frame = useCurrentFrame();
	const fadeIn = interpolate(frame, [0, FADE_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const fadeOut = interpolate(frame, [Math.max(0, duration - FADE_FRAMES), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

// Lightweight CSS film grain + 2.35:1 cinematic letterbox & radial vignette (fast software render).
const DocumentaryPolish: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none', zIndex: 40}}>
		<AbsoluteFill
			style={{
				background:
					'radial-gradient(ellipse at center, transparent 54%, rgba(3, 5, 10, 0.72) 100%)',
			}}
		/>
		<AbsoluteFill
			style={{
				opacity: 0.035,
				backgroundImage:
					'repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px), repeating-radial-gradient(circle at 83% 68%, rgba(255,255,255,0.45) 0 1px, transparent 1px 4px)',
			}}
		/>
		{/* Subtle 2.35:1 cinema letterbox bars */}
		<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 52, backgroundColor: '#040508'}} />
		<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 52, backgroundColor: '#040508'}} />
	</AbsoluteFill>
);

// Scene 0 (0.0s - 3.5s): High-retention 3-cut Cold Hook, zero fade-from-black at frame 0.
const HOOK_LOGS = [
	'[FATAL] srv-08.smars.prod  POWER_PEG_ACTIVE  stop_limit=NULL',
	'[ALERT] 09:30:01  40 child orders/sec  ->  NYSE RLP loop',
	'[LOSS]  -$163,000 / SEC  |  154 TICKERS SWINGING WILDLY',
	'[WARN]  NO KILL SWITCH FOUND IN SMARS RUNBOOK',
];

const Scene0Hook3s: React.FC<{duration: number; hasNyseImg: boolean}> = ({duration, hasNyseImg}) => {
	const frame = useCurrentFrame();
	const fadeOut = interpolate(frame, [Math.max(0, duration - 6), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const cut1End = Math.min(33, Math.floor(duration * 0.31));
	const cut2End = Math.min(66, Math.floor(duration * 0.63));
	const cut = frame < cut1End ? 0 : frame < cut2End ? 1 : 2;

	// Subtle impact micro-shake on frame 0 and cut transitions
	const localF = cut === 0 ? frame : cut === 1 ? frame - cut1End : frame - cut2End;
	const shakeAmp = Math.max(0, 5 - localF * 0.6);
	const shakeX = Math.sin(localF * 2.7) * shakeAmp;
	const shakeY = Math.cos(localF * 3.3) * shakeAmp;

	const burnDollar = Math.round(interpolate(frame, [0, cut1End], [163000, 440000000], {extrapolateRight: 'clamp'}));

	return (
		<AbsoluteFill style={{backgroundColor: '#050609', opacity: fadeOut, transform: `translate(${shakeX}px, ${shakeY}px)`}}>
			<Sequence from={0} layout="none">
				<Audio src={staticFile('sfx/boom.wav')} volume={0.28} />
			</Sequence>
			<Sequence from={cut1End} layout="none">
				<Audio src={staticFile('sfx/glitch.wav')} volume={0.18} />
			</Sequence>
			<Sequence from={cut2End} layout="none">
				<Audio src={staticFile('sfx/thud.wav')} volume={0.22} />
			</Sequence>

			{cut === 0 && (
				<AbsoluteFill
					style={{
						background: 'radial-gradient(circle at center, rgba(153, 27, 27, 0.34) 0%, #050609 72%)',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: '#fca5a5', marginBottom: 16}}>
						09:30:01 AM EDT  •  SYSTEM FAILURE DETECTED
					</div>
					<div
						style={{
							fontFamily: SANS,
							fontSize: 158,
							fontWeight: 900,
							color: '#ff3b30',
							letterSpacing: -4,
							lineHeight: 1,
							textShadow: '0 0 65px rgba(255, 59, 48, 0.55)',
						}}
					>
						-${burnDollar.toLocaleString()}
					</div>
					<div style={{fontFamily: MONO, fontSize: 28, color: '#f8fafc', marginTop: 22, letterSpacing: 3}}>
						163,000 DOLLARS LOST PER SECOND
					</div>
				</AbsoluteFill>
			)}

			{cut === 1 && (
				<AbsoluteFill
					style={{
						backgroundColor: '#07090f',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 28,
					}}
				>
					<div
						style={{
							width: 1120,
							backgroundColor: 'rgba(45, 14, 18, 0.96)',
							border: '3px solid #ff3b30',
							borderRadius: 12,
							padding: '32px 44px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							boxShadow: '0 0 50px rgba(255, 59, 48, 0.45)',
						}}
					>
						<div>
							<div style={{fontFamily: MONO, fontSize: 20, color: '#fca5a5', letterSpacing: 3}}>
								PRODUCTION ROUTER  •  SMARS NODE 8 / 8
							</div>
							<div style={{fontFamily: SANS, fontSize: 58, fontWeight: 900, color: '#ffffff', marginTop: 6}}>
								SRV-08: UPDATE SKIPPED
							</div>
						</div>
						<div
							style={{
								backgroundColor: '#ff3b30',
								color: '#ffffff',
								fontFamily: MONO,
								fontSize: 24,
								fontWeight: 800,
								padding: '12px 24px',
								borderRadius: 6,
							}}
						>
							2003 BUG ACTIVE
						</div>
					</div>
					<div
						style={{
							width: 1120,
							backgroundColor: '#0b101b',
							border: '1.5px solid #334155',
							borderRadius: 10,
							padding: '22px 30px',
							fontFamily: MONO,
							fontSize: 22,
							lineHeight: 1.75,
						}}
					>
						{HOOK_LOGS.map((row, idx) => (
							<div key={idx} style={{color: idx === 0 || idx === 3 ? '#ff453a' : '#fbbf24'}}>
								{row}
							</div>
						))}
					</div>
				</AbsoluteFill>
			)}

			{cut === 2 && (
				<AbsoluteFill style={{backgroundColor: '#06080d'}}>
					{hasNyseImg ? (
						<Img
							src={staticFile('docu/nyse.jpg')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								transform: `scale(${1.05 + localF * 0.002})`,
								filter: 'grayscale(70%) contrast(1.3) brightness(0.24)',
							}}
						/>
					) : null}
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(6,8,13,0.45) 0%, rgba(6,8,13,0.92) 80%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div style={{fontFamily: SANS, fontSize: 132, fontWeight: 900, color: '#ffffff', letterSpacing: -3, lineHeight: 0.96}}>
							$440 MILLION
						</div>
						<div style={{fontFamily: SANS, fontSize: 54, fontWeight: 800, color: '#e2e8f0', marginTop: 14, letterSpacing: 2}}>
							WIPED OUT IN 45 MINUTES
						</div>
						<div
							style={{
								marginTop: 28,
								backgroundColor: '#ff3b30',
								color: '#ffffff',
								fontFamily: MONO,
								fontSize: 28,
								fontWeight: 800,
								padding: '10px 28px',
								borderRadius: 4,
								letterSpacing: 3,
							}}
						>
							ONE SKIPPED SERVER
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

// Scene 1: Full-bleed dark archival NYSE opener with Ken Burns zoom + minimalist lower-left timestamp.
const Scene1Opener: React.FC<{duration: number; hasImg: boolean}> = ({duration, hasImg}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(duration);
	const zoom = interpolate(frame, [0, duration], [1.0, 1.09], {extrapolateRight: 'clamp'});
	const panX = interpolate(frame, [0, duration], [0, -24], {extrapolateRight: 'clamp'});
	const tagIn = spring({frame: frame - 8, fps, config: {damping: 18}});

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
			{hasImg ? (
				<Img
					src={staticFile('docu/nyse.jpg')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${zoom}) translateX(${panX}px)`,
						filter: 'grayscale(55%) contrast(1.22) brightness(0.46)',
					}}
				/>
			) : (
				<AbsoluteFill
					style={{
						background:
							'radial-gradient(circle at 60% 40%, #172033 0%, #070a11 72%)',
					}}
				/>
			)}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(6,8,13,0.45) 0%, rgba(6,8,13,0.18) 45%, rgba(6,8,13,0.92) 100%)',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					left: 110,
					bottom: 130,
					opacity: tagIn,
					transform: `translateY(${interpolate(tagIn, [0, 1], [18, 0])}px)`,
				}}
			>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 22,
						letterSpacing: 4,
						color: '#94a3b8',
						marginBottom: 14,
						display: 'flex',
						alignItems: 'center',
						gap: 14,
					}}
				>
					<span style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block'}} />
					<span>AUGUST 1, 2012  •  09:30:00 AM EDT</span>
				</div>
				<div
					style={{
						fontFamily: SANS,
						fontSize: 72,
						fontWeight: 800,
						color: '#f8fafc',
						letterSpacing: -1.5,
						lineHeight: 1.05,
						textShadow: '0 8px 32px rgba(0,0,0,0.9)',
					}}
				>
					NEW YORK STOCK EXCHANGE
				</div>
				<div
					style={{
						width: 120,
						height: 4,
						backgroundColor: '#ef4444',
						marginTop: 20,
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// Scene 2: Full-bleed trading floor + editorial 17% retail market maker scale reveal.
const Scene2Scale: React.FC<{duration: number; hasImg: boolean}> = ({duration, hasImg}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(duration);
	const zoom = interpolate(frame, [0, duration], [1.06, 1.0], {extrapolateRight: 'clamp'});
	const statIn = spring({frame: frame - 4, fps, config: {damping: 16}});

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
			{hasImg ? (
				<Img
					src={staticFile('docu/trading_floor.jpg')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${zoom})`,
						filter: 'grayscale(45%) contrast(1.25) brightness(0.32)',
					}}
				/>
			) : null}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(90deg, rgba(6,8,13,0.94) 0%, rgba(6,8,13,0.72) 55%, rgba(6,8,13,0.4) 100%)',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					left: 120,
					top: 250,
					opacity: statIn,
					transform: `translateY(${interpolate(statIn, [0, 1], [24, 0])}px)`,
				}}
			>
				<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: '#38bdf8', marginBottom: 16}}>
					KNIGHT CAPITAL GROUP  •  NYSE MARKET MAKER
				</div>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 36}}>
					<span
						style={{
							fontFamily: SANS,
							fontSize: 210,
							fontWeight: 900,
							color: '#ffffff',
							lineHeight: 0.9,
							letterSpacing: -6,
						}}
					>
						17%
					</span>
					<div style={{maxWidth: 680}}>
						<div style={{fontFamily: SANS, fontSize: 44, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.15}}>
							OF ALL U.S. RETAIL STOCK VOLUME
						</div>
						<div style={{fontFamily: MONO, fontSize: 24, color: '#94a3b8', marginTop: 18}}>
							3.3 BILLION SHARES TRADED DAILY  •  1.8% OF TOTAL U.S. EQUITIES
						</div>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Scene 3: Real-time capital bleed (-$10M / min) with faint scrolling order-book telemetry behind it.
const ORDER_ROWS = [
	'09:30:02.114  SMARS-08  BUY  4,200 AAPL @ 608.45  [FILLED]',
	'09:30:02.142  SMARS-08  SELL 4,200 AAPL @ 607.12  [LOSS -$5,586]',
	'09:30:02.169  SMARS-08  BUY  9,800 MSFT @  29.88  [FILLED]',
	'09:30:02.195  SMARS-08  SELL 9,800 MSFT @  29.41  [LOSS -$4,606]',
	'09:30:02.228  SMARS-08  BUY  6,500 GE   @  20.94  [FILLED]',
	'09:30:02.251  SMARS-08  SELL 6,500 GE   @  20.52  [LOSS -$2,730]',
];

const Scene3Bleed: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(duration);
	const lossM = interpolate(frame, [0, Math.max(20, duration - 15)], [0.4, 10.0], {extrapolateRight: 'clamp'});
	const scrollY = (frame * 2.2) % 240;

	return (
		<AbsoluteFill style={{backgroundColor: '#07080d', opacity}}>
			{/* Faint scrolling order-book background texture */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					overflow: 'hidden',
					opacity: 0.14,
					fontFamily: MONO,
					fontSize: 22,
					lineHeight: 2.1,
					color: '#ef4444',
					padding: '0 80px',
					transform: `translateY(-${scrollY}px)`,
				}}
			>
				{Array.from({length: 24}, (_, i) => (
					<div key={i}>{ORDER_ROWS[i % ORDER_ROWS.length]}</div>
				))}
			</div>

			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at center, rgba(127, 29, 29, 0.24) 0%, rgba(6,8,13,0.92) 72%)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: '#fca5a5', marginBottom: 18}}>
					REAL-TIME CAPITAL BURN RATE
				</div>
				<div
					style={{
						fontFamily: SANS,
						fontSize: 168,
						fontWeight: 900,
						color: '#ff3b30',
						letterSpacing: -4,
						lineHeight: 1,
						textShadow: '0 0 60px rgba(255, 59, 48, 0.45)',
					}}
				>
					-${lossM.toFixed(1)}M / MIN
				</div>
				<div style={{fontFamily: MONO, fontSize: 28, color: '#e2e8f0', marginTop: 26, letterSpacing: 2}}>
					-$163,000 VANISHING EVERY SINGLE SECOND
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Scene 4: Full-screen 45-minute loss trajectory chart (1600x720 wide editorial SVG).
const CHART_PTS = [
	{x: '09:30', y: 0, label: '$0'},
	{x: '09:38', y: -80, label: '-$80M'},
	{x: '09:50', y: -180, label: '-$180M'},
	{x: '09:58', y: -220, label: '8X ROLLBACK', alert: true},
	{x: '10:15', y: -440, label: '-$440M', alert: true},
];

const Scene4Chart: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(duration);
	const reveal = Math.min(1, frame / Math.max(25, duration * 0.68));
	const pulse = (Math.sin(frame / 4) + 1) / 2;

	const left = 130;
	const right = 1470;
	const top = 110;
	const bottom = 580;
	const w = right - left;
	const h = bottom - top;
	const minY = -440;
	const maxY = 0;

	const coords = CHART_PTS.map((p, i) => ({
		...p,
		px: left + (i / (CHART_PTS.length - 1)) * w,
		py: top + ((maxY - p.y) / (maxY - minY)) * h,
	}));
	const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(' ');
	const areaPath = `${linePath} L ${coords[coords.length - 1].px.toFixed(1)} ${bottom} L ${coords[0].px.toFixed(1)} ${bottom} Z`;
	const dashTotal = 2200;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#06080d',
				opacity,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div style={{width: 1600, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
				<div>
					<span style={{fontFamily: MONO, fontSize: 18, color: '#ef4444', letterSpacing: 3, display: 'block', marginBottom: 6}}>
						CUMULATIVE PRE-TAX LOSS  •  AUGUST 1, 2012
					</span>
					<span style={{fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc', letterSpacing: -1}}>
						45 MINUTES TO INSOLVENCY
					</span>
				</div>
				<span style={{fontFamily: MONO, fontSize: 44, fontWeight: 800, color: '#ff3b30'}}>-$440,000,000</span>
			</div>

			<svg viewBox="0 0 1600 680" width={1600} height={680}>
				<defs>
					<pattern id="docuChartGrid" width="80" height="80" patternUnits="userSpaceOnUse">
						<path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
					</pattern>
					<linearGradient id="docuLossFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ef4444" stopOpacity="0.42" />
						<stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
					</linearGradient>
					<clipPath id="docuChartClip">
						<rect x={left} y={0} width={w * reveal} height={680} />
					</clipPath>
				</defs>

				<rect width="1600" height="680" rx="14" fill="#0b101b" stroke="#1e293b" strokeWidth="2" />
				<rect width="1600" height="680" rx="14" fill="url(#docuChartGrid)" />

				<line x1={left} y1={top} x2={left} y2={bottom} stroke="#334155" strokeWidth="2" />
				<line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#334155" strokeWidth="2" />
				<text x={left - 18} y={top + 8} fill="#94a3b8" fontSize="18" fontFamily={MONO} textAnchor="end">
					$0
				</text>
				<text x={left - 18} y={bottom} fill="#f87171" fontSize="18" fontFamily={MONO} textAnchor="end">
					-$440M
				</text>

				<path d={areaPath} fill="url(#docuLossFill)" clipPath="url(#docuChartClip)" />
				<path
					d={linePath}
					fill="none"
					stroke="#ff3b30"
					strokeWidth="6"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={dashTotal}
					strokeDashoffset={dashTotal * (1 - reveal)}
				/>

				{coords.map((c, i) => {
					if (reveal < (i / (coords.length - 1)) * 0.85) return null;
					const labelY = c.py > bottom - 55 ? c.py - 26 : c.py + 38;
					return (
						<g key={i}>
							{c.alert && <circle cx={c.px} cy={c.py} r={16 + 7 * pulse} fill="rgba(255,59,48,0.25)" />}
							<circle cx={c.px} cy={c.py} r={c.alert ? 10 : 7} fill={c.alert ? '#ff3b30' : '#f8fafc'} stroke="#0b101b" strokeWidth="3" />
							<text x={c.px} y={bottom + 42} fill="#cbd5e1" fontSize="20" fontFamily={MONO} textAnchor="middle">
								{c.x}
							</text>
							<text
								x={c.px}
								y={labelY}
								fill={c.alert ? '#fca5a5' : '#f8fafc'}
								fontSize="22"
								fontWeight="bold"
								fontFamily={SANS}
								textAnchor="middle"
							>
								{c.label}
							</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// Scene 5: Dead silence + beat-by-beat minimalist twist typography.
const Scene5SilenceTwist: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(duration);
	const t1 = Math.min(1, frame / 10);
	const t2 = Math.min(1, Math.max(0, (frame - Math.floor(duration * 0.3)) / 10));
	const t3 = Math.min(1, Math.max(0, (frame - Math.floor(duration * 0.62)) / 12));

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#050609',
				opacity,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 28,
			}}
		>
			<div style={{fontFamily: SANS, fontSize: 64, fontWeight: 700, color: '#94a3b8', opacity: t1}}>
				NO HACKER.
			</div>
			<div style={{fontFamily: SANS, fontSize: 64, fontWeight: 700, color: '#94a3b8', opacity: t2}}>
				NO MARKET CRASH.
			</div>
			<div
				style={{
					fontFamily: SANS,
					fontSize: 92,
					fontWeight: 900,
					color: '#ff3b30',
					letterSpacing: -2,
					opacity: t3,
					transform: `scale(${0.94 + 0.06 * t3})`,
					marginTop: 12,
				}}
			>
				ONE SKIPPED SERVER.
			</div>
		</AbsoluteFill>
	);
};

// Scene 6: Full-screen Live Deployment Terminal + 8-Server Status Grid over dark server-room backdrop.
const TERMINAL_LINES = [
	'$ deploy-smars --release rlp-2012-08 --manual',
	'[OK]  srv-01.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-02.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-03.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-04.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-05.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-06.smars.prod  binary updated (checksum verified)',
	'[OK]  srv-07.smars.prod  binary updated (checksum verified)',
	'[ERR] srv-08.smars.prod  SKIPPED — 2003 POWER PEG CODE STILL ACTIVE',
];

const Scene6Terminal: React.FC<{duration: number; hasImg: boolean}> = ({duration, hasImg}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(duration);
	const pulse = (Math.sin(frame / 3.5) + 1) / 2;
	const visibleLines = Math.min(
		TERMINAL_LINES.length,
		1 + Math.floor((frame / Math.max(15, duration * 0.7)) * TERMINAL_LINES.length)
	);

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
			{hasImg ? (
				<Img
					src={staticFile('docu/server_rack.jpg')}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'grayscale(60%) contrast(1.2) brightness(0.18)',
					}}
				/>
			) : null}

			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 48,
					padding: '0 100px',
				}}
			>
				{/* Left: Realistic Terminal Window */}
				<div
					style={{
						width: 940,
						backgroundColor: 'rgba(10, 14, 23, 0.96)',
						border: '1.5px solid #334155',
						borderRadius: 12,
						boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							backgroundColor: '#111827',
							padding: '14px 20px',
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							borderBottom: '1px solid #1f2937',
						}}
					>
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444'}} />
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b'}} />
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e'}} />
						<span style={{fontFamily: MONO, fontSize: 16, color: '#94a3b8', marginLeft: 12}}>
							ops@jersey-city-dc: ~/smars-deploy
						</span>
					</div>
					<div style={{padding: '28px 30px', fontFamily: MONO, fontSize: 20, lineHeight: 1.85}}>
						{TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
							const isErr = line.startsWith('[ERR]');
							const isCmd = line.startsWith('$');
							return (
								<div
									key={i}
									style={{
										color: isErr ? '#ff453a' : isCmd ? '#38bdf8' : '#86efac',
										fontWeight: isErr ? 700 : 400,
										backgroundColor: isErr ? 'rgba(255, 59, 48, 0.14)' : 'transparent',
										padding: isErr ? '4px 8px' : '0 8px',
										borderRadius: 4,
									}}
								>
									{line}
								</div>
							);
						})}
					</div>
				</div>

				{/* Right: 8-Server Production Cluster Grid */}
				<div style={{width: 680}}>
					<div style={{fontFamily: MONO, fontSize: 18, color: '#94a3b8', letterSpacing: 3, marginBottom: 18}}>
						SMARS PRODUCTION CLUSTER (7 / 8 UPDATED)
					</div>
					<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
						{Array.from({length: 8}, (_, i) => {
							const isFail = i === 7;
							return (
								<div
									key={i}
									style={{
										backgroundColor: isFail ? 'rgba(45, 14, 18, 0.95)' : 'rgba(15, 23, 42, 0.92)',
										border: `2px solid ${isFail ? '#ff3b30' : '#1e293b'}`,
										borderRadius: 10,
										padding: '18px 22px',
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										boxShadow: isFail ? `0 0 ${16 + 14 * pulse}px rgba(255, 59, 48, 0.45)` : 'none',
									}}
								>
									<div>
										<div style={{fontFamily: SANS, fontSize: 24, fontWeight: 800, color: '#f8fafc'}}>
											SRV-0{i + 1}
										</div>
										<div style={{fontFamily: MONO, fontSize: 14, color: isFail ? '#fca5a5' : '#64748b', marginTop: 4}}>
											{isFail ? '2003 POWER PEG' : '2012 RLP BINARY'}
										</div>
									</div>
									<span
										style={{
											width: 14,
											height: 14,
											borderRadius: '50%',
											backgroundColor: isFail ? '#ff3b30' : '#4ade80',
											opacity: isFail ? 0.4 + 0.6 * pulse : 1,
										}}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Scene 7: Full-screen Living SEC Document + Animated Highlighter -> Closing Title Card.
const Scene7DocAndTitle: React.FC<{duration: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(duration);
	const splitFrame = Math.floor(duration * 0.58);
	const inTitle = frame >= splitFrame;

	const cardScale = interpolate(frame, [0, splitFrame], [1.0, 1.035], {extrapolateRight: 'clamp'});
	const sweep = interpolate(frame, [14, 34], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const titleIn = spring({frame: frame - splitFrame, fps, config: {damping: 18}});

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
			{!inTitle ? (
				<AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Sequence from={14} layout="none">
						<Audio src={staticFile('sfx/scribble.wav')} volume={0.18} />
					</Sequence>
					<div
						style={{
							width: 1220,
							backgroundColor: '#f4efe2',
							borderRadius: 10,
							padding: '54px 66px',
							boxShadow: '0 32px 80px rgba(0,0,0,0.88)',
							transform: `scale(${cardScale})`,
							position: 'relative',
						}}
					>
						<div
							style={{
								fontFamily: MONO,
								fontSize: 20,
								fontWeight: 700,
								color: '#475569',
								letterSpacing: 2,
								borderBottom: '3px solid #1e293b',
								paddingBottom: 16,
								marginBottom: 28,
							}}
						>
							U.S. SECURITIES AND EXCHANGE COMMISSION  •  RELEASE NO. 70694
						</div>
						<div
							style={{
								position: 'absolute',
								top: 42,
								right: 54,
								border: '4px solid #b91c1c',
								color: '#b91c1c',
								fontFamily: SANS,
								fontSize: 22,
								fontWeight: 900,
								padding: '6px 16px',
								transform: 'rotate(-5deg)',
								letterSpacing: 2,
							}}
						>
							OFFICIAL ORDER
						</div>
						<div style={{fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: '#0f172a', marginBottom: 22}}>
							Knight Capital Americas LLC — Administrative Proceedings
						</div>
						<div style={{fontFamily: SERIF, fontSize: 34, lineHeight: 1.55, color: '#1e293b'}}>
							“On August 1, 2012, Knight’s automated router experienced a severe malfunction, resulting in a{' '}
							<span
								style={{
									backgroundImage: 'linear-gradient(90deg, rgba(250, 204, 21, 0.78) 0%, rgba(250, 204, 21, 0.78) 100%)',
									backgroundRepeat: 'no-repeat',
									backgroundSize: `${sweep}% 90%`,
									backgroundPosition: '0 60%',
									padding: '2px 6px',
									fontWeight: 700,
									color: '#090d16',
								}}
							>
								pre-tax loss of more than $440 million
							</span>{' '}
							in approximately 45 minutes.”
						</div>
					</div>
				</AbsoluteFill>
			) : (
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: titleIn,
						transform: `scale(${0.96 + 0.04 * titleIn})`,
					}}
				>
					<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: '#ef4444', marginBottom: 20}}>
						SYSTEM POSTMORTEM  •  AUGUST 1, 2012
					</div>
					<div style={{fontFamily: SANS, fontSize: 96, fontWeight: 900, color: '#ffffff', letterSpacing: -2}}>
						THE 45-MINUTE MELTDOWN
					</div>
					<div style={{fontFamily: MONO, fontSize: 24, color: '#94a3b8', marginTop: 22, letterSpacing: 3}}>
						KNIGHT CAPITAL GROUP
					</div>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

export const DocuPrototype: React.FC<DocuPrototypeProps> = ({
	audio,
	durationInFrames,
	beats,
	hasNyseImg,
	hasFloorImg,
	hasServerImg,
}) => {
	const b = beats.length >= 8 ? beats : [0, 120, 320, 560, 820, 1060, 1260, 1460];
	const d = (i: number) => (i < 7 ? Math.max(30, b[i + 1] - b[i] + FADE_FRAMES) : Math.max(45, durationInFrames - b[7]));

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d'}}>
			{/* Continuous uninterrupted narration */}
			{audio ? <Audio src={staticFile(audio)} /> : null}

			{/* Immediate tense score from frame 0, cuts to dead silence on Scene 5 twist, swells back on Scene 6-7 */}
			<Sequence from={0} durationInFrames={Math.max(1, b[5])}>
				<Audio src={staticFile('music/tense.mp3')} volume={0.15} />
			</Sequence>
			<Sequence from={b[6]} durationInFrames={Math.max(1, durationInFrames - b[6])}>
				<Audio src={staticFile('music/tense.mp3')} volume={0.16} />
			</Sequence>

			{/* Subtle transition & silence drop accents */}
			<Sequence from={b[3]} layout="none">
				<Audio src={staticFile('sfx/whoosh.wav')} volume={0.14} />
			</Sequence>
			<Sequence from={b[5]} layout="none">
				<Audio src={staticFile('sfx/thud.wav')} volume={0.22} />
			</Sequence>

			<Sequence from={b[0]} durationInFrames={Math.max(30, b[1] - b[0])}>
				<Scene0Hook3s duration={Math.max(30, b[1] - b[0])} hasNyseImg={hasNyseImg} />
			</Sequence>
			<Sequence from={b[1]} durationInFrames={d(1)}>
				<Scene1Opener duration={d(1)} hasImg={hasNyseImg} />
			</Sequence>
			<Sequence from={b[2]} durationInFrames={d(2)}>
				<Scene2Scale duration={d(2)} hasImg={hasFloorImg} />
			</Sequence>
			<Sequence from={b[3]} durationInFrames={d(3)}>
				<Scene3Bleed duration={d(3)} />
			</Sequence>
			<Sequence from={b[4]} durationInFrames={d(4)}>
				<Scene4Chart duration={d(4)} />
			</Sequence>
			<Sequence from={b[5]} durationInFrames={d(5)}>
				<Scene5SilenceTwist duration={d(5)} />
			</Sequence>
			<Sequence from={b[6]} durationInFrames={d(6)}>
				<Scene6Terminal duration={d(6)} hasImg={hasServerImg} />
			</Sequence>
			<Sequence from={b[7]} durationInFrames={d(7)}>
				<Scene7DocAndTitle duration={d(7)} />
			</Sequence>

			<DocumentaryPolish />
		</AbsoluteFill>
	);
};
