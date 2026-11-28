import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

export type CameraPreset = 'wide' | 'push_in' | 'pull_out' | 'crop_left' | 'crop_right' | 'crop_detail';

export type DocuMedia = {
	type: 'video' | 'image';
	src: string;
	startSec?: number;
	credit?: string;
	cameraPreset?: CameraPreset;
};

export type DocuGlossary = {
	term: string;
	definition: string;
};

export type DocuServer = {
	label: string;
	sub: string;
	status: 'ok' | 'warn' | 'fail';
};

export type DocuChartPoint = {
	x: string;
	y: number;
	label?: string;
	alert?: boolean;
};

export type DocuSwissLayer = {
	title: string;
	sub: string;
};

export type DocuCompareColumn = {
	tag: string;
	title: string;
	steps: string[];
	verdict: string;
	status: 'ok' | 'fail';
};

export type DocuFlowNode = {
	id: string;
	label: string;
	sub: string;
	x: number;
	y: number;
	role?: 'source' | 'ok' | 'fail' | 'target';
};

export type DocuFlowEdge = {
	from: string;
	to: string;
	label?: string;
	bad?: boolean;
};

export type DocuTimelineEvent = {
	time: string;
	title: string;
	detail: string;
	severity?: 'info' | 'warn' | 'critical';
};

export type DocuScene = {
	kind:
	| 'hook_3s'
	| 'media_hero'
	| 'big_stat'
	| 'terminal'
	| 'loss_chart'
	| 'silence_twist'
	| 'document'
	| 'swiss_cheese'
	| 'expected_vs_reality'
	| 'flow_sim'
	| 'timeline_zoom'
	| 'editorial_vox'
	| 'archive_lemmino'
	| 'parallax_noir'
	| 'title_card';
	from: number;
	duration: number;
	mood?: 'tense' | 'mystery' | 'sad' | 'silence';
	media?: DocuMedia;
	mediaList?: DocuMedia[];
	eyebrow?: string;
	headline?: string;
	subline?: string;
	stat?: string;
	lines?: string[];
	servers?: DocuServer[];
	points?: DocuChartPoint[];
	unit?: string;
	source?: string;
	date?: string;
	excerpt?: string;
	highlight?: string;
	highlightColor?: 'yellow' | 'red';
	stamp?: string;
	layers?: DocuSwissLayer[];
	left?: DocuCompareColumn;
	right?: DocuCompareColumn;
	flowNodes?: DocuFlowNode[];
	flowEdges?: DocuFlowEdge[];
	counterLabel?: string;
	counterMax?: number;
	timelineEvents?: DocuTimelineEvent[];
	sfx?: string;
	cueWord?: string;
	cueFrame?: number;
	cutFrames?: number[];
	beats?: number[];
	glossary?: DocuGlossary;
	overlayMap?: 'nyse_link' | 'smars_nodes';
	voxMode?: 'single_8' | 'all_8';
};

export type DocuManifest = {
	title: string;
	fps: number;
	durationInFrames: number;
	audio: string;
	scenes: DocuScene[];
};

const SANS = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace";
const SERIF = "'Georgia', 'Times New Roman', serif";
const FADE_FRAMES = 10;

const useFadeEnvelope = (duration: number, skipFadeIn = false) => {
	const frame = useCurrentFrame();
	const fadeIn = skipFadeIn
		? 1
		: interpolate(frame, [0, FADE_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [Math.max(0, duration - FADE_FRAMES), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

// Mood-reactive atmosphere + subtle volumetric light + 2.35:1 cinema letterbox.
const DocumentaryPolish: React.FC<{ activeMood?: 'tense' | 'mystery' | 'sad' | 'silence' }> = ({
	activeMood = 'mystery',
}) => {
	const frame = useCurrentFrame();
	const pulse = (Math.sin(frame / 10) + 1) / 2;

	const vignetteAlpha =
		activeMood === 'silence' ? 0.72 : activeMood === 'sad' ? 0.40 : activeMood === 'tense' ? 0.36 : 0.32;

	return (
		<AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40 }}>
			{activeMood === 'mystery' && (
				<AbsoluteFill
					style={{
						background:
							'linear-gradient(125deg, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0.02) 28%, transparent 52%)',
					}}
				/>
			)}
			{activeMood === 'tense' && (
				<AbsoluteFill
					style={{
						boxShadow: `inset 0 0 110px rgba(239, 68, 68, ${(0.10 + 0.08 * pulse).toFixed(3)})`,
					}}
				/>
			)}
			{activeMood === 'sad' && (
				<AbsoluteFill
					style={{
						backgroundColor: 'rgba(15, 23, 42, 0.14)',
					}}
				/>
			)}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse at center, transparent ${activeMood === 'silence' ? '42%' : '64%'}, rgba(3, 5, 10, ${vignetteAlpha}) 100%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					opacity: 0.025,
					backgroundImage:
						'repeating-radial-gradient(circle at 17% 32%, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px), repeating-radial-gradient(circle at 83% 68%, rgba(255,255,255,0.45) 0 1px, transparent 1px 4px)',
				}}
			/>
			<div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, backgroundColor: '#040508' }} />
			<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, backgroundColor: '#040508' }} />
		</AbsoluteFill>
	);
};

// Floating luminous dust/data particles behind dark graphic scenes for depth.
const PARTICLE_SEEDS = Array.from({ length: 18 }, (_, i) => ({
	x: (i * 197 + 80) % 1840 + 40,
	y: (i * 131 + 120) % 860 + 100,
	r: 1.5 + (i % 3) * 0.9,
	vx: ((i % 5) - 2) * 0.28,
	vy: -0.22 - (i % 4) * 0.12,
	phase: i * 0.7,
}));

const AmbientParticles: React.FC<{ accent?: string }> = ({ accent = '#38bdf8' }) => {
	const frame = useCurrentFrame();
	return (
		<svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.28 }}>
			{PARTICLE_SEEDS.map((p, i) => {
				const cx = ((p.x + frame * p.vx) % 1920 + 1920) % 1920;
				const cy = ((p.y + frame * p.vy) % 1080 + 1080) % 1080;
				const alpha = 0.25 + 0.55 * ((Math.sin(frame / 18 + p.phase) + 1) / 2);
				return <circle key={i} cx={cx} cy={cy} r={p.r} fill={accent} opacity={alpha} />;
			})}
		</svg>
	);
};

// Contextual Glossary Card (top-right, auto-fades out after ~4.8s).
const GlossaryCard: React.FC<{ glossary?: DocuGlossary; duration: number }> = ({ glossary, duration }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	if (!glossary) return null;

	const pop = spring({ frame: frame - 10, fps, config: { damping: 18 } });
	const fadeOut = interpolate(frame, [Math.min(duration - 16, 130), Math.min(duration, 148)], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const opacity = pop * fadeOut;

	return (
		<div
			style={{
				position: 'absolute',
				top: 66,
				right: 54,
				maxWidth: 680,
				backgroundColor: 'rgba(6, 10, 18, 0.84)',
				backdropFilter: 'blur(8px)',
				borderLeft: '3px solid #38bdf8',
				borderRadius: '0 8px 8px 0',
				padding: '16px 24px',
				opacity,
				transform: `translateX(${interpolate(pop, [0, 1], [18, 0])}px)`,
				zIndex: 25,
				pointerEvents: 'none',
			}}
		>
			<div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, letterSpacing: 2, color: '#38bdf8', marginBottom: 6 }}>
				TERM  •  {glossary.term}
			</div>
			<div style={{ fontFamily: SANS, fontSize: 24, lineHeight: 1.38, color: '#e2e8f0' }}>
				{glossary.definition}
			</div>
		</div>
	);
};

// Double-Exposure Transparent Schematic Overlays (`nyse_link` | `smars_nodes`)
const DoubleExposureOverlay: React.FC<{ kind?: 'nyse_link' | 'smars_nodes' }> = ({ kind }) => {
	const frame = useCurrentFrame();
	if (!kind) return null;
	const dashOffset = -(frame * 3.5) % 60;
	const pulse = (Math.sin(frame / 6) + 1) / 2;

	if (kind === 'nyse_link') {
		return (
			<svg
				viewBox="0 0 1920 1080"
				width="100%"
				height="100%"
				style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.65, zIndex: 8 }}
			>
				<path
					d="M 420 340 Q 960 210 1500 340"
					fill="none"
					stroke="#38bdf8"
					strokeWidth="3"
					strokeDasharray="10 10"
					strokeDashoffset={dashOffset}
				/>
				<circle cx="420" cy="340" r="10" fill="#38bdf8" />
				<circle cx="420" cy="340" r={18 + 8 * pulse} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.55" />
				<rect x="220" y="366" width="400" height="78" rx="6" fill="rgba(6, 10, 18, 0.78)" stroke="#38bdf8" strokeWidth="1.5" />
				<text x="420" y="398" fill="#38bdf8" fontSize="21" fontFamily={MONO} textAnchor="middle" fontWeight="bold">
					JERSEY CITY DC
				</text>
				<text x="420" y="428" fill="#e2e8f0" fontSize="19" fontFamily={MONO} textAnchor="middle">
					KNIGHT SMARS ROUTER
				</text>

				<circle cx="1500" cy="340" r="10" fill="#ef4444" />
				<circle cx="1500" cy="340" r={18 + 8 * pulse} fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.55" />
				<rect x="1300" y="366" width="400" height="78" rx="6" fill="rgba(6, 10, 18, 0.78)" stroke="#ef4444" strokeWidth="1.5" />
				<text x="1500" y="398" fill="#fca5a5" fontSize="21" fontFamily={MONO} textAnchor="middle" fontWeight="bold">
					WALL STREET, NY
				</text>
				<text x="1500" y="428" fill="#e2e8f0" fontSize="19" fontFamily={MONO} textAnchor="middle">
					NYSE  •  17% RETAIL FLOW
				</text>
			</svg>
		);
	}

	return (
		<svg
			viewBox="0 0 1920 1080"
			width="100%"
			height="100%"
			style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.62, zIndex: 8 }}
		>
			{Array.from({ length: 8 }, (_, i) => {
				const col = i % 4;
				const row = Math.floor(i / 4);
				const x = 1020 + col * 204;
				const y = 290 + row * 130;
				const isEight = i === 7;
				return (
					<g key={i} transform={`translate(${x}, ${y})`}>
						<rect
							width="180"
							height="104"
							rx="8"
							fill="rgba(6, 10, 18, 0.88)"
							stroke={isEight ? '#f59e0b' : '#38bdf8'}
							strokeWidth={isEight ? 2.5 : 1.5}
						/>
						<text x="90" y="48" fill="#ffffff" fontSize="26" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
							SRV-0{i + 1}
						</text>
						<text x="90" y="80" fill={isEight ? '#fbbf24' : '#38bdf8'} fontSize="18" fontFamily={MONO} textAnchor="middle">
							{isEight ? 'NODE #8' : 'ONLINE'}
						</text>
					</g>
				);
			})}
		</svg>
	);
};

const SingleMediaShot: React.FC<{
	media: DocuMedia;
	duration: number;
	shotIndex: number;
	brightness: number;
	grayscale: number;
	fadeInFrames: number;
	hideCredit?: boolean;
}> = ({ media, duration, shotIndex, brightness, grayscale, fadeInFrames, hideCredit }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const dur = Math.max(30, duration);
	const preset: CameraPreset = media.cameraPreset ?? (shotIndex % 2 === 0 ? 'push_in' : 'pull_out');

	let zoom = 1.0;
	let panX = 0;
	let origin = 'center center';
	if (preset === 'wide') {
		zoom = interpolate(frame, [0, dur], [1.0, 1.04], { extrapolateRight: 'clamp' });
	} else if (preset === 'push_in') {
		zoom = interpolate(frame, [0, dur], [1.0, 1.11], { extrapolateRight: 'clamp' });
	} else if (preset === 'pull_out') {
		zoom = interpolate(frame, [0, dur], [1.11, 1.0], { extrapolateRight: 'clamp' });
	} else if (preset === 'crop_left') {
		zoom = interpolate(frame, [0, dur], [1.18, 1.24], { extrapolateRight: 'clamp' });
		origin = '22% 45%';
	} else if (preset === 'crop_right') {
		zoom = interpolate(frame, [0, dur], [1.18, 1.24], { extrapolateRight: 'clamp' });
		origin = '78% 45%';
		panX = interpolate(frame, [0, dur], [-8, 8], { extrapolateRight: 'clamp' });
	} else if (preset === 'crop_detail') {
		zoom = interpolate(frame, [0, dur], [1.26, 1.36], { extrapolateRight: 'clamp' });
		origin = '52% 42%';
	}

	const fadeIn =
		fadeInFrames > 0
			? interpolate(frame, [0, fadeInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
			: 1;
	const filter = `grayscale(${grayscale}%) contrast(1.06) brightness(${brightness})`;

	return (
		<AbsoluteFill style={{ opacity: fadeIn }}>
			{media.type === 'video' ? (
				<OffthreadVideo
					src={staticFile(media.src)}
					startFrom={Math.round((media.startSec ?? 0) * fps)}
					muted
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter,
					}}
				/>
			) : (
				<Img
					src={staticFile(media.src)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transformOrigin: origin,
						transform: `scale(${zoom}) translateX(${panX}px)`,
						filter,
					}}
				/>
			)}
			{media.credit && !hideCredit ? (
				<div
					style={{
						position: 'absolute',
						top: 66,
						right: 54,
						fontFamily: MONO,
						fontSize: 19,
						letterSpacing: 2,
						color: 'rgba(226, 232, 240, 0.75)',
						backgroundColor: 'rgba(6, 8, 13, 0.7)',
						padding: '7px 16px',
						borderRadius: 4,
						border: '1px solid rgba(148, 163, 184, 0.25)',
						zIndex: 12,
					}}
				>
					{media.credit}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

const MediaBackdrop: React.FC<{
	media?: DocuMedia;
	mediaList?: DocuMedia[];
	duration: number;
	brightness?: number;
	grayscale?: number;
	hideCredit?: boolean;
}> = ({ media, mediaList, duration, brightness = 0.92, grayscale = 8, hideCredit }) => {
	const shots = mediaList && mediaList.length > 0 ? mediaList : media?.src ? [media] : [];
	if (shots.length === 0) return null;

	if (shots.length === 1) {
		return (
			<SingleMediaShot
				media={shots[0]}
				duration={duration}
				shotIndex={0}
				brightness={brightness}
				grayscale={grayscale}
				fadeInFrames={0}
				hideCredit={hideCredit}
			/>
		);
	}

	const slot = Math.max(30, Math.floor(duration / shots.length));
	return (
		<>
			{shots.map((shot, i) => {
				const from = i * slot;
				const len = i === shots.length - 1 ? Math.max(30, duration - from) : slot + 8;
				return (
					<Sequence key={i} from={from} durationInFrames={len}>
						<SingleMediaShot
							media={shot}
							duration={len}
							shotIndex={i}
							brightness={brightness}
							grayscale={grayscale}
							fadeInFrames={i > 0 ? 8 : 0}
							hideCredit={hideCredit}
						/>
					</Sequence>
				);
			})}
		</>
	);
};

// 1. 3-second Smash-Cut Cold Hook (zero fade-in at frame 0)
const HOOK_LOGS = [
	'[FATAL] srv-08.smars.prod  POWER_PEG_ACTIVE  stop_limit=NULL',
	'[ALERT] 09:30:01  40 child orders/sec  ->  NYSE RLP loop',
	'[LOSS]  -$163,000 / SEC  |  154 TICKERS SWINGING WILDLY',
	'[WARN]  NO KILL SWITCH FOUND IN SMARS RUNBOOK',
];

const SceneHook3s: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration, true);

	const cut1End = scene.cutFrames?.[0] ?? Math.floor(scene.duration * 0.44);
	const cut2End = scene.cutFrames?.[1] ?? Math.floor(scene.duration * 0.74);
	const punchFrame = scene.cueFrame ?? Math.floor(cut1End * 0.52);
	const cut = frame < cut1End ? 0 : frame < cut2End ? 1 : 2;

	const localF = cut === 0 ? frame : cut === 1 ? frame - cut1End : frame - cut2End;
	const shakeAmp = Math.max(0, 5 - localF * 0.6);
	const shakeX = Math.sin(localF * 2.7) * shakeAmp;
	const shakeY = Math.cos(localF * 3.3) * shakeAmp;
	const burnDollar = Math.round(
		interpolate(frame, [0, Math.max(15, punchFrame - 4)], [163000, 440000000], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		})
	);
	const punchSpring = spring({
		frame: Math.max(0, frame - punchFrame),
		fps,
		config: { damping: 14 },
	});
	const showPunch = frame >= punchFrame;
	const cut2Scale = interpolate(localF, [0, 25], [1.06, 1.0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{ backgroundColor: '#050609', opacity, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
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
					<div style={{ fontFamily: MONO, fontSize: 42, letterSpacing: 5, color: '#fca5a5', marginBottom: 20 }}>
						{scene.eyebrow || '09:30:01 AM EDT  •  SYSTEM FAILURE DETECTED'}
					</div>
					<div
						style={{
							fontFamily: SANS,
							fontSize: 216,
							fontWeight: 900,
							color: '#ff3b30',
							letterSpacing: -5,
							lineHeight: 1,
							textShadow: '0 0 65px rgba(255, 59, 48, 0.55)',
						}}
					>
						-${burnDollar.toLocaleString()}
					</div>
					<div style={{ marginTop: 28, minHeight: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
						{showPunch ? (
							<div
								style={{
									backgroundColor: '#ff3b30',
									color: '#ffffff',
									fontFamily: SANS,
									fontSize: 56,
									fontWeight: 900,
									letterSpacing: 4,
									padding: '14px 44px',
									borderRadius: 6,
									boxShadow: '0 0 40px rgba(255, 59, 48, 0.5)',
									opacity: punchSpring,
									transform: `scale(${interpolate(punchSpring, [0, 1], [0.86, 1])})`,
								}}
							>
								WIPED OUT IN 45 MINUTES
							</div>
						) : (
							<div style={{ fontFamily: MONO, fontSize: 48, color: '#f8fafc', letterSpacing: 3 }}>
								{scene.subline || '163,000 DOLLARS LOST PER SECOND'}
							</div>
						)}
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
						gap: 30,
					}}
				>
					<div
						style={{
							width: 1620,
							backgroundColor: 'rgba(45, 14, 18, 0.96)',
							border: '3px solid #ff3b30',
							borderRadius: 12,
							padding: '38px 50px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							boxShadow: '0 0 50px rgba(255, 59, 48, 0.45)',
						}}
					>
						<div>
							<div style={{ fontFamily: MONO, fontSize: 36, color: '#fca5a5', letterSpacing: 3 }}>
								PRODUCTION ROUTER  •  SMARS NODE 8 / 8
							</div>
							<div style={{ fontFamily: SANS, fontSize: 84, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
								SRV-08: UPDATE SKIPPED
							</div>
						</div>
						<div
							style={{
								backgroundColor: '#ff3b30',
								color: '#ffffff',
								fontFamily: MONO,
								fontSize: 38,
								fontWeight: 800,
								padding: '16px 34px',
								borderRadius: 6,
							}}
						>
							2003 BUG ACTIVE
						</div>
					</div>
					<div
						style={{
							width: 1620,
							backgroundColor: '#0b101b',
							border: '1.5px solid #334155',
							borderRadius: 10,
							padding: '28px 40px',
							fontFamily: MONO,
							fontSize: 36,
							lineHeight: 1.75,
						}}
					>
						{HOOK_LOGS.map((row, idx) => (
							<div
								key={idx}
								style={{
									color: idx === 0 || idx === 3 ? '#ff453a' : '#fbbf24',
									opacity: localF >= idx * 6 ? 1 : 0,
									transform: `translateY(${localF >= idx * 6 ? 0 : 8}px)`,
								}}
							>
								{row}
							</div>
						))}
					</div>
				</AbsoluteFill>
			)}

			{cut === 2 && (
				<AbsoluteFill style={{ backgroundColor: '#06080d' }}>
					<AbsoluteFill style={{ transform: `scale(${cut2Scale})` }}>
						<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.42} grayscale={35} />
					</AbsoluteFill>
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(6,8,13,0.35) 0%, rgba(6,8,13,0.88) 82%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 5, color: '#fca5a5', marginBottom: 22 }}>
							09:30:00 AM EDT  •  WALL STREET OPENING BELL
						</div>
						<div style={{ fontFamily: SANS, fontSize: 124, fontWeight: 900, color: '#ffffff', letterSpacing: -2, lineHeight: 1.05, textAlign: 'center', maxWidth: 1680 }}>
							{scene.headline || 'WIPED OUT IN 45 MINUTES'}
						</div>
						<div
							style={{
								marginTop: 34,
								backgroundColor: '#ff3b30',
								color: '#ffffff',
								fontFamily: MONO,
								fontSize: 48,
								fontWeight: 800,
								padding: '16px 42px',
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

// 2. Full-bleed real video/photo with bright natural framing and compact auto-fading lower-third
const SceneMediaHero: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const tagIn = spring({ frame: frame - 6, fps, config: { damping: 18 } });
	const tagOut = interpolate(frame, [100, 118], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const labelOpacity = tagIn * tagOut;

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d', opacity }}>
			<MediaBackdrop
				media={scene.media}
				mediaList={scene.mediaList}
				duration={scene.duration}
				brightness={0.92}
				grayscale={8}
				hideCredit={Boolean(scene.glossary)}
			/>
			<DoubleExposureOverlay kind={scene.overlayMap} />
			<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
			<AbsoluteFill
				style={{
					background: 'linear-gradient(180deg, transparent 74%, rgba(4, 6, 10, 0.68) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 72,
					bottom: 72,
					maxWidth: 1280,
					backgroundColor: 'rgba(6, 8, 13, 0.62)',
					backdropFilter: 'blur(6px)',
					borderLeft: '4px solid #ef4444',
					borderRadius: '0 8px 8px 0',
					padding: '20px 32px',
					opacity: labelOpacity,
					transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
				}}
			>
				{scene.eyebrow ? (
					<div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 2.5, color: '#cbd5e1', marginBottom: 6 }}>
						{scene.eyebrow}
					</div>
				) : null}
				{scene.headline ? (
					<div style={{ fontFamily: SANS, fontSize: 52, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.5, lineHeight: 1.12 }}>
						{scene.headline}
					</div>
				) : null}
				{scene.subline ? (
					<div style={{ fontFamily: MONO, fontSize: 24, color: '#94a3b8', marginTop: 6 }}>{scene.subline}</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// 3. Editorial Stat: compact bottom-left card when backed by real footage, centered hero when standalone
const SceneBigStat: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const statIn = spring({ frame: frame - 4, fps, config: { damping: 16 } });

	if (scene.media?.src || (scene.mediaList && scene.mediaList.length > 0)) {
		return (
			<AbsoluteFill style={{ backgroundColor: '#06080d', opacity }}>
				<MediaBackdrop
					media={scene.media}
					mediaList={scene.mediaList}
					duration={scene.duration}
					brightness={0.88}
					grayscale={10}
					hideCredit={Boolean(scene.glossary)}
				/>
				<DoubleExposureOverlay kind={scene.overlayMap} />
				<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
				<div
					style={{
						position: 'absolute',
						left: 72,
						bottom: 72,
						maxWidth: 1280,
						backgroundColor: 'rgba(6, 8, 13, 0.78)',
						backdropFilter: 'blur(8px)',
						borderLeft: '4px solid #ef4444',
						borderRadius: '0 10px 10px 0',
						padding: '26px 38px',
						opacity: statIn,
						transform: `translateY(${interpolate(statIn, [0, 1], [16, 0])}px)`,
					}}
				>
					{scene.eyebrow ? (
						<div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 2.5, color: '#38bdf8', marginBottom: 10 }}>
							{scene.eyebrow}
						</div>
					) : null}
					<div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}>
						<span
							style={{
								fontFamily: SANS,
								fontSize: 102,
								fontWeight: 900,
								color: (scene.stat ?? '').startsWith('-') ? '#ff3b30' : '#ffffff',
								lineHeight: 0.95,
								letterSpacing: -2,
								flexShrink: 0,
							}}
						>
							{scene.stat}
						</span>
						<div>
							{scene.headline ? (
								<div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.18 }}>
									{scene.headline}
								</div>
							) : null}
							{scene.subline ? (
								<div style={{ fontFamily: MONO, fontSize: 22, color: '#94a3b8', marginTop: 8 }}>{scene.subline}</div>
							) : null}
						</div>
					</div>
				</div>
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d', opacity }}>
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: 240,
					opacity: statIn,
					transform: `translateY(${interpolate(statIn, [0, 1], [22, 0])}px)`,
				}}
			>
				{scene.eyebrow ? (
					<div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 4, color: '#38bdf8', marginBottom: 20 }}>
						{scene.eyebrow}
					</div>
				) : null}
				<div style={{ display: 'flex', alignItems: 'baseline', gap: 44, flexWrap: 'wrap' }}>
					<span
						style={{
							fontFamily: SANS,
							fontSize: (scene.stat ?? '').length > 6 ? 180 : 240,
							fontWeight: 900,
							color: (scene.stat ?? '').startsWith('-') ? '#ff3b30' : '#ffffff',
							lineHeight: 0.92,
							letterSpacing: -5,
						}}
					>
						{scene.stat}
					</span>
					<div style={{ maxWidth: 1020 }}>
						{scene.headline ? (
							<div style={{ fontFamily: SANS, fontSize: 64, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.14 }}>
								{scene.headline}
							</div>
						) : null}
						{scene.subline ? (
							<div style={{ fontFamily: MONO, fontSize: 36, color: '#94a3b8', marginTop: 20 }}>{scene.subline}</div>
						) : null}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 4. Full-screen Terminal + Optional 8-Server Cluster Grid (word-synced cueFrame for error/alert beat)
const SceneTerminal: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const pulse = (Math.sin(frame / 3.5) + 1) / 2;
	const lines = scene.lines ?? [];
	const servers = scene.servers ?? [];
	const cue = Math.max(15, scene.cueFrame ?? Math.floor(scene.duration * 0.45));

	const isErrLine = (line: string) => line.startsWith('[ERR]') || line.startsWith('[FATAL]');
	const errIdx = lines.findIndex(isErrLine);
	const cueReached = frame >= cue;

	// Reveal normal lines up to cue, then pop the [ERR]/[FATAL] line right at cueFrame!
	let visibleLines = 1;
	if (errIdx > 0) {
		if (!cueReached) {
			visibleLines = Math.min(errIdx, 1 + Math.floor((frame / cue) * errIdx));
		} else {
			const post = Math.max(1, scene.duration - cue);
			visibleLines = Math.min(lines.length, errIdx + 1 + Math.floor(((frame - cue) / post) * (lines.length - errIdx)));
		}
	} else {
		visibleLines = Math.min(lines.length, 1 + Math.floor((frame / Math.max(15, scene.duration * 0.7)) * Math.max(1, lines.length)));
	}

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d', opacity }}>
			<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.2} grayscale={65} hideCredit={Boolean(scene.glossary)} />
			<AmbientParticles accent={cueReached ? '#ff3b30' : '#38bdf8'} />
			<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
			{errIdx >= 0 && (
				<Sequence from={cue} layout="none">
					<Audio src={staticFile('sfx/glitch.wav')} volume={0.18} />
				</Sequence>
			)}
			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 48,
					padding: '0 90px',
				}}
			>
				<div
					style={{
						width: servers.length ? 940 : 1380,
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
						<span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
						<span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
						<span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
						<span style={{ fontFamily: MONO, fontSize: 24, color: '#94a3b8', marginLeft: 12 }}>
							{scene.eyebrow || 'ops@jersey-city-dc: ~/smars-deploy'}
						</span>
					</div>
					<div style={{ padding: '28px 32px', fontFamily: MONO, fontSize: 30, lineHeight: 1.75 }}>
						{lines.slice(0, visibleLines).map((line, i) => {
							const isErr = line.startsWith('[ERR]') || line.startsWith('[FATAL]');
							const isWarn = line.startsWith('[WARN]') || line.startsWith('[ALERT]');
							const isCmd = line.startsWith('$');
							return (
								<div
									key={i}
									style={{
										color: isErr ? '#ff453a' : isWarn ? '#fbbf24' : isCmd ? '#38bdf8' : '#86efac',
										fontWeight: isErr ? 700 : 400,
										backgroundColor: isErr ? 'rgba(255, 59, 48, 0.14)' : 'transparent',
										padding: isErr ? '4px 10px' : '0 10px',
										borderRadius: 4,
									}}
								>
									{line}
								</div>
							);
						})}
					</div>
				</div>

				{servers.length > 0 ? (
					<div style={{ width: 680 }}>
						<div style={{ fontFamily: MONO, fontSize: 26, color: '#94a3b8', letterSpacing: 3, marginBottom: 18 }}>
							{scene.headline || 'SMARS PRODUCTION CLUSTER'}
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
							{servers.slice(0, 8).map((srv, i) => {
								const isFail = srv.status === 'fail' && (errIdx < 0 || cueReached);
								const isWarn = srv.status === 'warn' || (srv.status === 'fail' && errIdx >= 0 && !cueReached);
								const accent = isFail ? '#ff3b30' : isWarn ? '#f59e0b' : '#4ade80';
								return (
									<div
										key={i}
										style={{
											backgroundColor: isFail ? 'rgba(45, 14, 18, 0.95)' : 'rgba(15, 23, 42, 0.92)',
											border: `2px solid ${isFail ? '#ff3b30' : isWarn ? '#f59e0b' : '#1e293b'}`,
											borderRadius: 10,
											padding: '18px 22px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											boxShadow: isFail ? `0 0 ${16 + 14 * pulse}px rgba(255, 59, 48, 0.45)` : 'none',
										}}
									>
										<div>
											<div style={{ fontFamily: SANS, fontSize: 34, fontWeight: 800, color: '#f8fafc' }}>
												{srv.label}
											</div>
											<div style={{ fontFamily: MONO, fontSize: 20, color: isFail ? '#fca5a5' : '#64748b', marginTop: 4 }}>
												{srv.sub}
											</div>
										</div>
										<span
											style={{
												width: 14,
												height: 14,
												borderRadius: '50%',
												backgroundColor: accent,
												opacity: isFail ? 0.4 + 0.6 * pulse : 1,
											}}
										/>
									</div>
								);
							})}
						</div>
					</div>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 5. Full-screen 1600x680 Loss Trajectory Chart with tip-synced clipPath & cueFrame pacing
const SceneLossChart: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const data = scene.points && scene.points.length >= 2 ? scene.points : [{ x: '09:30', y: 0 }, { x: '10:15', y: -440 }];
	const unit = scene.unit ?? '$M';
	const endFrame = scene.cueFrame ? Math.max(30, scene.cueFrame + 24) : Math.max(25, scene.duration * 0.72);
	const reveal = Math.min(1, frame / endFrame);
	const pulse = (Math.sin(frame / 4) + 1) / 2;

	const left = 160;
	const right = 1470;
	const top = 110;
	const bottom = 580;
	const w = right - left;
	const h = bottom - top;
	const ys = data.map((p) => p.y);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const spanY = Math.max(1e-6, maxY - minY);

	const coords = data.map((p, i) => ({
		...p,
		px: left + (i / (data.length - 1)) * w,
		py: top + ((maxY - p.y) / spanY) * h,
	}));

	// Compute exact polyline arc-length so clipPath X tracks the animated stroke tip!
	const segLens = coords.slice(1).map((c, i) => Math.hypot(c.px - coords[i].px, c.py - coords[i].py));
	const totalLen = Math.max(1, segLens.reduce((a, b) => a + b, 0));
	const targetLen = reveal * totalLen;
	let acc = 0;
	let tipX = coords[0].px;
	for (let i = 0; i < segLens.length; i++) {
		if (acc + segLens[i] >= targetLen) {
			const frac = (targetLen - acc) / Math.max(1e-6, segLens[i]);
			tipX = coords[i].px + frac * (coords[i + 1].px - coords[i].px);
			break;
		}
		acc += segLens[i];
		tipX = coords[i + 1].px;
	}

	const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(' ');
	const areaPath = `${linePath} L ${coords[coords.length - 1].px.toFixed(1)} ${bottom} L ${coords[0].px.toFixed(1)} ${bottom} Z`;

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
			<AmbientParticles accent="#ef4444" />
			<div style={{ width: 1600, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', zIndex: 10 }}>
				<div>
					<span style={{ fontFamily: MONO, fontSize: 27, color: '#ef4444', letterSpacing: 3, display: 'block', marginBottom: 6 }}>
						{scene.eyebrow || 'CUMULATIVE LOSS TRAJECTORY'}
					</span>
					<span style={{ fontFamily: SANS, fontSize: 62, fontWeight: 800, color: '#f8fafc', letterSpacing: -1 }}>
						{scene.headline || '45 MINUTES TO INSOLVENCY'}
					</span>
				</div>
				{scene.stat ? <span style={{ fontFamily: MONO, fontSize: 62, fontWeight: 800, color: '#ff3b30' }}>{scene.stat}</span> : null}
			</div>

			<svg viewBox="0 0 1600 680" width={1600} height={680}>
				<defs>
					<pattern id="docu3ChartGrid" width="80" height="80" patternUnits="userSpaceOnUse">
						<path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
					</pattern>
					<linearGradient id="docu3LossFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ef4444" stopOpacity="0.42" />
						<stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
					</linearGradient>
					<clipPath id="docu3ChartClip">
						<rect x={left} y={0} width={Math.max(0, tipX - left)} height={680} />
					</clipPath>
				</defs>

				<rect width="1600" height="680" rx="14" fill="#0b101b" stroke="#1e293b" strokeWidth="2" />
				<rect width="1600" height="680" rx="14" fill="url(#docu3ChartGrid)" />

				<line x1={left} y1={top} x2={left} y2={bottom} stroke="#334155" strokeWidth="2" />
				<line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#334155" strokeWidth="2" />
				<text x={left - 18} y={top + 10} fill="#94a3b8" fontSize="26" fontFamily={MONO} textAnchor="end">
					{`${maxY}${unit}`}
				</text>
				<text x={left - 18} y={bottom} fill="#f87171" fontSize="26" fontFamily={MONO} textAnchor="end">
					{`${minY}${unit}`}
				</text>

				<path d={areaPath} fill="url(#docu3LossFill)" clipPath="url(#docu3ChartClip)" />
				<path
					d={linePath}
					fill="none"
					stroke="#ff3b30"
					strokeWidth="6"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={totalLen}
					strokeDashoffset={totalLen * (1 - reveal)}
				/>

				{coords.map((c, i) => {
					if (tipX < c.px - 2) return null;
					const labelY = c.py > bottom - 68 ? c.py - 30 : c.py + 44;
					return (
						<g key={i}>
							{c.alert && <circle cx={c.px} cy={c.py} r={16 + 7 * pulse} fill="rgba(255,59,48,0.25)" />}
							<circle cx={c.px} cy={c.py} r={c.alert ? 10 : 7} fill={c.alert ? '#ff3b30' : '#f8fafc'} stroke="#0b101b" strokeWidth="3" />
							<text x={c.px} y={bottom + 46} fill="#cbd5e1" fontSize="28" fontFamily={MONO} textAnchor="middle">
								{c.x}
							</text>
							<text
								x={c.px}
								y={labelY}
								fill={c.alert ? '#fca5a5' : '#f8fafc'}
								fontSize="32"
								fontWeight="bold"
								fontFamily={SANS}
								textAnchor="middle"
							>
								{c.label || `${c.y}${unit}`}
							</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// 6. Dead-Silence Twist Typography
const SceneSilenceTwist: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const lines = scene.lines ?? ['NO HACKER.', 'NO MARKET CRASH.', 'ONE SKIPPED SERVER.'];
	const t1 = Math.min(1, frame / 10);
	const t2 = Math.min(1, Math.max(0, (frame - Math.floor(scene.duration * 0.3)) / 10));
	const t3 = Math.min(1, Math.max(0, (frame - Math.floor(scene.duration * 0.6)) / 12));
	const alphas = [t1, t2, t3];

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
				padding: '0 80px',
				textAlign: 'center',
			}}
		>
			{lines.slice(0, 3).map((line, i) => {
				const isLast = i === Math.min(2, lines.length - 1);
				return (
					<div
						key={i}
						style={{
							fontFamily: SANS,
							fontSize: isLast ? 124 : 86,
							fontWeight: isLast ? 900 : 700,
							color: isLast ? '#ff3b30' : '#94a3b8',
							letterSpacing: isLast ? -2 : 0,
							opacity: alphas[i] ?? 1,
							transform: isLast ? `scale(${0.94 + 0.06 * (alphas[i] ?? 1)})` : undefined,
							marginTop: isLast ? 10 : 0,
						}}
					>
						{line}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// 7. Full-Screen Archival Living Document with word-synced animated highlighter
const SceneDocument: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const cardScale = interpolate(frame, [0, scene.duration], [1.0, 1.03], { extrapolateRight: 'clamp' });
	const cue = Math.max(6, scene.cueFrame ?? 14);
	const sweep = interpolate(frame, [cue, cue + 16], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	const excerpt = scene.excerpt ?? '';
	const target = scene.highlight ?? '';
	const matchIdx = target ? excerpt.toLowerCase().indexOf(target.toLowerCase()) : -1;
	const before = matchIdx >= 0 ? excerpt.slice(0, matchIdx) : '';
	const matched = matchIdx >= 0 ? excerpt.slice(matchIdx, matchIdx + target.length) : excerpt;
	const after = matchIdx >= 0 ? excerpt.slice(matchIdx + target.length) : '';
	const markerBg = scene.highlightColor === 'red' ? 'rgba(239, 68, 68, 0.34)' : 'rgba(250, 204, 21, 0.78)';

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d', opacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<MediaBackdrop media={scene.media} mediaList={scene.mediaList} duration={scene.duration} brightness={0.22} grayscale={70} hideCredit={Boolean(scene.glossary)} />
			<AmbientParticles accent="#fbbf24" />
			<Sequence from={4} layout="none">
				<Audio src={staticFile('sfx/paper_flip.wav')} volume={0.18} />
			</Sequence>
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/scribble.wav')} volume={0.26} />
			</Sequence>
			<div
				style={{
					width: 1520,
					backgroundColor: '#f4efe2',
					borderRadius: 10,
					padding: '48px 64px',
					boxShadow: '0 32px 80px rgba(0,0,0,0.88)',
					transform: `scale(${cardScale})`,
					position: 'relative',
					zIndex: 10,
				}}
			>
				<div
					style={{
						fontFamily: MONO,
						fontSize: 28,
						fontWeight: 700,
						color: '#475569',
						letterSpacing: 2,
						borderBottom: '3px solid #1e293b',
						paddingBottom: 16,
						marginBottom: 24,
					}}
				>
					{scene.source}
					{scene.date ? `  •  ${scene.date}` : ''}
				</div>
				{scene.stamp ? (
					<div
						style={{
							position: 'absolute',
							top: 38,
							right: 54,
							border: '4px solid #b91c1c',
							color: '#b91c1c',
							fontFamily: SANS,
							fontSize: 30,
							fontWeight: 900,
							padding: '8px 18px',
							transform: 'rotate(-5deg)',
							letterSpacing: 2,
						}}
					>
						{scene.stamp}
					</div>
				) : null}
				<div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingRight: 250 }}>
					{scene.headline}
				</div>
				<div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1.48, color: '#1e293b' }}>
					<span>{before}</span>
					<span
						style={{
							backgroundImage: `linear-gradient(90deg, ${markerBg} 0%, ${markerBg} 100%)`,
							backgroundRepeat: 'no-repeat',
							backgroundSize: `${sweep}% 90%`,
							backgroundPosition: '0 60%',
							padding: '2px 6px',
							fontWeight: 700,
							color: '#090d16',
						}}
					>
						{matched}
					</span>
					<span>{after}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 8. Full-Screen 5-Layer Swiss Cheese Model
const SceneSwissCheese: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const layers = scene.layers ?? [];
	const arrowOffset = Math.min(1320, frame * 26);
	const startX = 180;
	const stepX = Math.max(220, Math.floor(1160 / Math.max(1, layers.length)));

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d', opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
			<AmbientParticles accent="#f59e0b" />
			<div style={{ width: 1560, marginBottom: 14, zIndex: 10 }}>
				<div style={{ fontFamily: MONO, fontSize: 27, color: '#f59e0b', letterSpacing: 3, marginBottom: 6 }}>
					{scene.eyebrow || 'SYSTEMIC FAILURE ANALYSIS'}
				</div>
				<div style={{ fontFamily: SANS, fontSize: 62, fontWeight: 800, color: '#f8fafc' }}>
					{scene.headline || 'THE SWISS CHEESE MODEL'}
				</div>
			</div>
			<svg viewBox="0 0 1560 660" width={1560} height={660}>
				<defs>
					<linearGradient id="docuCheese" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#f59e0b" />
						<stop offset="100%" stopColor="#b45309" />
					</linearGradient>
				</defs>
				<rect width="1560" height="660" rx="14" fill="#0b101b" stroke="#334155" strokeWidth="2" />
				{layers.map((layer, i) => {
					const x = startX + i * stepX;
					return (
						<g key={i}>
							<rect x={x} y="120" width="96" height="360" rx="14" fill="url(#docuCheese)" stroke="#fbbf24" strokeWidth="3" transform="skewY(-6)" opacity="0.92" />
							<ellipse cx={x + 48} cy={305 - x * 0.1} rx="30" ry="20" fill="#0b101b" stroke="#ff3b30" strokeWidth="3" />
							<ellipse cx={x + 48} cy={200 - x * 0.1} rx="16" ry="12" fill="#0b101b" opacity="0.6" />
							<ellipse cx={x + 48} cy={410 - x * 0.1} rx="18" ry="14" fill="#0b101b" opacity="0.6" />
							<text x={x + 48} y="552" fill="#fde68a" fontSize="24" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
								{layer.title}
							</text>
							<text x={x + 48} y="586" fill="#cbd5e1" fontSize="20" fontFamily={MONO} textAnchor="middle">
								{layer.sub}
							</text>
						</g>
					);
				})}
				<line
					x1="90"
					y1="265"
					x2={90 + arrowOffset}
					y2="265"
					stroke="#ff2a2a"
					strokeWidth="9"
					strokeLinecap="round"
					filter="drop-shadow(0 0 12px #ff2a2a)"
				/>
				{arrowOffset > 1180 && (
					<g transform="translate(1450, 265)">
						<circle r="64" fill="#ff2a2a" filter="drop-shadow(0 0 22px #ff2a2a)" />
						<text y="9" fill="#ffffff" fontSize="26" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
							-$440M
						</text>
					</g>
				)}
			</svg>
		</AbsoluteFill>
	);
};

// 9. Split-Screen Expected vs Reality Mechanism Comparison
const SceneExpectedVsReality: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.45);
	const cueReached = frame >= cue;
	const pulse = (Math.sin(frame / 7) + 1) / 2;

	const left: DocuCompareColumn = scene.left ?? {
		tag: 'EXPECTED • SERVERS 1–7',
		title: '2012 RLP ROUTER',
		steps: ['Receive new RLP flag', 'Execute updated pricing logic', 'Track parent order fill limit', 'Stop once parent order fills'],
		verdict: 'SAFE EXECUTION',
		status: 'ok',
	};
	const right: DocuCompareColumn = scene.right ?? {
		tag: 'REALITY • SERVER 8',
		title: '2003 POWER PEG',
		steps: ['Receive exact same flag bit', 'Wake dormant 2003 test code', 'Bypass cumulative fill check', 'Fire runaway child orders'],
		verdict: 'UNBOUNDED LOOP',
		status: 'fail',
	};

	const columns = [
		{ col: left, side: 'left' as const },
		{ col: right, side: 'right' as const },
	];

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#06080d',
				opacity,
				padding: '74px 90px 72px 90px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.18} grayscale={75} hideCredit={Boolean(scene.glossary)} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage:
						'linear-gradient(rgba(56,189,248,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.045) 1px, transparent 1px)',
					backgroundSize: '48px 48px',
					pointerEvents: 'none',
				}}
			/>
			<AmbientParticles accent={cueReached ? '#ff3b30' : '#38bdf8'} />
			<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/glitch.wav')} volume={0.18} />
			</Sequence>

			<div style={{ zIndex: 10, maxWidth: 1180 }}>
				<div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: cueReached ? '#ff453a' : '#38bdf8', marginBottom: 8 }}>
					{scene.eyebrow || 'SYSTEM MECHANISM • DESIGN VS FAILURE'}
				</div>
				<div style={{ fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
					{scene.headline || 'Same Signal. Two Completely Different Code Paths.'}
				</div>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, zIndex: 10, flex: 1, marginTop: 26 }}>
				{columns.map(({ col, side }) => {
					const isRightFail = col.status === 'fail' || side === 'right';
					const activeFail = isRightFail && cueReached;
					const borderColor = activeFail ? '#ff3b30' : isRightFail ? '#f59e0b' : '#22c55e';
					const accentBg = activeFail ? 'rgba(42, 10, 14, 0.92)' : 'rgba(10, 16, 28, 0.92)';
					const panelPop = spring({ frame: frame - (side === 'left' ? 4 : 12), fps, config: { damping: 18 } });

					return (
						<div
							key={side}
							style={{
								backgroundColor: accentBg,
								border: `2px solid ${borderColor}`,
								borderRadius: 14,
								padding: '28px 34px',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								boxShadow: activeFail ? `0 0 ${24 + 18 * pulse}px rgba(255, 59, 48, 0.38)` : '0 20px 50px rgba(0,0,0,0.6)',
								opacity: panelPop,
								transform: `translateY(${interpolate(panelPop, [0, 1], [16, 0])}px)`,
							}}
						>
							<div>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
									<span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, letterSpacing: 3, color: borderColor }}>
										{col.tag}
									</span>
									<span
										style={{
											fontFamily: MONO,
											fontSize: 13,
											fontWeight: 700,
											padding: '4px 12px',
											borderRadius: 4,
											backgroundColor: activeFail ? 'rgba(255,59,48,0.22)' : 'rgba(34,197,94,0.16)',
											color: activeFail ? '#fca5a5' : '#86efac',
										}}
									>
										{side === 'left' ? 'EXPECTED' : activeFail ? 'FAULT TRIGGERED' : 'ARMED'}
									</span>
								</div>
								<div style={{ fontFamily: SANS, fontSize: 34, fontWeight: 800, color: '#ffffff', marginBottom: 24 }}>
									{col.title}
								</div>

								<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
									{col.steps.map((step, idx) => {
										const threshold = side === 'left' ? 12 + idx * 18 : Math.max(14, cue - 10 + idx * 16);
										const revealed = frame >= threshold;
										const isDangerStep = activeFail && idx >= col.steps.length - 2;
										return (
											<div
												key={idx}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: 16,
													padding: '14px 18px',
													borderRadius: 8,
													backgroundColor: isDangerStep && revealed ? 'rgba(255, 59, 48, 0.16)' : 'rgba(15, 23, 42, 0.85)',
													borderLeft: `4px solid ${!revealed ? '#334155' : isDangerStep ? '#ff3b30' : borderColor}`,
													opacity: revealed ? 1 : 0.28,
												}}
											>
												<span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: isDangerStep ? '#ff453a' : borderColor }}>
													0{idx + 1}
												</span>
												<span style={{ fontFamily: SANS, fontSize: 22, fontWeight: isDangerStep ? 700 : 500, color: '#f1f5f9' }}>
													{step}
												</span>
											</div>
										);
									})}
								</div>
							</div>

							<div
								style={{
									marginTop: 22,
									padding: '14px 20px',
									borderRadius: 8,
									backgroundColor: activeFail ? 'rgba(255, 59, 48, 0.22)' : 'rgba(34, 197, 94, 0.14)',
									border: `1px solid ${borderColor}`,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
								}}
							>
								<span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: '#cbd5e1' }}>OUTCOME</span>
								<span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, letterSpacing: 2, color: activeFail ? '#ff6961' : '#4ade80' }}>
									{col.verdict}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// 10. Animated Architecture & Packet-Loop Simulation (`flow_sim`)
const SceneFlowSim: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.42);
	const cueReached = frame >= cue;
	const pulse = (Math.sin(frame / 6) + 1) / 2;

	const nodes: DocuFlowNode[] = scene.flowNodes ?? [
		{ id: 'nyse', label: 'NYSE RLP', sub: 'Incoming Orders', x: 220, y: 310, role: 'source' },
		{ id: 'smars', label: 'SMARS ROUTER', sub: 'Child Order Slicer', x: 650, y: 310, role: 'source' },
		{ id: 'ok', label: 'SERVERS 1–7', sub: '2012 Code • Safe', x: 1120, y: 155, role: 'ok' },
		{ id: 'bad', label: 'SERVER 8', sub: '2003 Power Peg Flag', x: 1120, y: 465, role: 'fail' },
		{ id: 'mkt', label: 'WALL STREET', sub: 'Live Market Executions', x: 1490, y: 310, role: 'target' },
	];
	const edges: DocuFlowEdge[] = scene.flowEdges ?? [
		{ from: 'nyse', to: 'smars', label: 'FLAG BIT' },
		{ from: 'smars', to: 'ok', label: '87.5%' },
		{ from: 'smars', to: 'bad', label: '12.5%', bad: true },
		{ from: 'ok', to: 'mkt', label: 'TRACKED' },
		{ from: 'bad', to: 'mkt', label: 'NO LIMIT', bad: true },
		{ from: 'mkt', to: 'bad', label: 'RE-TRIGGER LOOP', bad: true },
	];

	const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
	const postRatio = cueReached ? Math.min(1, (frame - cue) / Math.max(15, scene.duration - cue - 10)) : 0;
	const counterVal = Math.floor((scene.counterMax ?? 4000000) * Math.pow(postRatio, 1.35));

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#06080d',
				opacity,
				padding: '74px 90px 68px 90px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.16} grayscale={80} hideCredit={Boolean(scene.glossary)} />
			<AmbientParticles accent={cueReached ? '#ff3b30' : '#38bdf8'} />
			<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/glitch.wav')} volume={0.18} />
			</Sequence>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
				<div>
					<div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: cueReached ? '#ff453a' : '#38bdf8', marginBottom: 8 }}>
						{scene.eyebrow || 'PACKET SIMULATION • LIVE FEEDBACK LOOP'}
					</div>
					<div style={{ fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc' }}>
						{scene.headline || 'Inside the Runaway Execution Loop'}
					</div>
				</div>
				{!scene.glossary && (
					<div
						style={{
							backgroundColor: cueReached ? 'rgba(42, 10, 14, 0.92)' : 'rgba(15, 23, 42, 0.9)',
							border: `1.5px solid ${cueReached ? '#ff3b30' : '#334155'}`,
							borderRadius: 10,
							padding: '12px 24px',
							textAlign: 'right',
						}}
					>
						<div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2.5, color: '#94a3b8' }}>
							{scene.counterLabel || 'ROGUE CHILD ORDERS'}
						</div>
						<div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: cueReached ? '#ff453a' : '#38bdf8' }}>
							{counterVal.toLocaleString('en-US')}
						</div>
					</div>
				)}
			</div>

			<svg viewBox="0 0 1680 620" width={1680} height={620} style={{ zIndex: 10, alignSelf: 'center' }}>
				<rect width="1680" height="620" rx="16" fill="rgba(9, 13, 22, 0.92)" stroke="#1e293b" strokeWidth="2" />
				<g opacity="0.12">
					{[155, 310, 465].map((y) => (
						<line key={`hg${y}`} x1="0" y1={y} x2="1680" y2={y} stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 8" />
					))}
					{[336, 672, 1008, 1344].map((x) => (
						<line key={`vg${x}`} x1={x} y1="0" x2={x} y2="620" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 8" />
					))}
				</g>

				{edges.map((edge, idx) => {
					const a = nodeMap[edge.from];
					const b = nodeMap[edge.to];
					if (!a || !b) return null;
					const isReturn = a.x > b.x;
					const bend = isReturn ? 125 : edge.bad ? 35 : -25;
					const cx = (a.x + b.x) / 2;
					const cy = (a.y + b.y) / 2 + bend;
					const activeBad = Boolean(edge.bad) && cueReached;
					const stroke = activeBad ? '#ff3b30' : edge.bad ? '#f59e0b' : '#38bdf8';
					const pathD = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
					const speed = activeBad ? 0.032 : 0.014;
					const packets = activeBad ? 4 : 2;
					const labelX = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
					const labelY = 0.25 * a.y + 0.5 * cy + 0.25 * b.y + (isReturn ? 24 : -14);

					return (
						<g key={idx}>
							<path
								d={pathD}
								fill="none"
								stroke={stroke}
								strokeWidth={activeBad ? 4.5 : 2.5}
								strokeDasharray={isReturn ? '10 6' : undefined}
								opacity={activeBad ? 0.92 : 0.5}
							/>
							{edge.label ? (
								<text x={labelX} y={labelY} fill={activeBad ? '#fca5a5' : '#94a3b8'} fontSize="14" fontFamily={MONO} fontWeight="bold" textAnchor="middle">
									{edge.label}
								</text>
							) : null}
							{(!edge.bad || cueReached) &&
								Array.from({ length: packets }, (_, pIdx) => {
									const t = ((frame * speed + pIdx / packets + idx * 0.17) % 1 + 1) % 1;
									const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x;
									const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y;
									return (
										<circle
											key={pIdx}
											cx={px}
											cy={py}
											r={activeBad ? 8 : 6}
											fill={activeBad ? '#ff453a' : '#38bdf8'}
											filter={`drop-shadow(0 0 8px ${activeBad ? '#ff3b30' : '#38bdf8'})`}
										/>
									);
								})}
						</g>
					);
				})}

				{nodes.map((node) => {
					const isFail = node.role === 'fail' && cueReached;
					const border =
						isFail ? '#ff3b30' : node.role === 'fail' ? '#f59e0b' : node.role === 'ok' ? '#22c55e' : '#38bdf8';
					const fill = isFail ? '#2b0b10' : '#0f172a';
					return (
						<g key={node.id} transform={`translate(${node.x - 140}, ${node.y - 54})`}>
							{isFail && (
								<rect
									x="-8"
									y="-8"
									width="296"
									height="124"
									rx="16"
									fill="none"
									stroke="#ff3b30"
									strokeWidth="2.5"
									opacity={0.35 + 0.55 * pulse}
								/>
							)}
							<rect width="280" height="108" rx="12" fill={fill} stroke={border} strokeWidth={isFail ? 3 : 2} />
							<circle cx="24" cy="30" r="6" fill={border} opacity={isFail ? 0.4 + 0.6 * pulse : 1} />
							<text x="40" y="37" fill="#ffffff" fontSize="21" fontFamily={SANS} fontWeight="800">
								{node.label}
							</text>
							<text x="24" y="76" fill={isFail ? '#fca5a5' : '#94a3b8'} fontSize="15" fontFamily={MONO}>
								{node.sub}
							</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

// 11. Forensic Minute-by-Minute Timeline Zoom (`timeline_zoom`)
const SceneTimelineZoom: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.5);
	const pulse = (Math.sin(frame / 7) + 1) / 2;

	const events: DocuTimelineEvent[] = scene.timelineEvents ?? [
		{ time: '08:01', title: 'Manual Deploy', detail: 'Missed Server #8', severity: 'warn' },
		{ time: '09:30', title: 'Opening Bell', detail: 'Power Peg wakes up', severity: 'critical' },
		{ time: '09:31', title: '97 Alerts', detail: 'Ignored in inbox', severity: 'warn' },
		{ time: '09:45', title: 'Fatal Rollback', detail: 'Multiplied loss 8x', severity: 'critical' },
		{ time: '10:15', title: 'Kill Switch', detail: '$440M destroyed', severity: 'critical' },
	];

	const progress = interpolate(frame, [12, Math.max(24, scene.duration - 28)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const activeIdx = Math.min(events.length - 1, Math.floor(progress * events.length));
	const cueReached = frame >= cue;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#06080d',
				opacity,
				padding: '74px 90px 74px 90px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.18} grayscale={75} hideCredit={Boolean(scene.glossary)} />
			<AmbientParticles accent={cueReached ? '#ff3b30' : '#38bdf8'} />
			<GlossaryCard glossary={scene.glossary} duration={scene.duration} />
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/boom.wav')} volume={0.2} />
			</Sequence>

			<div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
				<div>
					<div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: cueReached ? '#ff453a' : '#38bdf8', marginBottom: 8 }}>
						{scene.eyebrow || 'FORENSIC TIMELINE • MINUTE BY MINUTE'}
					</div>
					<div style={{ fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc' }}>
						{scene.headline || 'How 45 Minutes Unfolded'}
					</div>
				</div>
				{!scene.glossary && (
					<div style={{ fontFamily: MONO, fontSize: 42, fontWeight: 800, color: events[activeIdx]?.severity === 'critical' ? '#ff453a' : '#38bdf8' }}>
						{events[activeIdx]?.time} EDT
					</div>
				)}
			</div>

			<div style={{ position: 'relative', height: 610, display: 'flex', alignItems: 'center', zIndex: 10 }}>
				<div style={{ position: 'absolute', left: 40, right: 40, top: 302, height: 6, backgroundColor: '#1e293b', borderRadius: 3 }}>
					<div
						style={{
							width: `${progress * 100}%`,
							height: '100%',
							borderRadius: 3,
							background: 'linear-gradient(90deg, #38bdf8 0%, #f59e0b 45%, #ff3b30 100%)',
							boxShadow: '0 0 18px rgba(255, 59, 48, 0.55)',
						}}
					/>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: `repeat(${events.length}, 1fr)`, gap: 20, width: '100%', padding: '0 20px' }}>
					{events.map((ev, i) => {
						const threshold = i / Math.max(1, events.length);
						const unlocked = progress >= threshold * 0.92;
						const pop = unlocked ? spring({ frame: frame - Math.floor(threshold * (scene.duration - 40)), fps, config: { damping: 16 } }) : 0;
						const isCrit = ev.severity === 'critical';
						const color = isCrit ? '#ff3b30' : ev.severity === 'warn' ? '#f59e0b' : '#38bdf8';
						const isTop = i % 2 === 0;

						return (
							<div key={i} style={{ position: 'relative', height: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
								<div
									style={{
										position: 'absolute',
										top: isTop ? 36 : 330,
										width: '100%',
										backgroundColor: isCrit && unlocked ? 'rgba(42, 10, 14, 0.92)' : 'rgba(13, 18, 30, 0.92)',
										border: `1.5px solid ${unlocked ? color : '#1e293b'}`,
										borderRadius: 12,
										padding: '22px 20px',
										opacity: unlocked ? 0.25 + 0.75 * pop : 0.2,
										transform: `translateY(${unlocked ? 0 : isTop ? -12 : 12}px)`,
										boxShadow: isCrit && i === activeIdx ? `0 0 ${20 + 14 * pulse}px rgba(255, 59, 48, 0.4)` : '0 12px 32px rgba(0,0,0,0.55)',
									}}
								>
									<div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color, marginBottom: 6 }}>
										{ev.time}
									</div>
									<div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
										{ev.title}
									</div>
									<div style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.4, color: '#cbd5e1' }}>
										{ev.detail}
									</div>
								</div>

								<div
									style={{
										position: 'absolute',
										top: 268,
										width: 22,
										height: 22,
										borderRadius: '50%',
										backgroundColor: unlocked ? color : '#334155',
										border: '4px solid #06080d',
										boxShadow: unlocked ? `0 0 14px ${color}` : 'none',
										zIndex: 5,
									}}
								/>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 12. Style A: Vox / Johnny Harris Archival Paper Desk (`editorial_vox`)
const SceneEditorialVox: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.45);
	const cueReached = frame >= cue;

	const camProgress = frame / Math.max(1, scene.duration);
	const deskScale = interpolate(camProgress, [0, 1], [1.0, 1.035]);
	const deskX = interpolate(camProgress, [0, 1], [8, -14]);
	const photoIn = spring({ frame: frame - 4, fps, config: { damping: 18 } });
	const slipIn = spring({ frame: frame - 14, fps, config: { damping: 18 } });
	const hlStart = Math.max(12, cue - 34);
	const hlEnd = Math.max(hlStart + 18, cue - 6);
	const hlWidth = interpolate(frame, [hlStart, hlEnd], [0, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const arrowDraw = interpolate(frame, [cue, cue + 22], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const noteIn = interpolate(frame, [cue + 16, cue + 28], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const excerptText =
		scene.excerpt ||
		'On August 1, technicians manually copied new RLP routing code to seven of eight servers. Server 8 retained obsolete 2003 Power Peg code — and the reused flag triggered it instantly.';
	const highlightPhrase = scene.highlight || 'Server 8 retained obsolete 2003 Power Peg code';
	const hlIdx = highlightPhrase ? excerptText.indexOf(highlightPhrase) : -1;
	const preText = hlIdx >= 0 ? excerptText.slice(0, hlIdx) : excerptText;
	const midText = hlIdx >= 0 ? excerptText.slice(hlIdx, hlIdx + highlightPhrase.length) : '';
	const postText = hlIdx >= 0 ? excerptText.slice(hlIdx + highlightPhrase.length) : '';

	return (
		<AbsoluteFill style={{ backgroundColor: '#e7dfd0', opacity, overflow: 'hidden' }}>
			{/* Paper desk texture + subtle architectural ruled lines */}
			<AbsoluteFill
				style={{
					transform: `scale(${deskScale}) translateX(${deskX}px)`,
					backgroundImage:
						'radial-gradient(rgba(40, 32, 20, 0.08) 1px, transparent 1px), linear-gradient(rgba(68, 56, 40, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(68, 56, 40, 0.05) 1px, transparent 1px)',
					backgroundSize: '18px 18px, 64px 64px, 64px 64px',
				}}
			/>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse at center, transparent 58%, rgba(45, 36, 24, 0.24) 100%)',
					pointerEvents: 'none',
				}}
			/>
			{/* Layered tactile SFX: paper placement -> yellow highlighter scribble -> red marker circle scratch */}
			<Sequence from={4} layout="none">
				<Audio src={staticFile('sfx/paper_flip.wav')} volume={0.22} />
			</Sequence>
			<Sequence from={hlStart} layout="none">
				<Audio src={staticFile('sfx/scribble.wav')} volume={0.28} />
			</Sequence>
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/scratch.wav')} volume={0.32} />
			</Sequence>

			<AbsoluteFill style={{ padding: '74px 90px 72px 90px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<div>
						<div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: '#7c2d12', fontWeight: 700, marginBottom: 6 }}>
							{scene.eyebrow || 'STYLE 01  •  EDITORIAL PAPER & CLIPPINGS'}
						</div>
						<div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: '#1c1917', letterSpacing: -0.5, maxWidth: 1220, lineHeight: 1.12 }}>
							{scene.headline || 'One Missed Server Left 2003 Test Code Live'}
						</div>
					</div>
					<div
						style={{
							fontFamily: MONO,
							fontSize: 19,
							letterSpacing: 2,
							color: '#44403c',
							border: '1.5px solid rgba(68, 64, 60, 0.45)',
							padding: '8px 16px',
							backgroundColor: 'rgba(250, 246, 237, 0.75)',
						}}
					>
						{scene.source || 'SEC RELEASE NO. 34-70694'}
					</div>
				</div>

				<div style={{ display: 'flex', gap: 56, alignItems: 'center', flex: 1, marginTop: 14 }}>
					{/* Tilted physical archival photo clipping with masking tape */}
					<div
						style={{
							position: 'relative',
							width: 660,
							backgroundColor: '#faf6ed',
							padding: '18px 18px 46px 18px',
							boxShadow: '0 22px 48px rgba(28, 25, 23, 0.26), 0 2px 8px rgba(28,25,23,0.14)',
							transform: `rotate(-2.1deg) scale(${0.96 + 0.04 * photoIn})`,
							opacity: photoIn,
						}}
					>
						<div
							style={{
								position: 'absolute',
								top: -14,
								left: 64,
								width: 110,
								height: 28,
								backgroundColor: 'rgba(222, 200, 148, 0.78)',
								transform: 'rotate(-8deg)',
								boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								top: -12,
								right: 68,
								width: 100,
								height: 28,
								backgroundColor: 'rgba(222, 200, 148, 0.78)',
								transform: 'rotate(7deg)',
								boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
							}}
						/>
						{scene.media ? (
							<div style={{ width: '100%', height: 430, overflow: 'hidden', backgroundColor: '#1c1917' }}>
								<Img
									src={staticFile(scene.media.src)}
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										filter: 'sepia(14%) contrast(1.04) brightness(0.96)',
										transform: `scale(${interpolate(camProgress, [0, 1], [1.02, 1.09])})`,
									}}
								/>
							</div>
						) : null}
						<div style={{ fontFamily: MONO, fontSize: 19, color: '#57534e', marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
							<span>{scene.media?.credit || 'ARCHIVE • NEW YORK STOCK EXCHANGE'}</span>
							<span>AUG 01, 2012 • 09:30 EDT</span>
						</div>
					</div>

					{/* Physical SEC memorandum slip + yellow marker + hand-drawn red ink callout */}
					<div
						style={{
							position: 'relative',
							flex: 1,
							backgroundColor: '#faf7f0',
							border: '1px solid #cfc5b1',
							padding: '34px 40px',
							boxShadow: '0 22px 46px rgba(28, 25, 23, 0.2)',
							transform: `rotate(1.1deg) translateY(${interpolate(slipIn, [0, 1], [24, 0])}px)`,
							opacity: slipIn,
						}}
					>
						<div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 2.5, color: '#78716c', borderBottom: '1px solid #d6cfc2', paddingBottom: 12, marginBottom: 20 }}>
							{scene.subline || 'INTERNAL DEPLOYMENT LOG • SMARS-CLUSTER (8 NODES)'}
						</div>
						<div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.45, color: '#1c1917' }}>
							{preText}
							{midText ? (
								<span
									style={{
										backgroundImage: 'linear-gradient(120deg, rgba(250, 204, 21, 0.68) 0%, rgba(250, 204, 21, 0.68) 100%)',
										backgroundRepeat: 'no-repeat',
										backgroundSize: `${hlWidth}% 100%`,
										padding: '2px 4px',
										fontWeight: 700,
									}}
								>
									{midText}
								</span>
							) : null}
							{postText}
						</div>

						<div style={{ marginTop: 28, position: 'relative', display: 'flex', gap: 12, alignItems: 'center', overflow: 'visible' }}>
							{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
								const allMode = scene.voxMode === 'all_8';
								const isLegacy = allMode ? cueReached : n === 8;
								const mark = allMode ? cueReached : n === 8 && cueReached;
								return (
									<div
										key={n}
										style={{
											position: 'relative',
											overflow: 'visible',
											width: 62,
											height: 62,
											border: `2px solid ${mark ? '#b91c1c' : '#78716c'}`,
											backgroundColor: mark ? 'rgba(185, 28, 28, 0.1)' : '#f3eee3',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											fontFamily: MONO,
											fontSize: 20,
											fontWeight: 800,
											color: mark ? '#991b1b' : '#292524',
										}}
									>
										<span>0{n}</span>
										<span style={{ fontSize: 12, color: mark ? '#b91c1c' : '#78716c' }}>{isLegacy ? '2003' : '2012'}</span>
										{!allMode && n === 8 && (
											<svg
												viewBox="0 0 106 98"
												width="106"
												height="98"
												style={{ position: 'absolute', left: -22, top: -18, pointerEvents: 'none', overflow: 'visible' }}
											>
												<ellipse
													cx="53"
													cy="49"
													rx="44"
													ry="38"
													fill="none"
													stroke="#b91c1c"
													strokeWidth="4.2"
													strokeLinecap="round"
													strokeDasharray="280"
													strokeDashoffset={280 * arrowDraw}
													transform="rotate(-7 53 49)"
												/>
											</svg>
										)}
									</div>
								);
							})}
							{scene.voxMode === 'all_8' && (
								<svg
									viewBox="0 0 624 108"
									width="624"
									height="108"
									style={{ position: 'absolute', left: -22, top: -23, pointerEvents: 'none', overflow: 'visible' }}
								>
									<ellipse
										cx="312"
										cy="54"
										rx="302"
										ry="46"
										fill="none"
										stroke="#b91c1c"
										strokeWidth="4.5"
										strokeLinecap="round"
										strokeDasharray="1280"
										strokeDashoffset={1280 * arrowDraw}
										transform="rotate(-1.2 312 54)"
									/>
								</svg>
							)}
							<div
								style={{
									marginLeft: 18,
									fontFamily: MONO,
									fontSize: 20,
									fontWeight: 800,
									letterSpacing: 1.5,
									color: '#b91c1c',
									opacity: noteIn,
									transform: `translateX(${interpolate(noteIn, [0, 1], [-8, 0])}px)`,
								}}
							>
								{scene.voxMode === 'all_8' ? '← 8X ROLLBACK' : '← UNPATCHED'}
							</div>
						</div>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 13. Style B: LEMMiNO / Netflix Matte Dark Archive (`archive_lemmino`) — ZERO rounded boxes, ZERO neon glow
const SceneArchiveLemmino: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.45);
	const cueReached = frame >= cue;

	const t = frame / Math.max(1, scene.duration);
	const rotY = interpolate(t, [0, 1], [-1.8, 1.8]);
	const rotX = interpolate(t, [0, 1], [1.0, -0.6]);
	const lineReveal = interpolate(frame, [6, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const faultReveal = interpolate(frame, [cue, cue + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill style={{ backgroundColor: '#07080b', opacity }}>
			<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.22} grayscale={92} hideCredit />
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/thud.wav')} volume={0.24} />
			</Sequence>

			{/* Precision corner registration ticks + subtle measurement frame */}
			<AbsoluteFill style={{ padding: '74px 90px 72px 90px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(226, 232, 240, 0.18)', paddingBottom: 18 }}>
					<div>
						<div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: '#94a3b8', marginBottom: 8 }}>
							{scene.eyebrow || 'STYLE 02  •  MINIMAL ARCHIVE SCHEMATIC'}
						</div>
						<div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: '#f1f5f9', letterSpacing: 0.4 }}>
							{scene.headline || 'Architectural Divergence Inside SMARS'}
						</div>
					</div>
					<div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: cueReached ? '#c83e37' : '#64748b' }}>
						{cueReached ? 'NODE 08  /  LEGACY ACTIVE' : 'CLUSTER SCAN  /  8 NODES'}
					</div>
				</div>

				{/* 3D tilted ultra-thin 1px schematic — zero boxes, zero glow */}
				<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1400px' }}>
					<svg
						viewBox="0 0 1560 540"
						width={1560}
						height={540}
						style={{ transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)` }}
					>
						{/* Crosshair calibration marks */}
						{[
							[24, 24],
							[1536, 24],
							[24, 516],
							[1536, 516],
						].map(([cx, cy], idx) => (
							<g key={idx} stroke="rgba(226, 232, 240, 0.35)" strokeWidth="1">
								<line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} />
								<line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} />
							</g>
						))}

						{/* Horizontal distribution spine */}
						<line
							x1="120"
							y1="230"
							x2={120 + 1320 * lineReveal}
							y2="230"
							stroke="rgba(226, 232, 240, 0.42)"
							strokeWidth="1"
						/>
						<text x="120" y="206" fill="#94a3b8" fontSize="13" fontFamily={MONO} letterSpacing="3">
							INCOMING NYSE RLP ORDER STREAM  •  FLAG BIT SET
						</text>

						{/* 8 hairline node verticals */}
						{[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
							const x = 160 + i * 176;
							const isEight = n === 8;
							const activeFault = isEight && cueReached;
							const stroke = activeFault ? '#c83e37' : 'rgba(226, 232, 240, 0.35)';
							return (
								<g key={n} opacity={lineReveal}>
									<line x1={x} y1="230" x2={x} y2="320" stroke={stroke} strokeWidth={activeFault ? '1.8' : '1'} />
									<circle cx={x} cy="230" r={activeFault ? 4.5 : 3} fill={activeFault ? '#c83e37' : '#e2e8f0'} />
									<line x1={x - 58} y1="320" x2={x + 58} y2="320" stroke={stroke} strokeWidth="1" />
									<line x1={x - 58} y1="418" x2={x + 58} y2="418" stroke={stroke} strokeWidth="1" />
									<text x={x} y="356" fill={activeFault ? '#f8fafc' : '#cbd5e1'} fontSize="22" fontFamily={MONO} textAnchor="middle">
										0{n}
									</text>
									<text x={x} y="392" fill={activeFault ? '#c83e37' : '#64748b'} fontSize="13" fontFamily={MONO} letterSpacing="1.5" textAnchor="middle">
										{isEight ? '2003 LEGACY' : '2012 PATCH'}
									</text>
								</g>
							);
						})}

						{/* Restrained vermilion fault callout under Node 08 */}
						{cueReached && (
							<g opacity={faultReveal}>
								<line x1="1392" y1="418" x2="1392" y2="472" stroke="#c83e37" strokeWidth="1.5" />
								<text x="1392" y="498" fill="#e2e8f0" fontSize="15" fontFamily={MONO} letterSpacing="2" textAnchor="end">
									POWER PEG REACTIVATED  —  NO STOP CHECK
								</text>
							</g>
						)}
					</svg>
				</div>

				<div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(226, 232, 240, 0.14)', paddingTop: 14, fontFamily: MONO, fontSize: 13, letterSpacing: 2.5, color: '#64748b' }}>
					<span>FIG. 2.1 — SMARS ORDER ROUTING TOPOLOGY</span>
					<span>SEC EXHIBIT A  •  NON-TRANSFORMED RENDER</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 14. Style C: 2.5D Multi-Layer Parallax Illustration (`parallax_noir`)
const SceneParallaxNoir: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const cue = scene.cueFrame ?? Math.floor(scene.duration * 0.45);
	const cueReached = frame >= cue;

	const t = frame / Math.max(1, scene.duration);
	const bgScale = interpolate(t, [0, 1], [1.02, 1.09]);
	const bgX = interpolate(t, [0, 1], [12, -18]);
	const fgX = interpolate(t, [0, 1], [44, -68]);
	const calloutIn = spring({ frame: Math.max(0, frame - cue), fps, config: { damping: 18 } });
	const redShift = interpolate(frame, [cue, cue + 24], [0.04, 0.24], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	const artSrc = scene.media?.src || 'docu/media/noir_explain_art.png';

	return (
		<AbsoluteFill style={{ backgroundColor: '#050609', opacity, overflow: 'hidden' }}>
			{/* Background illustration layer (slow dolly) */}
			<AbsoluteFill style={{ transform: `scale(${bgScale}) translateX(${bgX}px)` }}>
				<Img
					src={staticFile(artSrc)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'contrast(1.06) brightness(0.84)',
					}}
				/>
			</AbsoluteFill>

			{/* Dynamic atmospheric crimson spill at cueFrame */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 52% 48%, rgba(185, 28, 28, ${redShift}) 0%, rgba(5, 6, 9, 0.58) 72%)`,
					pointerEvents: 'none',
				}}
			/>

			{/* 2.5D Foreground glass-partition mullions sliding faster than background */}
			<AbsoluteFill style={{ transform: `translateX(${fgX}px)`, pointerEvents: 'none' }}>
				<div
					style={{
						position: 'absolute',
						left: 230,
						top: 0,
						bottom: 0,
						width: 34,
						background: 'linear-gradient(90deg, rgba(4,5,8,0.92), rgba(20,24,32,0.45), rgba(4,5,8,0.92))',
						filter: 'blur(2.5px)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						right: 190,
						top: 0,
						bottom: 0,
						width: 24,
						background: 'linear-gradient(90deg, rgba(4,5,8,0.88), rgba(20,24,32,0.35), rgba(4,5,8,0.88))',
						filter: 'blur(3px)',
					}}
				/>
			</AbsoluteFill>

			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/boom.wav')} volume={0.22} />
			</Sequence>

			{/* Editorial minimal title + bottom-left serif thesis anchored by a 1px vertical bar */}
			<AbsoluteFill style={{ padding: '74px 90px 84px 90px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
				<div>
					<div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: '#cbd5e1', opacity: 0.85, marginBottom: 8 }}>
						{scene.eyebrow || 'STYLE 03  •  2.5D PARALLAX ILLUSTRATION'}
					</div>
					<div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: '#f8fafc', textShadow: '0 4px 22px rgba(0,0,0,0.85)' }}>
						{scene.headline || 'Forty-Five Minutes Before Someone Pulled the Plug'}
					</div>
				</div>

				<div
					style={{
						maxWidth: 760,
						borderLeft: `2px solid ${cueReached ? '#c83e37' : '#94a3b8'}`,
						paddingLeft: 26,
						opacity: cueReached ? 0.35 + 0.65 * calloutIn : 0.72,
						transform: `translateY(${cueReached ? interpolate(calloutIn, [0, 1], [10, 0]) : 0}px)`,
					}}
				>
					<div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: cueReached ? '#fca5a5' : '#94a3b8', marginBottom: 8 }}>
						{cueReached ? '09:30 – 10:15 EDT  •  $440,000,000 ERASED' : 'JERSEY CITY DATA CENTER  •  AUG 1, 2012'}
					</div>
					<div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.4, color: '#f1f5f9', textShadow: '0 3px 16px rgba(0,0,0,0.9)' }}>
						{scene.subline || 'Four million rogue trades surged across 154 stocks before engineers located and killed the forgotten machine.'}
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 15. Closing Documentary Title Card
const SceneTitleCard: React.FC<{ scene: DocuScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const titleIn = spring({ frame: frame - 4, fps, config: { damping: 18 } });

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
			<MediaBackdrop media={scene.media} mediaList={scene.mediaList} duration={scene.duration} brightness={0.34} grayscale={35} />
			<div
				style={{
					textAlign: 'center',
					maxWidth: 1620,
					opacity: titleIn,
					transform: `scale(${0.96 + 0.04 * titleIn})`,
					zIndex: 10,
				}}
			>
				{scene.eyebrow ? (
					<div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: '#f87171', textShadow: '0 2px 12px rgba(0,0,0,0.85)', marginBottom: 22 }}>
						{scene.eyebrow}
					</div>
				) : null}
				<div style={{ fontFamily: SANS, fontSize: 114, fontWeight: 900, color: '#ffffff', letterSpacing: -2, lineHeight: 1.08, textShadow: '0 4px 28px rgba(0,0,0,0.85)' }}>
					{scene.headline}
				</div>
				{scene.subline ? (
					<div style={{ fontFamily: MONO, fontSize: 38, color: '#e2e8f0', textShadow: '0 2px 16px rgba(0,0,0,0.9)', marginTop: 26, letterSpacing: 3 }}>
						{scene.subline}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

const BeatCameraWrapper: React.FC<{ beats?: number[]; children: React.ReactNode }> = ({ beats, children }) => {
	const frame = useCurrentFrame();
	if (!beats || beats.length === 0) return <>{children}</>;
	let beatIdx = -1;
	for (let i = 0; i < beats.length; i++) {
		if (frame >= beats[i]) beatIdx = i;
	}
	let scale = 1;
	if (beatIdx >= 0) {
		const isZoomed = beatIdx % 2 === 0;
		const dt = frame - beats[beatIdx];
		scale = interpolate(dt, [0, 8], [isZoomed ? 1 : 1.05, isZoomed ? 1.05 : 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	}
	return (
		<AbsoluteFill style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: beatIdx % 2 === 0 ? '46% 44%' : '54% 48%' }}>
			{children}
		</AbsoluteFill>
	);
};

export const DocuEngine: React.FC<DocuManifest> = ({ audio, durationInFrames, scenes }) => {
	const frame = useCurrentFrame();
	let activeMood: 'tense' | 'mystery' | 'sad' | 'silence' = 'mystery';
	for (const s of scenes) {
		if (s.from <= frame && s.mood) {
			activeMood = s.mood;
		}
	}

	// Group consecutive non-silence scenes with the same mood into continuous music tracks
	const musicRuns: { from: number; duration: number; mood: string }[] = [];
	for (const s of scenes) {
		const mood = s.mood ?? 'tense';
		if (mood === 'silence') continue;
		const last = musicRuns[musicRuns.length - 1];
		if (last && last.mood === mood && last.from + last.duration >= s.from - 2) {
			last.duration = s.from + s.duration - last.from;
		} else {
			musicRuns.push({ from: s.from, duration: s.duration, mood });
		}
	}

	return (
		<AbsoluteFill style={{ backgroundColor: '#06080d' }}>
			{audio ? <Audio src={staticFile(audio)} /> : null}

			{musicRuns.map((run, i) => (
				<Sequence key={`m${i}`} from={run.from} durationInFrames={Math.max(1, run.duration)}>
					<Audio src={staticFile(`music/${run.mood}.mp3`)} loop volume={0.14} />
				</Sequence>
			))}

			{scenes.map((scene, i) => (
				<Sequence
					key={`s${i}`}
					from={scene.from}
					durationInFrames={Math.min(durationInFrames - scene.from, scene.duration + (i < scenes.length - 1 ? FADE_FRAMES : 0))}
				>
					{scene.sfx ? (
						<Sequence from={0} layout="none">
							<Audio src={staticFile(`sfx/${scene.sfx}.wav`)} volume={0.18} />
						</Sequence>
					) : null}
					<BeatCameraWrapper beats={scene.beats}>
						{scene.kind === 'hook_3s' ? (
							<SceneHook3s scene={scene} />
						) : scene.kind === 'media_hero' ? (
							<SceneMediaHero scene={scene} />
						) : scene.kind === 'big_stat' ? (
							<SceneBigStat scene={scene} />
						) : scene.kind === 'terminal' ? (
							<SceneTerminal scene={scene} />
						) : scene.kind === 'loss_chart' ? (
							<SceneLossChart scene={scene} />
						) : scene.kind === 'silence_twist' ? (
							<SceneSilenceTwist scene={scene} />
						) : scene.kind === 'document' ? (
							<SceneDocument scene={scene} />
						) : scene.kind === 'swiss_cheese' ? (
							<SceneSwissCheese scene={scene} />
						) : scene.kind === 'expected_vs_reality' ? (
							<SceneExpectedVsReality scene={scene} />
						) : scene.kind === 'flow_sim' ? (
							<SceneFlowSim scene={scene} />
						) : scene.kind === 'timeline_zoom' ? (
							<SceneTimelineZoom scene={scene} />
						) : scene.kind === 'editorial_vox' ? (
							<SceneEditorialVox scene={scene} />
						) : scene.kind === 'archive_lemmino' ? (
							<SceneArchiveLemmino scene={scene} />
						) : scene.kind === 'parallax_noir' ? (
							<SceneParallaxNoir scene={scene} />
						) : (
							<SceneTitleCard scene={scene} />
						)}
					</BeatCameraWrapper>
				</Sequence>
			))}

			<DocumentaryPolish activeMood={activeMood} />
		</AbsoluteFill>
	);
};
