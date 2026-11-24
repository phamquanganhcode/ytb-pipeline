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
	sfx?: string;
	cueWord?: string;
	cueFrame?: number;
	glossary?: DocuGlossary;
	overlayMap?: 'nyse_link' | 'smars_nodes';
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
		: interpolate(frame, [0, FADE_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const fadeOut = interpolate(frame, [Math.max(0, duration - FADE_FRAMES), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

// Mood-reactive atmosphere + subtle volumetric light + 2.35:1 cinema letterbox.
const DocumentaryPolish: React.FC<{activeMood?: 'tense' | 'mystery' | 'sad' | 'silence'}> = ({
	activeMood = 'mystery',
}) => {
	const frame = useCurrentFrame();
	const pulse = (Math.sin(frame / 10) + 1) / 2;

	const vignetteAlpha =
		activeMood === 'silence' ? 0.72 : activeMood === 'sad' ? 0.40 : activeMood === 'tense' ? 0.36 : 0.32;

	return (
		<AbsoluteFill style={{pointerEvents: 'none', zIndex: 40}}>
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
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 48, backgroundColor: '#040508'}} />
			<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, backgroundColor: '#040508'}} />
		</AbsoluteFill>
	);
};

// Floating luminous dust/data particles behind dark graphic scenes for depth.
const PARTICLE_SEEDS = Array.from({length: 18}, (_, i) => ({
	x: (i * 197 + 80) % 1840 + 40,
	y: (i * 131 + 120) % 860 + 100,
	r: 1.5 + (i % 3) * 0.9,
	vx: ((i % 5) - 2) * 0.28,
	vy: -0.22 - (i % 4) * 0.12,
	phase: i * 0.7,
}));

const AmbientParticles: React.FC<{accent?: string}> = ({accent = '#38bdf8'}) => {
	const frame = useCurrentFrame();
	return (
		<svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.28}}>
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
const GlossaryCard: React.FC<{glossary?: DocuGlossary; duration: number}> = ({glossary, duration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (!glossary) return null;

	const pop = spring({frame: frame - 10, fps, config: {damping: 18}});
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
				maxWidth: 460,
				backgroundColor: 'rgba(6, 10, 18, 0.84)',
				backdropFilter: 'blur(8px)',
				borderLeft: '3px solid #38bdf8',
				borderRadius: '0 8px 8px 0',
				padding: '12px 18px',
				opacity,
				transform: `translateX(${interpolate(pop, [0, 1], [18, 0])}px)`,
				zIndex: 25,
				pointerEvents: 'none',
			}}
		>
			<div style={{fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#38bdf8', marginBottom: 4}}>
				TERM  •  {glossary.term}
			</div>
			<div style={{fontFamily: SANS, fontSize: 16, lineHeight: 1.38, color: '#e2e8f0'}}>
				{glossary.definition}
			</div>
		</div>
	);
};

// Double-Exposure Transparent Schematic Overlays (`nyse_link` | `smars_nodes`)
const DoubleExposureOverlay: React.FC<{kind?: 'nyse_link' | 'smars_nodes'}> = ({kind}) => {
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
				style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.42, zIndex: 8}}
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
				<rect x="275" y="366" width="290" height="54" rx="6" fill="rgba(6, 10, 18, 0.78)" stroke="#38bdf8" strokeWidth="1.5" />
				<text x="420" y="391" fill="#38bdf8" fontSize="14" fontFamily={MONO} textAnchor="middle" fontWeight="bold">
					JERSEY CITY DC
				</text>
				<text x="420" y="410" fill="#e2e8f0" fontSize="13" fontFamily={MONO} textAnchor="middle">
					KNIGHT SMARS ROUTER
				</text>

				<circle cx="1500" cy="340" r="10" fill="#ef4444" />
				<circle cx="1500" cy="340" r={18 + 8 * pulse} fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.55" />
				<rect x="1355" y="366" width="290" height="54" rx="6" fill="rgba(6, 10, 18, 0.78)" stroke="#ef4444" strokeWidth="1.5" />
				<text x="1500" y="391" fill="#fca5a5" fontSize="14" fontFamily={MONO} textAnchor="middle" fontWeight="bold">
					WALL STREET, NY
				</text>
				<text x="1500" y="410" fill="#e2e8f0" fontSize="13" fontFamily={MONO} textAnchor="middle">
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
			style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.40, zIndex: 8}}
		>
			{Array.from({length: 8}, (_, i) => {
				const col = i % 4;
				const row = Math.floor(i / 4);
				const x = 1120 + col * 175;
				const y = 320 + row * 120;
				const isEight = i === 7;
				return (
					<g key={i} transform={`translate(${x}, ${y})`}>
						<rect
							width="148"
							height="86"
							rx="8"
							fill="rgba(6, 10, 18, 0.72)"
							stroke={isEight ? '#f59e0b' : '#38bdf8'}
							strokeWidth={isEight ? 2.5 : 1.5}
						/>
						<text x="74" y="40" fill="#ffffff" fontSize="18" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
							SRV-0{i + 1}
						</text>
						<text x="74" y="64" fill={isEight ? '#fbbf24' : '#38bdf8'} fontSize="12" fontFamily={MONO} textAnchor="middle">
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
}> = ({media, duration, shotIndex, brightness, grayscale, fadeInFrames, hideCredit}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dur = Math.max(30, duration);
	const preset: CameraPreset = media.cameraPreset ?? (shotIndex % 2 === 0 ? 'push_in' : 'pull_out');

	let zoom = 1.0;
	let panX = 0;
	let origin = 'center center';
	if (preset === 'wide') {
		zoom = interpolate(frame, [0, dur], [1.0, 1.04], {extrapolateRight: 'clamp'});
	} else if (preset === 'push_in') {
		zoom = interpolate(frame, [0, dur], [1.0, 1.11], {extrapolateRight: 'clamp'});
	} else if (preset === 'pull_out') {
		zoom = interpolate(frame, [0, dur], [1.11, 1.0], {extrapolateRight: 'clamp'});
	} else if (preset === 'crop_left') {
		zoom = interpolate(frame, [0, dur], [1.18, 1.24], {extrapolateRight: 'clamp'});
		origin = '22% 45%';
	} else if (preset === 'crop_right') {
		zoom = interpolate(frame, [0, dur], [1.18, 1.24], {extrapolateRight: 'clamp'});
		origin = '78% 45%';
		panX = interpolate(frame, [0, dur], [-8, 8], {extrapolateRight: 'clamp'});
	} else if (preset === 'crop_detail') {
		zoom = interpolate(frame, [0, dur], [1.26, 1.36], {extrapolateRight: 'clamp'});
		origin = '52% 42%';
	}

	const fadeIn =
		fadeInFrames > 0
			? interpolate(frame, [0, fadeInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
			: 1;
	const filter = `grayscale(${grayscale}%) contrast(1.06) brightness(${brightness})`;

	return (
		<AbsoluteFill style={{opacity: fadeIn}}>
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
						fontSize: 13,
						letterSpacing: 2,
						color: 'rgba(226, 232, 240, 0.75)',
						backgroundColor: 'rgba(6, 8, 13, 0.7)',
						padding: '5px 12px',
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
}> = ({media, mediaList, duration, brightness = 0.92, grayscale = 8, hideCredit}) => {
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

const SceneHook3s: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration, true);

	const cut1End = Math.min(33, Math.floor(scene.duration * 0.31));
	const cut2End = Math.min(66, Math.floor(scene.duration * 0.63));
	const cut = frame < cut1End ? 0 : frame < cut2End ? 1 : 2;

	const localF = cut === 0 ? frame : cut === 1 ? frame - cut1End : frame - cut2End;
	const shakeAmp = Math.max(0, 5 - localF * 0.6);
	const shakeX = Math.sin(localF * 2.7) * shakeAmp;
	const shakeY = Math.cos(localF * 3.3) * shakeAmp;
	const burnDollar = Math.round(interpolate(frame, [0, cut1End], [163000, 440000000], {extrapolateRight: 'clamp'}));

	return (
		<AbsoluteFill style={{backgroundColor: '#050609', opacity, transform: `translate(${shakeX}px, ${shakeY}px)`}}>
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
						{scene.eyebrow || '09:30:01 AM EDT  •  SYSTEM FAILURE DETECTED'}
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
						{scene.subline || '163,000 DOLLARS LOST PER SECOND'}
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
					<MediaBackdrop media={scene.media} duration={scene.duration} brightness={0.26} grayscale={70} />
					<AbsoluteFill
						style={{
							background: 'radial-gradient(circle at center, rgba(6,8,13,0.4) 0%, rgba(6,8,13,0.92) 80%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div style={{fontFamily: SANS, fontSize: 132, fontWeight: 900, color: '#ffffff', letterSpacing: -3, lineHeight: 0.96}}>
							{scene.stat || '$440 MILLION'}
						</div>
						<div style={{fontFamily: SANS, fontSize: 54, fontWeight: 800, color: '#e2e8f0', marginTop: 14, letterSpacing: 2}}>
							{scene.headline || 'WIPED OUT IN 45 MINUTES'}
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

// 2. Full-bleed real video/photo with bright natural framing and compact auto-fading lower-third
const SceneMediaHero: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const tagIn = spring({frame: frame - 6, fps, config: {damping: 18}});
	const tagOut = interpolate(frame, [100, 118], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const labelOpacity = tagIn * tagOut;

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
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
					maxWidth: 820,
					backgroundColor: 'rgba(6, 8, 13, 0.62)',
					backdropFilter: 'blur(6px)',
					borderLeft: '4px solid #ef4444',
					borderRadius: '0 8px 8px 0',
					padding: '14px 24px',
					opacity: labelOpacity,
					transform: `translateY(${interpolate(tagIn, [0, 1], [14, 0])}px)`,
				}}
			>
				{scene.eyebrow ? (
					<div style={{fontFamily: MONO, fontSize: 14, letterSpacing: 2.5, color: '#cbd5e1', marginBottom: 4}}>
						{scene.eyebrow}
					</div>
				) : null}
				{scene.headline ? (
					<div style={{fontFamily: SANS, fontSize: 34, fontWeight: 800, color: '#f8fafc', letterSpacing: -0.5, lineHeight: 1.12}}>
						{scene.headline}
					</div>
				) : null}
				{scene.subline ? (
					<div style={{fontFamily: MONO, fontSize: 16, color: '#94a3b8', marginTop: 4}}>{scene.subline}</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// 3. Editorial Stat: compact bottom-left card when backed by real footage, centered hero when standalone
const SceneBigStat: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const statIn = spring({frame: frame - 4, fps, config: {damping: 16}});

	if (scene.media?.src || (scene.mediaList && scene.mediaList.length > 0)) {
		return (
			<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
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
						maxWidth: 760,
						backgroundColor: 'rgba(6, 8, 13, 0.78)',
						backdropFilter: 'blur(8px)',
						borderLeft: '4px solid #ef4444',
						borderRadius: '0 10px 10px 0',
						padding: '20px 28px',
						opacity: statIn,
						transform: `translateY(${interpolate(statIn, [0, 1], [16, 0])}px)`,
					}}
				>
					{scene.eyebrow ? (
						<div style={{fontFamily: MONO, fontSize: 14, letterSpacing: 2.5, color: '#38bdf8', marginBottom: 8}}>
							{scene.eyebrow}
						</div>
					) : null}
					<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
						<span
							style={{
								fontFamily: SANS,
								fontSize: 68,
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
								<div style={{fontFamily: SANS, fontSize: 24, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2}}>
									{scene.headline}
								</div>
							) : null}
							{scene.subline ? (
								<div style={{fontFamily: MONO, fontSize: 15, color: '#94a3b8', marginTop: 6}}>{scene.subline}</div>
							) : null}
						</div>
					</div>
				</div>
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
			<div
				style={{
					position: 'absolute',
					left: 120,
					right: 120,
					top: 260,
					opacity: statIn,
					transform: `translateY(${interpolate(statIn, [0, 1], [22, 0])}px)`,
				}}
			>
				{scene.eyebrow ? (
					<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: '#38bdf8', marginBottom: 18}}>
						{scene.eyebrow}
					</div>
				) : null}
				<div style={{display: 'flex', alignItems: 'baseline', gap: 40, flexWrap: 'wrap'}}>
					<span
						style={{
							fontFamily: SANS,
							fontSize: (scene.stat ?? '').length > 6 ? 148 : 196,
							fontWeight: 900,
							color: (scene.stat ?? '').startsWith('-') ? '#ff3b30' : '#ffffff',
							lineHeight: 0.92,
							letterSpacing: -5,
						}}
					>
						{scene.stat}
					</span>
					<div style={{maxWidth: 740}}>
						{scene.headline ? (
							<div style={{fontFamily: SANS, fontSize: 44, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.16}}>
								{scene.headline}
							</div>
						) : null}
						{scene.subline ? (
							<div style={{fontFamily: MONO, fontSize: 24, color: '#94a3b8', marginTop: 18}}>{scene.subline}</div>
						) : null}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 4. Full-screen Terminal + Optional 8-Server Cluster Grid (word-synced cueFrame for error/alert beat)
const SceneTerminal: React.FC<{scene: DocuScene}> = ({scene}) => {
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
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity}}>
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
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444'}} />
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b'}} />
						<span style={{width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e'}} />
						<span style={{fontFamily: MONO, fontSize: 16, color: '#94a3b8', marginLeft: 12}}>
							{scene.eyebrow || 'ops@jersey-city-dc: ~/smars-deploy'}
						</span>
					</div>
					<div style={{padding: '28px 32px', fontFamily: MONO, fontSize: 21, lineHeight: 1.85}}>
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
					<div style={{width: 680}}>
						<div style={{fontFamily: MONO, fontSize: 18, color: '#94a3b8', letterSpacing: 3, marginBottom: 18}}>
							{scene.headline || 'SMARS PRODUCTION CLUSTER'}
						</div>
						<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
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
											<div style={{fontFamily: SANS, fontSize: 24, fontWeight: 800, color: '#f8fafc'}}>
												{srv.label}
											</div>
											<div style={{fontFamily: MONO, fontSize: 14, color: isFail ? '#fca5a5' : '#64748b', marginTop: 4}}>
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
const SceneLossChart: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const data = scene.points && scene.points.length >= 2 ? scene.points : [{x: '09:30', y: 0}, {x: '10:15', y: -440}];
	const unit = scene.unit ?? '$M';
	const endFrame = scene.cueFrame ? Math.max(30, scene.cueFrame + 24) : Math.max(25, scene.duration * 0.72);
	const reveal = Math.min(1, frame / endFrame);
	const pulse = (Math.sin(frame / 4) + 1) / 2;

	const left = 130;
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
			<div style={{width: 1600, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', zIndex: 10}}>
				<div>
					<span style={{fontFamily: MONO, fontSize: 18, color: '#ef4444', letterSpacing: 3, display: 'block', marginBottom: 6}}>
						{scene.eyebrow || 'CUMULATIVE LOSS TRAJECTORY'}
					</span>
					<span style={{fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc', letterSpacing: -1}}>
						{scene.headline || '45 MINUTES TO INSOLVENCY'}
					</span>
				</div>
				{scene.stat ? <span style={{fontFamily: MONO, fontSize: 44, fontWeight: 800, color: '#ff3b30'}}>{scene.stat}</span> : null}
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
				<text x={left - 18} y={top + 8} fill="#94a3b8" fontSize="18" fontFamily={MONO} textAnchor="end">
					{`${maxY}${unit}`}
				</text>
				<text x={left - 18} y={bottom} fill="#f87171" fontSize="18" fontFamily={MONO} textAnchor="end">
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
const SceneSilenceTwist: React.FC<{scene: DocuScene}> = ({scene}) => {
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
			}}
		>
			{lines.slice(0, 3).map((line, i) => {
				const isLast = i === Math.min(2, lines.length - 1);
				return (
					<div
						key={i}
						style={{
							fontFamily: SANS,
							fontSize: isLast ? 88 : 60,
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
const SceneDocument: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const cardScale = interpolate(frame, [0, scene.duration], [1.0, 1.03], {extrapolateRight: 'clamp'});
	const cue = Math.max(6, scene.cueFrame ?? 14);
	const sweep = interpolate(frame, [cue, cue + 16], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const excerpt = scene.excerpt ?? '';
	const target = scene.highlight ?? '';
	const matchIdx = target ? excerpt.toLowerCase().indexOf(target.toLowerCase()) : -1;
	const before = matchIdx >= 0 ? excerpt.slice(0, matchIdx) : '';
	const matched = matchIdx >= 0 ? excerpt.slice(matchIdx, matchIdx + target.length) : excerpt;
	const after = matchIdx >= 0 ? excerpt.slice(matchIdx + target.length) : '';
	const markerBg = scene.highlightColor === 'red' ? 'rgba(239, 68, 68, 0.34)' : 'rgba(250, 204, 21, 0.78)';

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<MediaBackdrop media={scene.media} mediaList={scene.mediaList} duration={scene.duration} brightness={0.22} grayscale={70} hideCredit={Boolean(scene.glossary)} />
			<AmbientParticles accent="#fbbf24" />
			<Sequence from={cue} layout="none">
				<Audio src={staticFile('sfx/scribble.wav')} volume={0.18} />
			</Sequence>
			<div
				style={{
					width: 1240,
					backgroundColor: '#f4efe2',
					borderRadius: 10,
					padding: '54px 66px',
					boxShadow: '0 32px 80px rgba(0,0,0,0.88)',
					transform: `scale(${cardScale})`,
					position: 'relative',
					zIndex: 10,
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
					{scene.source}
					{scene.date ? `  •  ${scene.date}` : ''}
				</div>
				{scene.stamp ? (
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
						{scene.stamp}
					</div>
				) : null}
				<div style={{fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: '#0f172a', marginBottom: 22, paddingRight: 200}}>
					{scene.headline}
				</div>
				<div style={{fontFamily: SERIF, fontSize: 33, lineHeight: 1.55, color: '#1e293b'}}>
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
const SceneSwissCheese: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const opacity = useFadeEnvelope(scene.duration);
	const layers = scene.layers ?? [];
	const arrowOffset = Math.min(1320, frame * 26);
	const startX = 180;
	const stepX = Math.max(220, Math.floor(1160 / Math.max(1, layers.length)));

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d', opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
			<AmbientParticles accent="#f59e0b" />
			<div style={{width: 1560, marginBottom: 14, zIndex: 10}}>
				<div style={{fontFamily: MONO, fontSize: 18, color: '#f59e0b', letterSpacing: 3, marginBottom: 6}}>
					{scene.eyebrow || 'SYSTEMIC FAILURE ANALYSIS'}
				</div>
				<div style={{fontFamily: SANS, fontSize: 44, fontWeight: 800, color: '#f8fafc'}}>
					{scene.headline || 'THE SWISS CHEESE MODEL'}
				</div>
			</div>
			<svg viewBox="0 0 1560 640" width={1560} height={640}>
				<defs>
					<linearGradient id="docuCheese" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#f59e0b" />
						<stop offset="100%" stopColor="#b45309" />
					</linearGradient>
				</defs>
				<rect width="1560" height="640" rx="14" fill="#0b101b" stroke="#334155" strokeWidth="2" />
				{layers.map((layer, i) => {
					const x = startX + i * stepX;
					return (
						<g key={i}>
							<rect x={x} y="120" width="96" height="360" rx="14" fill="url(#docuCheese)" stroke="#fbbf24" strokeWidth="3" transform="skewY(-6)" opacity="0.92" />
							<ellipse cx={x + 48} cy={305 - x * 0.1} rx="30" ry="20" fill="#0b101b" stroke="#ff3b30" strokeWidth="3" />
							<ellipse cx={x + 48} cy={200 - x * 0.1} rx="16" ry="12" fill="#0b101b" opacity="0.6" />
							<ellipse cx={x + 48} cy={410 - x * 0.1} rx="18" ry="14" fill="#0b101b" opacity="0.6" />
							<text x={x + 48} y="555" fill="#fde68a" fontSize="18" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
								{layer.title}
							</text>
							<text x={x + 48} y="585" fill="#cbd5e1" fontSize="16" fontFamily={MONO} textAnchor="middle">
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
						<circle r="48" fill="#ff2a2a" filter="drop-shadow(0 0 22px #ff2a2a)" />
						<text y="7" fill="#ffffff" fontSize="18" fontFamily={SANS} fontWeight="bold" textAnchor="middle">
							-$440M
						</text>
					</g>
				)}
			</svg>
		</AbsoluteFill>
	);
};

// 9. Closing Documentary Title Card
const SceneTitleCard: React.FC<{scene: DocuScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = useFadeEnvelope(scene.duration);
	const titleIn = spring({frame: frame - 4, fps, config: {damping: 18}});

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
					maxWidth: 1400,
					opacity: titleIn,
					transform: `scale(${0.96 + 0.04 * titleIn})`,
					zIndex: 10,
				}}
			>
				{scene.eyebrow ? (
					<div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 5, color: '#ef4444', marginBottom: 22}}>
						{scene.eyebrow}
					</div>
				) : null}
				<div style={{fontFamily: SANS, fontSize: 82, fontWeight: 900, color: '#ffffff', letterSpacing: -2, lineHeight: 1.08}}>
					{scene.headline}
				</div>
				{scene.subline ? (
					<div style={{fontFamily: MONO, fontSize: 26, color: '#94a3b8', marginTop: 26, letterSpacing: 3}}>
						{scene.subline}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

export const DocuEngine: React.FC<DocuManifest> = ({audio, durationInFrames, scenes}) => {
	const frame = useCurrentFrame();
	let activeMood: 'tense' | 'mystery' | 'sad' | 'silence' = 'mystery';
	for (const s of scenes) {
		if (s.from <= frame && s.mood) {
			activeMood = s.mood;
		}
	}

	// Group consecutive non-silence scenes with the same mood into continuous music tracks
	const musicRuns: {from: number; duration: number; mood: string}[] = [];
	for (const s of scenes) {
		const mood = s.mood ?? 'tense';
		if (mood === 'silence') continue;
		const last = musicRuns[musicRuns.length - 1];
		if (last && last.mood === mood && last.from + last.duration >= s.from - 2) {
			last.duration = s.from + s.duration - last.from;
		} else {
			musicRuns.push({from: s.from, duration: s.duration, mood});
		}
	}

	return (
		<AbsoluteFill style={{backgroundColor: '#06080d'}}>
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
					) : (
						<SceneTitleCard scene={scene} />
					)}
				</Sequence>
			))}

			<DocumentaryPolish activeMood={activeMood} />
		</AbsoluteFill>
	);
};
