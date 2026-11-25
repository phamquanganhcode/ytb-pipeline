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
	MouthLevelContext,
	SpeechBubble,
} from './comic/ComicAssets';

export type ComicGridItem = {
	icon: ComicIconName;
	label: string;
	sublabel?: string;
	crossedOut?: boolean;
	arrowToNext?: boolean;
	cueFrame?: number;
};

export type ComicActor = {
	role: ChibiRole;
	mood?: ChibiMood;
	label?: string;
	speech?: string;
	flipX?: boolean;
	cueFrame?: number;
	speechCueFrame?: number;
};

export type ComicBullet = string | { text: string; cueFrame?: number };

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
	bullets?: ComicBullet[];
	source?: string;
	articleTitle?: string;
	leadParagraph?: string;
	excerpt?: string;
	trailingParagraph?: string;
	highlight?: string;
	media?: {
		type: 'image';
		src: string;
		credit?: string;
	};
	sfx?: string;
	interaction?: 'phish' | 'swap' | 'beg';
	interactionCueFrame?: number;
	cueFrame?: number;
	headlineCueFrame?: number;
	sublineCueFrame?: number;
	mascotCueFrame?: number;
};

export type ComicManifest = {
	title: string;
	brand?: string;
	fps: number;
	durationInFrames: number;
	audio: string;
	mouth?: string;
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
	const fadeIn = interpolate(frame, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [Math.max(0, duration - 5), duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return Math.min(fadeIn, fadeOut);
};

// 1. Comic Skit (Clean Lóng-style: large characters facing each other + back-and-forth speech + interaction prop)
const ComicSkitScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const actors = scene.actors ?? [];
	const focusBlur = scene.mascotFocus
		? interpolate(frame, [Math.floor(scene.duration * 0.55), Math.floor(scene.duration * 0.55) + 14], [0, 9], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		})
		: 0;

	const interactAt = scene.interactionCueFrame ?? actors[1]?.speechCueFrame ?? actors[0]?.speechCueFrame ?? 90;
	const interactProgress = spring({ frame: frame - interactAt, fps, config: { damping: 14, stiffness: 120 } });

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={scene.backdrop ?? 'candlestick_chart'} blur={focusBlur} />

			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'flex-end',
					justifyContent: 'center',
					gap: 140,
					paddingBottom: 0,
					paddingLeft: 80,
					paddingRight: 80,
					filter: focusBlur > 0 ? `blur(${focusBlur}px)` : undefined,
				}}
			>
				{actors.map((act, idx) => {
					const actorDelay = act.cueFrame ?? 0;
					const speechDelay = act.speechCueFrame ?? act.cueFrame ?? 12 + idx * 24;
					const enterSlide =
						actorDelay > 0
							? interpolate(
									spring({ frame: frame - actorDelay, fps, config: { damping: 15, stiffness: 130 } }),
									[0, 1],
									[idx === 0 ? -120 : 120, 0]
								)
							: 0;
					return (
						<div
							key={idx}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 10,
								transform: `translateX(${enterSlide}px)`,
							}}
						>
							{act.speech && (
								<SpeechBubble
									text={act.speech}
									tail="bottom"
									delay={speechDelay}
									maxWidth={500}
								/>
							)}
							<ChibiCharacter
								role={act.role}
								mood={act.mood}
								size={560}
								delay={actorDelay}
								flipX={act.flipX}
								speaking={Boolean(act.speech) && frame >= speechDelay}
							/>
						</div>
					);
				})}
			</div>

			{/* Animated Interaction Prop passing cleanly into the center gap between the 2 characters */}
			{scene.interaction && frame >= interactAt && (
				<div
					style={{
						position: 'absolute',
						bottom: 300,
						left: '50%',
						transform: `translateX(calc(-50% + ${interpolate(interactProgress, [0, 1], [-130, 0])}px)) translateY(${Math.sin(interactProgress * Math.PI) * -55}px) scale(${0.75 + 0.25 * interactProgress})`,
						opacity: interactProgress,
						zIndex: 15,
						pointerEvents: 'none',
					}}
				>
					{scene.interaction === 'phish' && (
						<div
							style={{
								backgroundColor: '#ef4444',
								color: '#ffffff',
								border: `5px solid ${INK}`,
								borderRadius: 16,
								padding: '12px 22px',
								fontFamily: SANS,
								fontWeight: 900,
								fontSize: 28,
								boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
							}}
						>
							⚠ SIGN_TX.EXE
						</div>
					)}
					{scene.interaction === 'swap' && (
						<div
							style={{
								backgroundColor: '#facc15',
								color: INK,
								border: `5px solid ${INK}`,
								borderRadius: 16,
								padding: '12px 24px',
								fontFamily: SANS,
								fontWeight: 900,
								fontSize: 28,
								boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
							}}
						>
							⌚ ROLEX → 💵 ETH
						</div>
					)}
					{scene.interaction === 'beg' && (
						<div
							style={{
								backgroundColor: '#22c55e',
								color: '#ffffff',
								border: `5px solid ${INK}`,
								borderRadius: 16,
								padding: '10px 22px',
								fontFamily: SANS,
								fontWeight: 900,
								fontSize: 30,
								boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
							}}
						>
							💵 $20 GAS?
						</div>
					)}
				</div>
			)}

			{scene.mascot && (
				<div
					style={{
						position: 'absolute',
						bottom: -14,
						left: scene.mascotFocus ? '50%' : 56,
						transform: scene.mascotFocus ? 'translateX(-50%)' : undefined,
						opacity: scene.mascotFocus
							? interpolate(frame, [Math.floor(scene.duration * 0.55), Math.floor(scene.duration * 0.55) + 12], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
							})
							: 1,
					}}
				>
					<MascotHost pose={scene.mascot} size={580} />
				</div>
			)}
		</AbsoluteFill>
	);
};

// 2. Stock Cutaway (Dramatic real photo + punchy centered italic uppercase chapter title — exact Lóng 03:34 motif)
const StockCutawayScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const zoom = interpolate(frame, [0, Math.max(30, scene.duration)], [1.02, 1.11], { extrapolateRight: 'clamp' });
	const headDelay = scene.headlineCueFrame ?? 4;
	const subDelay = scene.sublineCueFrame ?? headDelay;
	const mascotDelay = scene.mascotCueFrame ?? 0;
	const titlePop = spring({ frame: frame - headDelay, fps, config: { damping: 15, stiffness: 145 } });
	const subPop = spring({ frame: frame - subDelay, fps, config: { damping: 15, stiffness: 145 } });
	const mascotPop = spring({ frame: frame - mascotDelay, fps, config: { damping: 14, stiffness: 150 } });

	return (
		<AbsoluteFill style={{ backgroundColor: '#090b10', overflow: 'hidden' }}>
			<Img
				src={staticFile(scene.media?.src || 'comic/art/bg_thumbnail.jpg')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${zoom})`,
					filter: 'brightness(0.58) contrast(1.14)',
				}}
			/>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(circle at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.70) 100%)',
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
				{scene.headline && (
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 96,
							fontStyle: 'italic',
							color: '#ffffff',
							textTransform: 'uppercase',
							lineHeight: 1.04,
							textShadow: '0 8px 34px rgba(0,0,0,0.92)',
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
							marginTop: 16,
							fontFamily: SANS,
							fontWeight: 700,
							fontSize: 32,
							color: '#e2e8f0',
							letterSpacing: 1.5,
							textTransform: 'uppercase',
							textShadow: '0 4px 18px rgba(0,0,0,0.92)',
							transform: `scale(${interpolate(subPop, [0, 1], [0.92, 1])})`,
							opacity: subPop,
						}}
					>
						{scene.subline}
					</div>
				)}
			</AbsoluteFill>

			{scene.mascot && (
				<div style={{ position: 'absolute', bottom: -16, right: 64, opacity: mascotPop, transform: `translateY(${interpolate(mascotPop, [0, 1], [40, 0])}px)` }}>
					<MascotHost pose={scene.mascot} size={560} flipX />
				</div>
			)}

			{scene.media?.credit && (
				<div
					style={{
						position: 'absolute',
						bottom: 18,
						left: 28,
						fontFamily: SANS,
						fontWeight: 600,
						fontSize: 18,
						color: 'rgba(226, 232, 240, 0.78)',
						backgroundColor: 'rgba(0, 0, 0, 0.45)',
						padding: '4px 10px',
						borderRadius: 4,
					}}
				>
					Credit: {scene.media.credit}
				</div>
			)}
		</AbsoluteFill>
	);
};

// 3. Grid Explainer (Minimalist Lóng Dark Grid / Warm Paper + progressive left-to-right icons, dashed arrows, crisp white/dark text)
const GridExplainerScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const isLight = scene.backdrop === 'light_paper';
	const items = scene.items ?? [];
	const stepFrames = Math.max(18, Math.floor((scene.duration * 0.62) / Math.max(1, items.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={scene.backdrop ?? 'dark_grid'} />

			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 64,
					padding: '0 120px',
					paddingBottom: scene.mascot ? 140 : 0,
				}}
			>
				{items.map((item, idx) => {
					const startAt = item.cueFrame ?? idx * stepFrames + 6;
					const pop = spring({ frame: frame - startAt, fps, config: { damping: 13, stiffness: 175 } });
					const nextStart = items[idx + 1]?.cueFrame ?? (idx + 1) * stepFrames + 6;
					const arrowPop = spring({ frame: frame - nextStart, fps, config: { damping: 13, stiffness: 175 } });
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
									maxWidth: 310,
								}}
							>
								<ComicIcon name={item.icon} size={146} crossedOut={item.crossedOut} />
								<div
									style={{
										fontFamily: SANS,
										fontWeight: 900,
										fontSize: 36,
										color: isLight ? INK : '#ffffff',
										textAlign: 'center',
										lineHeight: 1.15,
										letterSpacing: 0.5,
									}}
								>
									{item.label}
								</div>
								{item.sublabel && (
									<div
										style={{
											fontFamily: SANS,
											fontWeight: 600,
											fontSize: 23,
											color: isLight ? '#475569' : '#9ca3af',
											textAlign: 'center',
											lineHeight: 1.25,
										}}
									>
										{item.sublabel}
									</div>
								)}
							</div>
							{item.arrowToNext && idx < items.length - 1 && (
								<svg width="108" height="36" viewBox="0 0 108 36" style={{ opacity: arrowPop, transform: 'translateY(-28px)' }}>
									<line
										x1="4"
										y1="18"
										x2="86"
										y2="18"
										stroke={isLight ? INK : '#e5e7eb'}
										strokeWidth="4.5"
										strokeDasharray="10 8"
									/>
									<polygon points="84,8 104,18 84,28" fill={isLight ? INK : '#e5e7eb'} />
								</svg>
							)}
						</React.Fragment>
					);
				})}
			</div>

			{scene.mascot && (
				<div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)' }}>
					<MascotHost pose={scene.mascot} size={520} />
				</div>
			)}
		</AbsoluteFill>
	);
};

// 4. Concept Card (Exact Lóng 07:58: Warm Light Paper + bold uppercase term + parenthetical plain-English subtitle + row of icons)
const ConceptCardScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const headPop = spring({ frame: frame - (scene.headlineCueFrame ?? 4), fps, config: { damping: 14, stiffness: 155 } });
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
					gap: 14,
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 84,
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
							fontWeight: 700,
							fontSize: 30,
							color: '#374151',
							textTransform: 'uppercase',
							letterSpacing: 1,
							textAlign: 'center',
							opacity: headPop,
						}}
					>
						({scene.subline})
					</div>
				)}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 72, marginTop: 48 }}>
					{items.map((item, idx) => {
						const startAt = item.cueFrame ?? 16 + idx * 16;
						const pop = spring({ frame: frame - startAt, fps, config: { damping: 12, stiffness: 165 } });
						return (
							<div
								key={idx}
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 16,
									transform: `scale(${pop})`,
									opacity: pop,
								}}
							>
								<ComicIcon name={item.icon} size={172} crossedOut={item.crossedOut} />
								<div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK }}>{item.label}</div>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// 5. Source Receipt (Exact Lóng 06:52 & 10:10: FULL-SCREEN off-white editorial webpage + dense context paragraphs + yellow marker sweep + bottom-right SOURCE + Host foreground)
const SourceReceiptScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const hlStart = scene.cueFrame ?? 22;
	const hlProgress = interpolate(frame, [hlStart, hlStart + 28], [0, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const excerpt = scene.excerpt ?? '';
	const hl = scene.highlight ?? '';
	const idx = hl ? excerpt.toLowerCase().indexOf(hl.toLowerCase()) : -1;

	return (
		<AbsoluteFill style={{ backgroundColor: '#f7f7f5' }}>
			<div
				style={{
					position: 'absolute',
					top: 64,
					left: 240,
					right: 220,
					display: 'flex',
					flexDirection: 'column',
					gap: 26,
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 800,
						fontSize: 44,
						color: '#111827',
						lineHeight: 1.2,
						letterSpacing: -0.5,
					}}
				>
					{scene.articleTitle ?? scene.headline}
				</div>

				{scene.leadParagraph && (
					<div
						style={{
							fontFamily: SANS,
							fontSize: 25,
							lineHeight: 1.55,
							color: '#4b5563',
						}}
					>
						{scene.leadParagraph}
					</div>
				)}

				<div
					style={{
						fontFamily: SANS,
						fontSize: 28,
						lineHeight: 1.62,
						color: '#1f2937',
					}}
				>
					{idx >= 0 ? (
						<>
							{excerpt.slice(0, idx)}
							<span
								style={{
									backgroundImage: `linear-gradient(120deg, #fde047 0%, #fde047 ${hlProgress}%, transparent ${hlProgress}%)`,
									padding: '3px 6px',
									borderRadius: 3,
									fontWeight: 700,
									color: '#111827',
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

				{scene.trailingParagraph && (
					<div
						style={{
							fontFamily: SANS,
							fontSize: 24,
							lineHeight: 1.55,
							color: '#6b7280',
						}}
					>
						{scene.trailingParagraph}
					</div>
				)}
			</div>

			{scene.mascot && (
				<div style={{ position: 'absolute', bottom: -18, left: 96 }}>
					<MascotHost pose={scene.mascot} size={580} />
				</div>
			)}

			{scene.source && (
				<div
					style={{
						position: 'absolute',
						bottom: 28,
						right: 44,
						color: '#111827',
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 24,
						letterSpacing: 1.2,
						textTransform: 'uppercase',
					}}
				>
					SOURCE: {scene.source}
				</div>
			)}
		</AbsoluteFill>
	);
};

// 6. Bullet Breakdown (Exact Lóng 12:00: Warm Paper + Host bottom-left + staggered red square bullets right)
const BulletBreakdownScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const isLight = scene.backdrop !== 'dark_grid';
	const bullets = scene.bullets ?? [];
	const step = Math.max(16, Math.floor((scene.duration * 0.62) / Math.max(1, bullets.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind={isLight ? 'light_paper' : 'dark_grid'} />

			<div
				style={{
					position: 'absolute',
					top: 170,
					left: 620,
					right: 120,
					display: 'flex',
					flexDirection: 'column',
					gap: 42,
				}}
			>
				{bullets.map((b, idx) => {
					const text = typeof b === 'string' ? b : b.text;
					const startAt = (typeof b === 'string' ? undefined : b.cueFrame) ?? idx * step + 8;
					const pop = spring({ frame: frame - startAt, fps, config: { damping: 14, stiffness: 165 } });
					return (
						<div
							key={idx}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 32,
								opacity: pop,
								transform: `translateX(${interpolate(pop, [0, 1], [40, 0])}px)`,
							}}
						>
							<div
								style={{
									width: 26,
									height: 26,
									minWidth: 26,
									backgroundColor: '#ef4444',
									borderRadius: 2,
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
								{text}
							</div>
						</div>
					);
				})}
			</div>

			<div style={{ position: 'absolute', bottom: -18, left: 56 }}>
				<MascotHost pose={scene.mascot ?? 'pointing'} size={600} />
			</div>
		</AbsoluteFill>
	);
};

// 7. Recap Cards (Exact Lóng 14:56-15:18: Clean Dark Grid + 3 icons popping in left-to-right with crisp white uppercase text)
const RecapCardsScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const items = scene.items ?? [];
	const step = Math.max(22, Math.floor((scene.duration * 0.58) / Math.max(1, items.length)));

	return (
		<AbsoluteFill>
			<ComicBackdrop kind="dark_grid" />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 110,
					padding: '0 140px',
				}}
			>
				{items.map((item, idx) => {
					const startAt = item.cueFrame ?? idx * step + 10;
					const pop = spring({ frame: frame - startAt, fps, config: { damping: 13, stiffness: 155 } });
					return (
						<div
							key={idx}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 28,
								width: 390,
								transform: `scale(${pop})`,
								opacity: pop,
							}}
						>
							<ComicIcon name={item.icon} size={156} />
							<div
								style={{
									fontFamily: SANS,
									fontWeight: 800,
									fontSize: 30,
									color: '#f3f4f6',
									textAlign: 'center',
									textTransform: 'uppercase',
									lineHeight: 1.3,
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

// 8. Mascot Commentary (Exact Lóng 00:33 / 09:26 / 12:22: Blurred full-bleed background + big expressive Host centered at bottom edge)
const MascotCommentaryScene: React.FC<{ scene: ComicScene }> = ({ scene }) => {
	return (
		<AbsoluteFill>
			{scene.media?.src ? (
				<Img
					src={staticFile(scene.media.src)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(9px) brightness(0.62)',
						transform: 'scale(1.06)',
					}}
				/>
			) : (
				<ComicBackdrop kind={scene.backdrop ?? 'hacker_room'} blur={8} />
			)}

			<div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)' }}>
				<MascotHost pose={scene.mascot ?? 'deadpan'} size={660} />
			</div>
		</AbsoluteFill>
	);
};

const SceneWrapper: React.FC<{ scene: ComicScene; mouth?: string }> = ({ scene, mouth }) => {
	const localFrame = useCurrentFrame();
	const opacity = useSceneFade(scene.duration);
	const sfxSrc = scene.sfx ? SFX_FILE[scene.sfx] : undefined;
	const globalFrame = scene.from + localFrame;
	const mouthLevel = mouth && globalFrame >= 0 && globalFrame < mouth.length ? Number(mouth[globalFrame]) || 0 : 0;

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
		<MouthLevelContext.Provider value={mouthLevel}>
			<AbsoluteFill style={{ opacity }}>
				{renderBody()}
				{sfxSrc && <Audio src={staticFile(sfxSrc)} volume={0.28} />}
			</AbsoluteFill>
		</MouthLevelContext.Provider>
	);
};

export const ComicExplainer: React.FC<ComicManifest> = ({ audio, mouth, bgm, scenes }) => {
	return (
		<AbsoluteFill style={{ backgroundColor: '#1d1f23' }}>
			{scenes.map((scene, idx) => (
				<Sequence key={idx} from={scene.from} durationInFrames={scene.duration}>
					<SceneWrapper scene={scene} mouth={mouth} />
				</Sequence>
			))}

			{audio && <Audio src={staticFile(audio)} volume={1} />}
			{bgm && <Audio src={staticFile(bgm)} volume={0.055} loop />}
		</AbsoluteFill>
	);
};
