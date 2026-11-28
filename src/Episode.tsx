import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { linearTiming, TransitionPresentation, TransitionSeries } from '@remotion/transitions';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { cube } from '@remotion/transitions/cube';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { iris } from '@remotion/transitions/iris';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { Background, BgName } from './Backgrounds';
import { Icon, IconName, MONEY_ICONS } from './Icons';
import { Arms, Expression, headCenter, Pose, POSES, StickFigure, Variant } from './StickFigure';
import { ThoughtBubble, Vision } from './ThoughtBubble';
import { ArrowLabel, CalloutData, Callouts, Paper, PaperData, SpeechBubble } from './Callout';
import { Weather, WeatherFx } from './Weather';
import { KineticCaptions, WordTiming } from './KineticCaptions';
import { TechnicalDiagram, DiagramProps } from './TechnicalDiagram';
import { DocumentCard, DocumentCardData } from './DocumentCard';
import { TimelineBar, TimelineEvent } from './TimelineBar';

export type IconData = { icon: IconName; word: string; label?: string; at: number };
export type SfxData = { sound: string; at: number; volume?: number };
type Face = 'left' | 'right';
type CharState = { pose: Pose; expression: Expression; hold: IconName | null; face: Face };
type Action = { who: Variant; word: string; at: number; pose?: Pose; expression?: Expression; hold?: IconName | null; face?: Face };
const STATE_KEYS = ['pose', 'expression', 'hold', 'face'];
export type MontageClip = { bg: BgName; stamp?: string; fx?: Weather; expression?: Expression };
export type SceneData = {
	kind?: 'montage';
	montageClips?: MontageClip[];
	text: string;
	words?: WordTiming[];
	start: Record<Variant, CharState>; // carried over from the previous scene by make_video.py
	actions: Action[];
	bg: BgName;
	icons: IconData[];
	callouts?: CalloutData[]; // hand-lettered labels, e.g. "HALF A MILLION VOLTS"
	title?: string; // big title card in place of icons
	stamp?: string; // place/year card top left as the scene opens, e.g. "NEW BEDFORD, 1834"
	extras?: Extra[]; // supporting characters standing right of "you" (bubble-style episodes only)
	crowd?: number; // 0-8 unnamed background people (a bank run, a trading floor)
	quote?: { who: string; text: string; at: number }; // comic speech bubble from an on-screen character
	vision?: Vision; // painted picture inside the thought bubble (bubble style), replaces icons
	empty?: boolean; // establishing shot: the place alone, no characters
	fx?: Weather; // ambient effect over the scene
	paper?: PaperData; // hand-written document that slides in, optionally with a word crossed out and rewritten
	diagram?: DiagramProps; // technical schematic / data flow / mechanical cross-section
	doc?: DocumentCardData; // archival living-document excerpt with animated highlight sweep
	looks?: Record<string, Record<Expression, string>>; // per-scene heads overriding the cast, e.g. a younger "you"
	speaker?: 'narrator' | 'friend';
	counter?: { label: string; value: string };
	transition?: 'cut' | 'time' | 'place' | null; // how this scene is entered, set by make_video.py
	audio: string;
	frames: number;
	mouth: number[]; // 0..1 per frame, written by make_video.py
	sfx?: SfxData[];
};
// captionWords: words per caption line; Vietnamese counts syllables, so it needs more per line.
// 0 turns burned-in captions off (the reference channel relies on YouTube's own CC instead).
// iconStyle: "panel" (blurred box on the right) or "bubble" (thought bubble, keeps painted backgrounds visible).
// cast: drawn heads per expression (public/faces paths, resolved by make_video.py) and shirt colors.
// Keys "you" and "friend" are the main pair; any other key is a supporting character used in `extras`.
type CastMember = { faces?: Record<Expression, string>; shirt?: string; size?: number }; // size: 0.6 for a child
type Cast = Record<string, CastMember | undefined>;
type Extra = { who: string; pose?: Pose; expression?: Expression; face?: Face; enter?: boolean };
export type EpisodeProps = {
	scenes: SceneData[];
	captionWords?: number;
	captionStyle?: 'kinetic' | 'classic' | 'none';
	showCounter?: boolean; // year/money box top right; off by default, the reference channel has none
	iconStyle?: 'panel' | 'bubble';
	cast?: Cast;
	music?: MusicTrack[] | string; // tracks from make_video.music_tracks; a plain path (older manifests) loops alone
	meta?: {
		format?: string;
		theme?: string;
		timeline?: TimelineEvent[];
	};
};

const PAD_FRAMES = 15; // matches PAD_SECONDS in make_video.py
export const TRANSITION_FRAMES = 12; // must stay below PAD_FRAMES so voices never overlap
const SHOT_FRAMES = 105; // ~3.5 s per camera framing, like the reference channel's 2.5-5 s cuts
export const shotsIn = (scene: SceneData) => Math.max(1, Math.round(scene.frames / SHOT_FRAMES));

// Same place: hard cut (no overlap). New place: rotate through these. Time jump: a clock sweep.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mixed presentation prop types in one rotation
const PLACE_PRESENTATIONS: TransitionPresentation<any>[] = [
	slide({ direction: 'from-right' }),
	iris({ width: 1920, height: 1080 }),
	wipe({ direction: 'from-left' }),
	flip({ direction: 'from-right' }),
	cube({ direction: 'from-right' }),
	fade(),
	slide({ direction: 'from-bottom' }),
];
const TIME_PRESENTATION = clockWipe({ width: 1920, height: 1080 });

// Frames this scene overlaps the previous one; scripts rendered before transitions existed count as "place".
export const overlapBefore = (scene: SceneData, i: number) => (i > 0 && scene.transition !== 'cut' ? TRANSITION_FRAMES : 0);

const FRIEND_CAPTION = '#8ff0e3';

// Where each character's 400x600 figure box sits on the 1920x1080 frame (feet on the floor line, y≈860).
type Box = { left: number; top: number; width: number; height: number };
const BOXES: Record<'friend' | 'youWithFriend' | 'youSolo', Box> = {
	friend: { left: 90, top: 275, width: 390, height: 585 },
	youWithFriend: { left: 420, top: 350, width: 340, height: 510 },
	youSolo: { left: 260, top: 230, width: 420, height: 630 },
};
// Supporting characters, same size as solo "you", standing on the right where the callout slots
// and thought bubble would be (scenes with extras use neither).
// Three or four extras: a tighter, slightly smaller row so a whole family or a board fits in frame.
const EXTRA_BOXES: Box[] = [
	{ left: 1210, top: 230, width: 420, height: 630 },
	{ left: 1510, top: 230, width: 420, height: 630 },
];
const EXTRA_BOXES_4: Box[] = [760, 1020, 1280, 1540].map((left) => ({ left, top: 290, width: 380, height: 570 }));
// Unnamed background people (crowd: n): x positions of small faceless silhouettes behind the cast.
const CROWD_X = [40, 1840, 700, 1150, 1500, 260, 950, 1700];
const headIn = (box: Box, variant: Variant, drawn: boolean) => {
	const h = headCenter(variant, drawn);
	const s = box.width / 400;
	return { x: box.left + h.x * s, y: box.top + h.y * s, r: h.r * s, bottom: box.top + h.bottom * s };
};

// Pose/face/prop for one character at this frame; arms ease from the previous pose to the new one.
const useCharacter = (scene: SceneData, who: Variant) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	let from = scene.start[who];
	let to = from;
	let since = -1000;
	let holdSince = -1000;
	for (const a of scene.actions) {
		if (a.who !== who || a.at > frame) continue;
		from = to;
		to = { ...to, ...Object.fromEntries(Object.entries(a).filter(([k]) => STATE_KEYS.includes(k))) };
		since = a.at;
		if ('hold' in a) holdSince = a.at;
	}
	const t = spring({ frame: frame - since, fps, config: { damping: 16 } });
	const a0 = POSES[from.pose];
	const a1 = POSES[to.pose];
	const arms = a0.map((v, i) => v + (a1[i] - v) * t) as Arms;
	const holdScale = spring({ frame: frame - holdSince, fps, config: { damping: 10 } });
	return { arms, expression: to.expression, hold: to.hold, holdScale, mirrored: to.face === 'left' };
};

// Background music under the voice: looped, quiet, faded in and out at the episode edges.
// One track per mood run (make_video.music_tracks); each fades in over the previous one's 2 s fade-out.
const MUSIC_VOLUME = 0.15;
export type MusicTrack = { from: number; src: string; gain?: number }; // gain: loudness match from make_video
const Music: React.FC<{ tracks: MusicTrack[] }> = ({ tracks }) => {
	const { durationInFrames, fps } = useVideoConfig();
	const fade = 2 * fps;
	return (
		<>
			{tracks.map((t, i) => {
				const last = i === tracks.length - 1;
				const end = last ? durationInFrames : Math.min(durationInFrames, tracks[i + 1].from + fade);
				const len = end - t.from;
				const tail = last ? 3 * fps : fade;
				return (
					<Sequence key={i} from={t.from} durationInFrames={len} layout="none">
						<Audio
							src={staticFile(t.src)}
							loop
							volume={(f) => MUSIC_VOLUME * (t.gain ?? 1) * interpolate(f, [0, fade, len - tail, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
						/>
					</Sequence>
				);
			})}
		</>
	);
};

export const Episode: React.FC<EpisodeProps> = ({
	scenes,
	captionWords = 4,
	captionStyle = 'kinetic',
	showCounter = false,
	iconStyle = 'panel',
	cast = {},
	music,
	meta,
}) => {
	const frame = useCurrentFrame();
	// The sidekick stays on screen for the whole episode once they speak anywhere in it.
	const hasFriend = scenes.some((s) => s.speaker === 'friend');
	const children: React.ReactNode[] = [];
	let placeCount = 0;
	let shotBase = 0;

	let start = 0;
	let currentSceneIndex = 0;
	scenes.forEach((s, i) => {
		if (start <= frame) currentSceneIndex = i;
		start += s.frames - overlapBefore(s, i);
	});

	const timeline = meta?.timeline;
	const hasTimeline = Boolean(timeline && timeline.length > 0);

	scenes.forEach((scene, i) => {
		const overlap = overlapBefore(scene, i);
		if (overlap) {
			const presentation = scene.transition === 'time' ? TIME_PRESENTATION : PLACE_PRESENTATIONS[placeCount++ % PLACE_PRESENTATIONS.length];
			children.push(
				<TransitionSeries.Transition key={`t${i}`} presentation={presentation} timing={linearTiming({ durationInFrames: overlap })} />
			);
		}
		children.push(
			<TransitionSeries.Sequence key={`s${i}`} durationInFrames={scene.frames}>
				{scene.kind === 'montage' ? (
					<MontageScene scene={scene} />
				) : (
					<Scene scene={scene} withWhoosh={overlap > 0} hasFriend={hasFriend} hasTimeline={hasTimeline} index={i} shotBase={shotBase} captionWords={captionWords} captionStyle={captionStyle} iconStyle={iconStyle} cast={cast} />
				)}
			</TransitionSeries.Sequence>
		);
		shotBase += shotsIn(scene);
	});
	return (
		<AbsoluteFill>
			<TransitionSeries>{children}</TransitionSeries>
			<CinematicOverlay />
			{music ? <Music tracks={typeof music === 'string' ? [{ from: 0, src: music }] : music} /> : null}
			{hasTimeline && <TimelineBar events={timeline!} currentSceneIndex={currentSceneIndex} totalScenes={scenes.length} />}
			{showCounter ? <Counter scenes={scenes} topOffset={hasTimeline ? 96 : 36} /> : null}
		</AbsoluteFill>
	);
};

// Subtle documentary vignette + animated film grain linking backgrounds, characters, and schematics.
const CinematicOverlay: React.FC = () => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2);
	return (
		<AbsoluteFill style={{ pointerEvents: 'none', zIndex: 15 }}>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0, 0, 0, 0.44) 100%)',
				}}
			/>
			<svg width="100%" height="100%" style={{ opacity: 0.045, mixBlendMode: 'overlay' }}>
				<filter id="filmGrain">
					<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed={seed} stitchTiles="stitch" />
				</filter>
				<rect width="100%" height="100%" filter="url(#filmGrain)" />
			</svg>
		</AbsoluteFill>
	);
};

// Lives outside the transitions so it stays fixed in the corner across scene cuts.
const Counter: React.FC<{ scenes: SceneData[]; topOffset?: number }> = ({ scenes, topOffset = 36 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	let start = 0;
	let idx = 0;
	const starts = scenes.map((s, i) => {
		start += i > 0 ? scenes[i - 1].frames - overlapBefore(s, i) : 0;
		return start;
	});
	starts.forEach((st, i) => {
		if (st <= frame) idx = i;
	});
	const counter = scenes[idx]?.counter;
	if (!counter) return null;

	const prev = idx > 0 ? scenes[idx - 1].counter : undefined;
	const changed = !prev || prev.label !== counter.label || prev.value !== counter.value;
	const pop = changed ? spring({ frame: frame - starts[idx], fps, config: { damping: 9 } }) : 1;

	return (
		<div
			style={{
				position: 'absolute',
				top: topOffset,
				right: 56,
				zIndex: 30,
				padding: '14px 28px',
				borderRadius: 18,
				background: 'rgba(0,0,0,0.6)',
				border: '3px solid #ffd23f',
				textAlign: 'right',
				fontFamily: 'Arial Black, Impact, sans-serif',
				transform: `scale(${0.85 + 0.15 * pop})`,
				transformOrigin: 'top right',
			}}
		>
			<div style={{ fontSize: 30, color: '#fff', letterSpacing: 2 }}>{counter.label}</div>
			<div style={{ fontSize: 52, color: '#ffd23f' }}>{counter.value}</div>
		</div>
	);
};

const Scene: React.FC<{
	scene: SceneData;
	withWhoosh: boolean;
	hasFriend: boolean;
	hasTimeline: boolean;
	index: number;
	shotBase: number;
	captionWords: number;
	captionStyle?: 'kinetic' | 'classic' | 'none';
	iconStyle: 'panel' | 'bubble';
	cast: Cast;
}> = ({ scene, withWhoosh, hasFriend, hasTimeline, index, shotBase, captionWords, captionStyle, iconStyle, cast }) => {
	const frame = useCurrentFrame();
	const mouth = scene.mouth[frame] ?? 0;
	const friendTalking = scene.speaker === 'friend';
	// Long scenes are cut into ~3.5 s camera framings; shotBase counts the shots of earlier scenes so
	// consecutive framings always differ, across scene cuts too.
	const shots = shotsIn(scene);
	const shotLen = scene.frames / shots;
	const k = Math.min(shots - 1, Math.floor(frame / shotLen));
	const shot = shotBase + k;
	const shotProgress = (frame - k * shotLen) / shotLen;
	// Every third shot is a medium close-up on "you" (In Their Shoes cuts to faces often): background and
	// characters zoom together around "you"'s head; overlays stay sharp and are re-anchored instead.
	// No close-up while a supporting character walks in, or the entrance happens off frame.
	const entering = k === 0 && (scene.extras ?? []).some((e) => e.enter);
	const medium = shot % 3 === 2 && !scene.title && !entering;
	// 1.35-1.4 keeps the drawn head's top and the feet (floor line y≈860) inside the frame; 1.65 cropped both.
	const zoom = medium ? 1.35 + 0.05 * shotProgress : 1;
	const extras = scene.empty ? [] : (scene.extras ?? []).slice(0, EXTRA_BOXES_4.length);
	const boxes = extras.length > EXTRA_BOXES.length ? EXTRA_BOXES_4 : EXTRA_BOXES;
	// Each extra's figure box, shrunk around the feet for small characters (children) so they stay on the floor.
	const extraBox = (i: number): Box => {
		const b = boxes[i];
		const k = cast[extras[i].who]?.size ?? 1;
		return { left: b.left + (b.width * (1 - k)) / 2, top: b.top + b.height * (1 - k), width: b.width * k, height: b.height * k };
	};
	const drawn = (who: string) => Boolean(scene.looks?.[who] ?? cast[who]?.faces);
	const crowdFaces = Object.keys(cast)
		.filter((k) => /^crowd\d+$/.test(k))
		.sort()
		.flatMap((k) => cast[k]?.faces?.neutral ?? []);
	// enter: walks in from off-screen right once the scene is fully on; x offset in px for slot i.
	const walkIn = (i: number) => {
		if (!extras[i]?.enter) return { dx: 0, walking: false };
		const p = spring({ frame: frame - (withWhoosh ? TRANSITION_FRAMES : 0), fps: 30, config: { damping: 200 }, durationInFrames: 30 });
		return { dx: (1 - p) * (1920 - boxes[i].left), walking: p < 1 };
	};
	// Head of any on-screen character in layout px (before the camera zoom); tags and bubbles follow walkers.
	const headOf = (who: string) => {
		const slot = extras.findIndex((e) => e.who === who);
		if (slot >= 0) {
			const h = headIn(extraBox(slot), 'you', drawn(who));
			return { ...h, x: h.x + walkIn(slot).dx };
		}
		if (who === 'friend') return headIn(BOXES.friend, 'friend', drawn('friend'));
		return headIn(hasFriend ? BOXES.youWithFriend : BOXES.youSolo, 'you', drawn('you'));
	};
	const quoteBy = scene.quote && extras.some((e) => e.who === scene.quote?.who) ? scene.quote.who : null;
	// Close-ups frame whoever is speaking: a supporting character with a quote, the friend on their lines, otherwise "you".
	const quoteHead = quoteBy ? headOf(quoteBy) : null;
	const focus = quoteHead
		? { x: quoteHead.x, y: quoteHead.y + 50 }
		: friendTalking
			? { x: 285, y: 430 }
			: hasFriend
				? { x: 590, y: 470 }
				: { x: 470, y: 330 };
	const toScreen = (x: number, y: number) => ({ x: focus.x + (x - focus.x) * zoom, y: focus.y + (y - focus.y) * zoom });
	// Drawn heads are wider than the round black head, so their bubble starts further right.
	const headRight = (hasFriend ? 690 : 590) + (drawn('you') ? 50 : 0);
	const bubbleAt = toScreen(headRight, hasFriend ? 420 : 320);
	const you = useCharacter(scene, 'you');
	const friend = useCharacter(scene, 'friend');
	const look = (who: string, expression: Expression) => {
		const member = cast[who];
		const face = (scene.looks?.[who] ?? member?.faces)?.[expression];
		return { face: face ? staticFile(face) : undefined, shirt: member?.shirt };
	};

	// shortcut: captions advance evenly over the speech, not per real word timing; use WhisperX timestamps if they drift.
	const words = scene.text.split(/\s+/);
	const progress = Math.min(0.999, frame / Math.max(1, scene.frames - PAD_FRAMES));
	// Two smaller caption lines, like the reference channels, instead of one big line.
	const perCaption = captionWords * 2;
	const group = perCaption ? Math.floor((progress * words.length) / perCaption) : 0;
	const caption = perCaption ? words.slice(group * perCaption, (group + 1) * perCaption).join(' ') : '';

	return (
		<AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
			<Audio src={staticFile(scene.audio)} />
			{withWhoosh && <Audio src={staticFile('sfx/whoosh.wav')} volume={0.3} />}
			{scene.sfx?.map((s, idx) => (
				<Sequence key={`sfx-${idx}`} from={s.at} layout="none">
					<Audio src={staticFile(`sfx/${s.sound}.wav`)} volume={s.volume ?? 0.35} />
				</Sequence>
			))}
			<AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${focus.x}px ${focus.y}px` }}>
				<Background name={scene.bg} shot={medium ? 0 : shot} progress={shotProgress} />
				{scene.empty
					? null
					: CROWD_X.slice(0, scene.crowd ?? 0).map((left, i) => {
						// Smaller than the cast so they read as the back of the room.
						const h = 260 + (i % 3) * 22;
						// Cast keys crowd1, crowd2... are unnamed period faces; without them, faceless ink silhouettes.
						// Faces cycle by left-to-right position, so neighbours never share a face.
						const rank = [...CROWD_X].sort((a, b) => a - b).indexOf(left);
						const crowdFace = crowdFaces.length ? crowdFaces[rank % crowdFaces.length] : null;
						if (crowdFace) {
							const fh = h; // drawn heads are big; at the silhouette's height they read as the back of the room
							// Never stand in front of solo "you" (x 260-680); faded and desaturated so the cast pops.
							if (!hasFriend && left > 160 && left < 780) return null;
							return (
								<div key={`crowd${i}`} style={{ position: 'absolute', left: left - fh / 3, top: 830 - fh, width: (fh * 2) / 3, height: fh, filter: 'saturate(0.6) brightness(0.85)' }}>
									<StickFigure variant="you" arms={POSES.idle} expression="neutral" mouth={0} mirrored={left > 960} stick face={staticFile(crowdFace)} />
								</div>
							);
						}
						const ink = '#2b2420';
						return (
							<svg key={`crowd${i}`} viewBox="0 0 100 260" width={h * 0.385} height={h} style={{ position: 'absolute', left, top: 830 - h, opacity: 0.9 }}>
								<circle cx={50} cy={34} r={22} fill={ink} />
								{i % 2 ? <rect x={30} y={4} width={40} height={20} rx={3} fill={ink} /> : <circle cx={50} cy={14} r={10} fill={ink} />}
								<path d="M22 66 Q50 54 78 66 L84 170 L16 170 Z" fill={ink} />
								<line x1={38} y1={168} x2={34} y2={256} stroke={ink} strokeWidth={9} strokeLinecap="round" />
								<line x1={62} y1={168} x2={66} y2={256} stroke={ink} strokeWidth={9} strokeLinecap="round" />
							</svg>
						);
					})}
				{scene.empty ? null : hasFriend ? (
					<>
						{/* Friend on the left, "you" nearest the icon panel so pointing is never blocked.
					    "you" is shorter; feet of both land on the floor line at y≈860. */}
						<div style={{ position: 'absolute', ...BOXES.friend }}>
							<StickFigure variant="friend" {...friend} {...look('friend', friend.expression)} mouth={friendTalking ? mouth : 0} />
						</div>
						<div style={{ position: 'absolute', ...BOXES.youWithFriend }}>
							<StickFigure variant="you" {...you} {...look('you', you.expression)} mouth={0} /* "you" never speaks; the narrator is off screen */ />
						</div>
					</>
				) : (
					<div style={{ position: 'absolute', ...BOXES.youSolo }}>
						<StickFigure variant="you" {...you} {...look('you', you.expression)} mouth={quoteBy ? 0 : mouth} />
					</div>
				)}
				{extras.map((e, i) => {
					const expression = e.expression ?? 'neutral';
					// Their mouth moves with the voice while their quote is up; they face "you" unless told otherwise.
					const talking = quoteBy === e.who && frame >= (scene.quote?.at ?? 0);
					const { dx, walking } = walkIn(i);
					const bob = walking ? -Math.abs(Math.sin(frame / 3)) * 12 : 0; // a bob per step
					return (
						<div key={e.who} style={{ position: 'absolute', ...extraBox(i), transform: `translate(${dx}px, ${bob}px)` }}>
							<StickFigure
								variant="you"
								arms={POSES[e.pose ?? 'idle']}
								expression={expression}
								mouth={talking ? mouth : 0}
								mirrored={(e.face ?? 'left') === 'left'}
								stick /* matches the painted style even before their face is drawn */
								{...look(e.who, expression)}
							/>
						</div>
					);
				})}
				{scene.fx && <WeatherFx kind={scene.fx} />}
			</AbsoluteFill>
			{scene.diagram ? (
				<TechnicalDiagram {...scene.diagram} />
			) : scene.doc ? (
				<DocumentCard {...scene.doc} />
			) : scene.title ? (
				<Title text={scene.title} />
			) : scene.empty ? null : iconStyle === 'bubble' ? (
				// Anchored at the right edge of "you"'s head (higher in the solo layout), following the camera zoom.
				<ThoughtBubble icons={scene.vision ? [] : scene.icons} vision={scene.vision} id={`vision-${index}`} x={bubbleAt.x} y={bubbleAt.y} />
			) : (
				<Icons icons={scene.icons} />
			)}
			{/* Supporting characters stand where the bubble-style slots are, so their callouts move up top. */}
			{!scene.title && <Callouts callouts={scene.callouts ?? []} iconStyle={extras.length ? 'panel' : iconStyle} />}
			{!scene.title &&
				(scene.callouts ?? [])
					.filter((c) => c.target)
					.map((c, i) => {
						const h = headOf(c.target as string);
						// Follows the camera like the thought bubble; the tag itself stays full size.
						const head = { ...toScreen(h.x, h.y), r: h.r * zoom, bottom: toScreen(h.x, h.bottom).y };
						if (head.x < 0 || head.x > 1920) return null; // out of frame in a close-up on someone else
						return <ArrowLabel key={i} callout={c} head={head} side={hasFriend && (c.target === 'you' || c.target === 'friend') ? 'above' : 'left'} />;
					})}
			{!scene.title && scene.quote && !scene.empty && (() => {
				const h = headOf(scene.quote.who);
				const head = { ...toScreen(h.x, h.y), r: h.r * zoom, bottom: toScreen(h.x, h.bottom).y };
				// Bubbles open towards the middle of the frame: right of "you"/friend, left of supporting characters.
				return <SpeechBubble quote={scene.quote} head={head} side={quoteBy ? 'left' : 'right'} />;
			})()}
			{!scene.title && scene.paper && <Paper paper={scene.paper} />}
			{scene.stamp && <Stamp text={scene.stamp} delay={withWhoosh ? TRANSITION_FRAMES : 0} topOffset={hasTimeline ? 104 : 36} />}
			{!scene.title && (captionStyle ?? 'kinetic') === 'kinetic' ? (
				<KineticCaptions
					text={scene.text}
					words={scene.words}
					frames={scene.frames}
					speaker={scene.speaker}
					padFrames={PAD_FRAMES}
					chunkSize={captionWords || 4}
					disabled={Boolean((withWhoosh && frame < TRANSITION_FRAMES) || frame >= scene.frames - PAD_FRAMES)}
				/>
			) : (captionStyle === 'classic' || (captionStyle === undefined && captionWords > 0)) ? (
				<div
					style={{
						position: 'absolute',
						left: 360,
						right: 360,
						bottom: 50,
						textAlign: 'center',
						fontFamily: 'Arial, sans-serif',
						fontWeight: 700,
						fontSize: 44,
						lineHeight: 1.25,
						color: friendTalking ? FRIEND_CAPTION : 'white',
						textShadow: '0 0 4px #000, 0 0 4px #000, 0 2px 3px #000',
					}}
				>
					{/* Hidden while a transition overlaps this scene, so two captions never mix. */}
					{scene.title || (withWhoosh && frame < TRANSITION_FRAMES) || frame >= scene.frames - PAD_FRAMES ? null : caption}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// High-energy 3.5s flash-forward montage at frame 0 using peak scenes from later in the episode.
const MontageScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
	const frame = useCurrentFrame();
	const clips: MontageClip[] = scene.montageClips?.length
		? scene.montageClips
		: [{ bg: scene.bg, stamp: scene.stamp, fx: scene.fx }];
	const clipLen = scene.frames / clips.length;
	const clipIdx = Math.min(clips.length - 1, Math.floor(frame / clipLen));
	const localF = frame - clipIdx * clipLen;
	const progress = Math.min(1, localF / Math.max(1, clipLen));
	const clip = clips[clipIdx];
	const zoom = 1.04 + 0.14 * progress;
	const flashOpacity = clipIdx > 0 && localF < 3 ? interpolate(localF, [0, 3], [0.75, 0], { extrapolateRight: 'clamp' }) : 0;

	return (
		<AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
			{scene.audio && <Audio src={staticFile(scene.audio)} />}
			{scene.sfx?.map((s, idx) => (
				<Sequence key={`msfx-${idx}`} from={s.at} layout="none">
					<Audio src={staticFile(`sfx/${s.sound}.wav`)} volume={s.volume ?? 0.32} />
				</Sequence>
			))}
			<AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: '50% 45%' }}>
				<Background name={clip.bg} shot={clipIdx} progress={progress} />
				{clip.fx && <WeatherFx kind={clip.fx} />}
			</AbsoluteFill>
			{clip.stamp && (
				<div
					style={{
						position: 'absolute',
						left: 80,
						right: 80,
						bottom: 130,
						textAlign: 'center',
						fontFamily: 'Arial Black, Impact, sans-serif',
						fontSize: 72,
						letterSpacing: 3,
						color: '#ffd23f',
						WebkitTextStroke: '10px #000',
						paintOrder: 'stroke fill',
						textShadow: '0 8px 24px rgba(0,0,0,0.85)',
						transform: `scale(${1 + 0.04 * progress})`,
					}}
				>
					{clip.stamp}
				</div>
			)}
			{flashOpacity > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flashOpacity }} />}
		</AbsoluteFill>
	);
};

const Title: React.FC<{ text: string }> = ({ text }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const pop = spring({ frame: frame - 6, fps, config: { damping: 9 } });
	return (
		<div
			style={{
				position: 'absolute',
				left: 780,
				right: 100,
				top: 240,
				fontFamily: 'Arial Black, Impact, sans-serif',
				fontSize: 112,
				lineHeight: 1.05,
				color: '#ffd23f',
				textShadow: '0 10px 0 #000, 0 0 30px rgba(0,0,0,0.6)',
				transform: `scale(${pop})`,
				transformOrigin: 'left center',
			}}
		>
			<Sequence from={6} layout="none">
				<Audio src={staticFile('sfx/coin.wav')} volume={0.25} />
			</Sequence>
			{text}
		</div>
	);
};

// Place/year card, top left, like the reference channel's "ELTHAM, 1501": pops in once the scene
// is fully on screen, holds about 3 s, then fades so it never sits over the whole scene.
const Stamp: React.FC<{ text: string; delay: number; topOffset?: number }> = ({ text, delay, topOffset = 36 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const t = frame - delay - 3;
	if (t < 0) return null;
	const pop = spring({ frame: t, fps, config: { damping: 12 } });
	const opacity = interpolate(t, [90, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return (
		<div
			style={{
				position: 'absolute',
				left: 56,
				top: topOffset,
				// One line, shrunk to stay under ~760 px: clear of the head below and the panel-style callout slots (x=820).
				whiteSpace: 'nowrap',
				fontFamily: 'Arial Black, Impact, sans-serif',
				fontSize: Math.min(64, Math.floor(900 / text.length)),
				lineHeight: 1,
				color: '#fff',
				WebkitTextStroke: '12px #111',
				paintOrder: 'stroke fill',
				textShadow: '0 6px 0 rgba(0,0,0,0.35)',
				opacity,
				transform: `scale(${0.8 + 0.2 * pop})`,
				transformOrigin: 'top left',
			}}
		>
			<Sequence from={delay} layout="none">
				<Audio src={staticFile('sfx/thud.wav')} volume={0.25} />
			</Sequence>
			{text}
		</div>
	);
};

const Icons: React.FC<{ icons: IconData[] }> = ({ icons }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	if (icons.length === 0) return null;
	// Panel fades in with the first icon so it never sits empty on screen.
	const panel = spring({ frame: frame - icons[0].at + 4, fps, config: { damping: 200 } });

	return (
		<div
			style={{
				opacity: panel,
				position: 'absolute',
				left: 800,
				top: 220,
				width: 1020,
				height: 520,
				borderRadius: 40,
				background: 'rgba(0,0,0,0.45)',
				backdropFilter: 'blur(10px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-evenly',
			}}
		>
			{icons.map((icon, i) => {
				const pop = spring({ frame: frame - icon.at, fps, config: { damping: 10 } });
				return (
					<div key={i} style={{ width: 300, textAlign: 'center', transform: `scale(${pop}) rotate(${(1 - pop) * -15}deg)` }}>
						<Sequence from={icon.at} layout="none">
							{/* Kept well under the voice: the cash chime is bright and punchy. */}
							{MONEY_ICONS.includes(icon.icon) ? (
								<Audio src={staticFile('sfx/cash.wav')} volume={0.25} />
							) : (
								<Audio src={staticFile('sfx/pop.wav')} volume={0.35} />
							)}
						</Sequence>
						<Icon name={icon.icon} />
						{icon.label && (
							<div style={{ fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 64, color: '#ffd23f', textShadow: '0 6px 0 #000' }}>
								{icon.label}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
