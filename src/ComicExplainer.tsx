import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {
	BackdropKind,
	ChibiCharacter,
	ChibiMood,
	ChibiRole,
	ComicBackdrop,
	ComicIcon,
	ComicIconName,
	MascotHost,
	MascotPose,
	SpeechBubble,
} from './comic/ComicAssets';

export type ComicGridItem = {
	icon: ComicIconName;
	label: string;
	sublabel?: string;
	crossedOut?: boolean;
	arrowToNext?: boolean;
};

export type ComicActor = {
	role: ChibiRole;
	mood?: ChibiMood;
	label?: string;
	speech?: string;
	flipX?: boolean;
};

export type ComicScene = {
	kind:
		| 'comic_skit'
		| 'stock_cutaway'
		| 'grid_explainer'
		| 'concept_card'
		| 'source_receipt'
		| 'bullet_breakdown'
		| 'recap_cards'
		| 'mascot_commentary';
	from: number;
	duration: number;
	backdrop?: BackdropKind;
	headline?: string;
	subline?: string;
	eyebrow?: string;
	mascot?: MascotPose;
	mascotFocus?: boolean;
	actors?: ComicActor[];
	items?: ComicGridItem[];
	bullets?: string[];
	source?: string;
	articleTitle?: string;
	excerpt?: string;
	highlight?: string;
	media?: {
		type: 'image';
		src: string;
		credit?: string;
	};
	sfx?: string;
	cueFrame?: number;
};

export type ComicManifest = {
	title: string;
	brand?: string;
	fps: number;
	durationInFrames: number;
	audio: string;
	bgm?: string;
	thumbnail?: {
		brand?: string;
		headline: string;
		subline?: string;
		mascot?: MascotPose;
		mediaSrc?: string;
		heroPhotoSrc?: string;
	};
	scenes: ComicScene[];
};

const SANS = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const INK = '#141418';

const SFX_FILE: Record<string, string> = {
	pop: 'sfx/pop.wav',
	whoosh: 'sfx/whoosh.wav',
	paper: 'sfx/paper_flip.wav',
	cash: 'sfx/cash.wav',
	coin: 'sfx/coin.wav',
	thud: 'sfx/thud.wav',
	boom: 'sfx/boom.wav',
	alarm: 'sfx/alarm.wav',
	buzzer: 'sfx/buzzer.wav',
	glitch: 'sfx/glitch.wav',
};

const useSceneFade = (duration: number) => {
	const frame = useCurrentFrame();
	const fadeIn = interpolate(frame, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const fadeOut = interpolate(frame, [Math.max(0, duration - 6), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

// 1. Comic Skit (Chibi cast + Speech Bubbles + optional chart/room backdrop)
const ComicSkitScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const actors = scene.actors ?? [];
	const focusBlur = scene.mascotFocus ? interpolate(frame, [0, 12], [0, 8], {extrapolateRight: 'clamp'}) : 0;

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={scene.backdrop ?? 'candlestick_chart'} blur={focusBlur} />
			{scene.headline && (
				<div
					style={{
						position: 'absolute',
						top: 46,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 46,
						color: scene.backdrop === 'dark_grid' ? '#ffffff' : INK,
						textTransform: 'uppercase',
						letterSpacing: 1,
						filter: focusBlur > 0 ? `blur(${focusBlur}px)` : undefined,
					}}
				>
					{scene.headline}
				</div>
			)}

			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'flex-end',
					justifyContent: 'space-evenly',
					paddingBottom: 60,
					paddingLeft: 120,
					paddingRight: 120,
					filter: focusBlur > 0 ? `blur(${focusBlur}px)` : undefined,
				}}
			>
				{actors.map((act, idx) => (
					<div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
						{act.speech && (
							<SpeechBubble
								text={act.speech}
								tail="bottom"
								delay={12 + idx * 24}
								maxWidth={500}
							/>
						)}
						<ChibiCharacter
							role={act.role}
							mood={act.mood}
							label={act.label}
							size={300}
							delay={idx * 8}
							flipX={act.flipX}
						/>
					</div>
				))}
			</div>

			{scene.mascot && (
				<div style={{position: 'absolute', bottom: -18, left: scene.mascotFocus ? '50%' : 48, transform: scene.mascotFocus ? 'translateX(-50%)' : undefined}}>
					<MascotHost pose={scene.mascot} size={scene.mascotFocus ? 480 : 350} />
				</div>
			)}
		</AbsoluteFill>
	);
};

// 2. Stock Cutaway (Dramatic real photo + punchy chapter title or reaction chibi)
const StockCutawayScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const zoom = interpolate(frame, [0, Math.max(30, scene.duration)], [1.02, 1.12], {extrapolateRight: 'clamp'});
	const titlePop = spring({frame: frame - 4, fps, config: {damping: 15, stiffness: 140}});

	return (
		<AbsoluteFill style={{backgroundColor: '#090b10', overflow: 'hidden'}}>
			<Img
				src={staticFile(scene.media?.src || 'comic/art/bg_thumbnail.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${zoom})`,
					filter: 'brightness(0.55) contrast(1.15)',
				}}
			/>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.72) 100%)',
				}}
			/>

			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '0 120px',
					textAlign: 'center',
				}}
			>
				{scene.eyebrow && (
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 28,
							letterSpacing: 4,
							color: '#facc15',
							textTransform: 'uppercase',
							marginBottom: 16,
							opacity: titlePop,
						}}
					>
						{scene.eyebrow}
					</div>
				)}
				{scene.headline && (
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 92,
							fontStyle: 'italic',
							color: '#ffffff',
							textTransform: 'uppercase',
							lineHeight: 1.06,
							textShadow: '0 8px 32px rgba(0,0,0,0.85)',
							transform: `scale(${interpolate(titlePop, [0, 1], [0.88, 1])})`,
							opacity: titlePop,
						}}
					>
						{scene.headline}
					</div>
				)}
				{scene.subline && (
					<div
						style={{
							marginTop: 20,
							fontFamily: SANS,
							fontWeight: 700,
							fontSize: 34,
							color: '#e2e8f0',
							maxWidth: 1100,
							textShadow: '0 4px 16px rgba(0,0,0,0.9)',
							opacity: titlePop,
						}}
					>
						{scene.subline}
					</div>
				)}
			</AbsoluteFill>

			{scene.mascot && (
				<div style={{position: 'absolute', bottom: -22, right: 64}}>
					<MascotHost pose={scene.mascot} size={380} flipX />
				</div>
			)}

			{scene.media?.credit && (
				<div
					style={{
						position: 'absolute',
						bottom: 22,
						left: 32,
						fontFamily: SANS,
						fontSize: 18,
						fontWeight: 700,
						color: 'rgba(255,255,255,0.65)',
						letterSpacing: 1.5,
					}}
				>
					{scene.media.credit}
				</div>
			)}
		</AbsoluteFill>
	);
};

// 3. Grid Explainer (Dark Grid / Light Paper + staggered pop-in flat icons & stats)
const GridExplainerScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const isLight = scene.backdrop === 'light_paper';
	const items = scene.items ?? [];
	const stepFrames = Math.max(18, Math.floor((scene.duration * 0.65) / Math.max(1, items.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={scene.backdrop ?? 'dark_grid'} />

			{scene.headline && (
				<div
					style={{
						position: 'absolute',
						top: 72,
						left: 90,
						right: 90,
						textAlign: 'center',
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 54,
						color: isLight ? INK : '#ffffff',
						textTransform: 'uppercase',
						letterSpacing: 1,
					}}
				>
					{scene.headline}
				</div>
			)}

			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 56,
					padding: '0 100px',
					paddingBottom: scene.mascot ? 110 : 0,
				}}
			>
				{items.map((item, idx) => {
					const startAt = idx * stepFrames + 6;
					const pop = spring({frame: frame - startAt, fps, config: {damping: 12, stiffness: 170}});
					return (
						<React.Fragment key={idx}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 18,
									transform: `scale(${pop})`,
									opacity: pop,
									maxWidth: 320,
								}}
							>
								<ComicIcon name={item.icon} size={172} crossedOut={item.crossedOut} />
								<div
									style={{
										fontFamily: SANS,
										fontWeight: 900,
										fontSize: 40,
										color: isLight ? INK : '#facc15',
										textAlign: 'center',
										lineHeight: 1.12,
									}}
								>
									{item.label}
								</div>
								{item.sublabel && (
									<div
										style={{
											fontFamily: SANS,
											fontWeight: 700,
											fontSize: 24,
											color: isLight ? '#475569' : '#cbd5e1',
											textAlign: 'center',
											lineHeight: 1.25,
										}}
									>
										{item.sublabel}
									</div>
								)}
							</div>
							{item.arrowToNext && idx < items.length - 1 && (
								<div
									style={{
										fontSize: 64,
										fontWeight: 900,
										color: isLight ? INK : '#facc15',
										opacity: pop,
										transform: `translateY(-28px)`,
									}}
								>
									➜
								</div>
							)}
						</React.Fragment>
					);
				})}
			</div>

			{scene.mascot && (
				<div style={{position: 'absolute', bottom: -26, left: 68}}>
					<MascotHost pose={scene.mascot} size={360} />
				</div>
			)}
		</AbsoluteFill>
	);
};

// 4. Concept Card (Light Paper — giant term + plain-English subtitle + visual icons)
const ConceptCardScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const headPop = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 150}});
	const items = scene.items ?? [];

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={scene.backdrop ?? 'light_paper'} />
			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '60px 120px',
					gap: 24,
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 88,
						color: INK,
						letterSpacing: 2,
						textTransform: 'uppercase',
						transform: `scale(${headPop})`,
						opacity: headPop,
					}}
				>
					{scene.headline}
				</div>
				{scene.subline && (
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 800,
							fontSize: 34,
							color: '#334155',
							textTransform: 'uppercase',
							letterSpacing: 1,
							textAlign: 'center',
							opacity: headPop,
						}}
					>
						({scene.subline})
					</div>
				)}
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56, marginTop: 36}}>
					{items.map((item, idx) => {
						const pop = spring({frame: frame - (16 + idx * 16), fps, config: {damping: 12, stiffness: 160}});
						return (
							<div
								key={idx}
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 14,
									transform: `scale(${pop})`,
									opacity: pop,
								}}
							>
								<ComicIcon name={item.icon} size={170} crossedOut={item.crossedOut} />
								<div style={{fontFamily: SANS, fontWeight: 900, fontSize: 32, color: INK}}>{item.label}</div>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 5. Source Receipt (Authentic white report card + animated yellow highlighter + Mascot + SOURCE tag)
const SourceReceiptScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cardPop = spring({frame, fps, config: {damping: 16, stiffness: 130}});
	const hlStart = scene.cueFrame ?? 24;
	const hlProgress = interpolate(frame, [hlStart, hlStart + 24], [0, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const excerpt = scene.excerpt ?? '';
	const hl = scene.highlight ?? '';
	const idx = hl ? excerpt.toLowerCase().indexOf(hl.toLowerCase()) : -1;

	return (
		<AbsoluteFill>
			<ComicBackdrop kind="dark_grid" />
			<AbsoluteFill
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '60px 160px',
				}}
			>
				<div
					style={{
						width: '100%',
						maxWidth: 1360,
						backgroundColor: '#fafaf9',
						border: `5px solid ${INK}`,
						borderRadius: 16,
						padding: '54px 68px',
						boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
						transform: `translateY(${interpolate(cardPop, [0, 1], [34, 0])}px)`,
						opacity: cardPop,
						position: 'relative',
					}}
				>
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 44,
							color: '#0f172a',
							marginBottom: 24,
							borderBottom: '3px solid #e2e8f0',
							paddingBottom: 18,
						}}
					>
						{scene.articleTitle ?? scene.headline}
					</div>
					<div
						style={{
							fontFamily: "'Georgia', 'Times New Roman', serif",
							fontSize: 34,
							lineHeight: 1.58,
							color: '#1e293b',
						}}
					>
						{idx >= 0 ? (
							<>
								{excerpt.slice(0, idx)}
								<span
									style={{
										backgroundImage: `linear-gradient(120deg, #fde047 0%, #fde047 ${hlProgress}%, transparent ${hlProgress}%)`,
										padding: '2px 6px',
										borderRadius: 4,
										fontWeight: 700,
										color: '#0f172a',
									}}
								>
									{excerpt.slice(idx, idx + hl.length)}
								</span>
								{excerpt.slice(idx + hl.length)}
							</>
						) : (
							excerpt
						)}
					</div>
				</div>
			</AbsoluteFill>

			{scene.mascot && (
				<div style={{position: 'absolute', bottom: -26, left: 56}}>
					<MascotHost pose={scene.mascot} size={410} />
				</div>
			)}

			{scene.source && (
				<div
					style={{
						position: 'absolute',
						bottom: 30,
						right: 48,
						backgroundColor: '#141418',
						color: '#facc15',
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 24,
						padding: '10px 22px',
						borderRadius: 8,
						letterSpacing: 1.5,
					}}
				>
					SOURCE: {scene.source}
				</div>
			)}
		</AbsoluteFill>
	);
};

// 6. Bullet Breakdown (Mascot left + red-square staggered bullet points right — Lóng's 12:00 slide)
const BulletBreakdownScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const isLight = scene.backdrop !== 'dark_grid';
	const bullets = scene.bullets ?? [];
	const step = Math.max(16, Math.floor((scene.duration * 0.65) / Math.max(1, bullets.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={isLight ? 'light_paper' : 'dark_grid'} />

			{scene.headline && (
				<div
					style={{
						position: 'absolute',
						top: 72,
						left: 520,
						right: 90,
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 48,
						color: isLight ? INK : '#facc15',
						textTransform: 'uppercase',
					}}
				>
					{scene.headline}
				</div>
			)}

			<div
				style={{
					position: 'absolute',
					top: scene.headline ? 185 : 140,
					left: 520,
					right: 110,
					display: 'flex',
					flexDirection: 'column',
					gap: 34,
				}}
			>
				{bullets.map((b, idx) => {
					const pop = spring({frame: frame - (idx * step + 8), fps, config: {damping: 14, stiffness: 160}});
					return (
						<div
							key={idx}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 28,
								opacity: pop,
								transform: `translateX(${interpolate(pop, [0, 1], [44, 0])}px)`,
							}}
						>
							<div
								style={{
									width: 28,
									height: 28,
									minWidth: 28,
									backgroundColor: '#ef4444',
									border: `4px solid ${INK}`,
									borderRadius: 4,
								}}
							/>
							<div
								style={{
									fontFamily: SANS,
									fontWeight: 800,
									fontSize: 38,
									color: isLight ? INK : '#f8fafc',
									lineHeight: 1.25,
								}}
							>
								{b}
							</div>
						</div>
					);
				})}
			</div>

			<div style={{position: 'absolute', bottom: -20, left: 40}}>
				<MascotHost pose={scene.mascot ?? 'explaining'} size={470} />
			</div>
		</AbsoluteFill>
	);
};

// 7. Recap Cards (Dark Grid 3-column summary icons + bold captions — Lóng's 14:56–15:18 outro)
const RecapCardsScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const items = scene.items ?? [];
	const step = Math.max(22, Math.floor((scene.duration * 0.6) / Math.max(1, items.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind="dark_grid" />
			{scene.headline && (
				<div
					style={{
						position: 'absolute',
						top: 90,
						left: 0,
						right: 0,
						textAlign: 'center',
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 54,
						color: '#facc15',
						textTransform: 'uppercase',
						letterSpacing: 2,
					}}
				>
					{scene.headline}
				</div>
			)}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 88,
					padding: '60px 120px 0',
				}}
			>
				{items.map((item, idx) => {
					const pop = spring({frame: frame - (idx * step + 10), fps, config: {damping: 12, stiffness: 150}});
					return (
						<div
							key={idx}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 28,
								width: 420,
								transform: `scale(${pop})`,
								opacity: pop,
							}}
						>
							<ComicIcon name={item.icon} size={180} />
							<div
								style={{
									fontFamily: SANS,
									fontWeight: 900,
									fontSize: 34,
									color: '#ffffff',
									textAlign: 'center',
									textTransform: 'uppercase',
									lineHeight: 1.25,
								}}
							>
								{item.label}
							</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// 8. Mascot Commentary (Blurred background + Mascot center + kinetic punchline)
const MascotCommentaryScene: React.FC<{scene: ComicScene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pop = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 150}});

	return (
		<AbsoluteFill>
			{scene.media?.src ? (
				<Img
					src={staticFile(scene.media.src)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(10px) brightness(0.45)',
						transform: 'scale(1.08)',
					}}
				/>
			) : (
				<ComicBackdrop kind={scene.backdrop ?? 'dark_grid'} blur={6} />
			)}

			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingTop: 110,
				}}
			>
				{scene.headline && (
					<div
						style={{
							maxWidth: 1420,
							textAlign: 'center',
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 66,
							color: '#facc15',
							textTransform: 'uppercase',
							lineHeight: 1.15,
							textShadow: '0 8px 28px rgba(0,0,0,0.85)',
							transform: `scale(${pop})`,
							opacity: pop,
						}}
					>
						{scene.headline}
					</div>
				)}
				{scene.subline && (
					<div
						style={{
							maxWidth: 1200,
							textAlign: 'center',
							fontFamily: SANS,
							fontWeight: 700,
							fontSize: 32,
							color: '#f8fafc',
							marginTop: -40,
							opacity: pop,
						}}
					>
						{scene.subline}
					</div>
				)}
				<div style={{marginBottom: -26}}>
					<MascotHost pose={scene.mascot ?? 'deadpan'} size={500} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const SceneWrapper: React.FC<{scene: ComicScene}> = ({scene}) => {
	const opacity = useSceneFade(scene.duration);
	const sfxSrc = scene.sfx ? SFX_FILE[scene.sfx] : undefined;

	const renderBody = () => {
		switch (scene.kind) {
			case 'comic_skit':
				return <ComicSkitScene scene={scene} />;
			case 'stock_cutaway':
				return <StockCutawayScene scene={scene} />;
			case 'grid_explainer':
				return <GridExplainerScene scene={scene} />;
			case 'concept_card':
				return <ConceptCardScene scene={scene} />;
			case 'source_receipt':
				return <SourceReceiptScene scene={scene} />;
			case 'bullet_breakdown':
				return <BulletBreakdownScene scene={scene} />;
			case 'recap_cards':
				return <RecapCardsScene scene={scene} />;
			case 'mascot_commentary':
				return <MascotCommentaryScene scene={scene} />;
		}
	};

	return (
		<AbsoluteFill style={{opacity}}>
			{renderBody()}
			{sfxSrc && <Audio src={staticFile(sfxSrc)} volume={0.32} />}
		</AbsoluteFill>
	);
};

export const ComicExplainer: React.FC<ComicManifest> = ({audio, bgm, brand, scenes}) => {
	return (
		<AbsoluteFill style={{backgroundColor: '#16181d'}}>
			{scenes.map((scene, idx) => (
				<Sequence key={idx} from={scene.from} durationInFrames={scene.duration}>
					<SceneWrapper scene={scene} />
				</Sequence>
			))}

			{/* Subtle Top-Right Brand Badge (matches Lóng's clean channel identity) */}
			{brand && (
				<div
					style={{
						position: 'absolute',
						top: 26,
						right: 34,
						backgroundColor: '#facc15',
						color: INK,
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 22,
						padding: '6px 16px',
						border: `3.5px solid ${INK}`,
						borderRadius: 6,
						letterSpacing: 1.5,
						opacity: 0.9,
						zIndex: 50,
					}}
				>
					{brand}
				</div>
			)}

			{audio && <Audio src={staticFile(audio)} volume={1} />}
			{bgm && <Audio src={staticFile(bgm)} volume={0.07} loop />}
		</AbsoluteFill>
	);
};
