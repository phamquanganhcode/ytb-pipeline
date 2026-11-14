import React from 'react';
import {Audio, continueRender, delayRender, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Hand-lettered font (Apache 2.0, public/fonts). Rendering waits until it has loaded.
const fontHandle = delayRender('Loading marker font');
const marker = new FontFace('Marker', `url(${staticFile('fonts/PermanentMarker-Regular.ttf')})`);
marker
	.load()
	.then(() => {
		document.fonts.add(marker);
		continueRender(fontHandle);
	})
	.catch((err) => console.error('Marker font failed to load', err));

// target: label an on-screen character ("YOU, 10"; "you", "friend" or a supporting cast key) with an
// arrow pointing at their head instead of using a free slot.
export type CalloutData = {text: string; word: string; at: number; target?: string};

// Free spots, clear of the counter (top right, ends y≈130). Bubble style: right of the thought bubble
// (ends x≈1270). Panel style: above the icon panel (starts y=220) and left of the counter.
const SLOTS = {
	bubble: [
		{left: 1290, top: 190, rotate: -4, color: '#ffd23f'},
		{left: 1310, top: 330, rotate: 3, color: '#ff6b5e'},
	],
	panel: [
		{left: 820, top: 40, rotate: -3, color: '#ffd23f'},
		{left: 840, top: 125, rotate: 2, color: '#ff6b5e'},
	],
};

export type Head = {x: number; y: number; r: number; bottom: number}; // a character's head on screen, in px

// Hand-lettered name tag with a curved arrow to the character's head, written on like a marker stroke.
// side "left": tag left of the body, under the head, where the solo layout has room even in close-ups;
// "above": tag over the head (two-character layout).
export const ArrowLabel: React.FC<{callout: CalloutData; head: Head; side: 'left' | 'above'}> = ({callout, head, side}) => {
	const frame = useCurrentFrame();
	const t = frame - callout.at;
	if (t < 0) return null;
	const written = interpolate(t, [0, 14], [0, 100], {extrapolateRight: 'clamp'});
	const drawn = interpolate(t, [8, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const {x, y, r, bottom} = head;
	// The box shrinks to its text, so the left-to-right write-on starts at the first letter.
	const box =
		side === 'left'
			? {right: 1920 - (x - 40), top: bottom + 30, maxWidth: 380, textAlign: 'right' as const}
			: {left: x, bottom: 1080 - (y - r - 85), maxWidth: 500, textAlign: 'center' as const, transform: 'translateX(-50%)'};
	const start = side === 'left' ? {x: x - 80, y: bottom + 22} : {x: x - 30, y: y - r - 78};
	const tip = side === 'left' ? {x: x - r * 0.75, y: y + r * 0.55} : {x: x - r * 0.35, y: y - r - 4};
	const ctrl = side === 'left' ? {x: x - r * 0.9, y: (start.y + tip.y) / 2} : {x: x - r * 0.65, y: (start.y + tip.y) / 2};
	const path = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${tip.x} ${tip.y}`;
	// Arrowhead points along the curve's last segment (control point -> tip).
	const ang = Math.atan2(tip.y - ctrl.y, tip.x - ctrl.x);
	const wing = (a: number) => `${tip.x - 22 * Math.cos(ang + a)},${tip.y - 22 * Math.sin(ang + a)}`;
	const head3 = `M ${wing(0.5)} L ${tip.x} ${tip.y} L ${wing(-0.5)}`;
	const stroke = (color: string, width: number) => ({fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const});
	return (
		<>
			<Sequence from={callout.at} layout="none">
				<Audio src={staticFile('sfx/scribble.wav')} volume={0.35} />
			</Sequence>
			<div
				style={{
					position: 'absolute',
					...box,
					width: 'max-content',
					fontFamily: 'Marker, sans-serif',
					fontSize: 44,
					lineHeight: 1.05,
					color: '#fff',
					WebkitTextStroke: '8px #1b1b1b',
					paintOrder: 'stroke fill',
					clipPath: `inset(-20px ${100 - written}% -20px -20px)`,
				}}
			>
				{callout.text}
			</div>
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				{/* Black under white so the arrow reads on light and dark backgrounds alike. */}
				<path d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} {...stroke('#1b1b1b', 13)} />
				<path d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} {...stroke('#fff', 6)} />
				{drawn >= 1 && (
					<>
						<path d={head3} {...stroke('#1b1b1b', 13)} />
						<path d={head3} {...stroke('#fff', 6)} />
					</>
				)}
			</svg>
		</>
	);
};

// Comic speech bubble next to a speaker's head, for a documented quote ("WE ARE BOTH YOUNG.").
// side "right": bubble right of the head ("you", friend); "left": left of it (supporting characters).
export const SpeechBubble: React.FC<{quote: {text: string; at: number}; head: Head; side: 'left' | 'right'}> = ({quote, head, side}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame - quote.at;
	if (t < 0) return null;
	const pop = spring({frame: t, fps, config: {damping: 11}});
	const {x, y, r} = head;
	const top = Math.max(24, y - r * 1.05);
	const edge = side === 'right' ? x + r * 0.8 : x - r * 0.8; // bubble side nearest the head
	const dir = side === 'right' ? 1 : -1;
	// Tail base sits inside the bubble (hidden under it); only the point towards the mouth shows.
	const tail = `M ${edge + dir * 40} ${top + 60} L ${edge + dir * 110} ${top + 60} L ${x + dir * r * 0.45} ${y + r * 0.65} Z`; // tip near the mouth
	return (
		<>
			<Sequence from={quote.at} layout="none">
				<Audio src={staticFile('sfx/pop.wav')} volume={0.35} />
			</Sequence>
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: pop}}>
				<path d={tail} fill="#fff" stroke="#1b1b1b" strokeWidth={5} strokeLinejoin="round" />
			</svg>
			<div
				style={{
					position: 'absolute',
					top,
					...(side === 'right' ? {left: edge} : {right: 1920 - edge}),
					maxWidth: 520,
					width: 'max-content',
					padding: '26px 40px',
					background: '#fff',
					border: '5px solid #1b1b1b',
					borderRadius: 60,
					fontFamily: 'Arial Black, Impact, sans-serif',
					fontSize: 36,
					lineHeight: 1.15,
					color: '#111',
					textAlign: 'center',
					textTransform: 'uppercase',
					transform: `scale(${pop})`,
					transformOrigin: side === 'right' ? 'bottom left' : 'bottom right',
				}}
			>
				{quote.text}
			</div>
		</>
	);
};

// In-world document (letter, contract, newspaper, book page) that slides up between the characters,
// hand-written; `fix` crosses out one word and writes a new one over it, e.g. PRINCE -> PRINCESS.
export type PaperData = {text: string; at: number; fix?: {strike: string; write: string; at: number}};

export const Paper: React.FC<{paper: PaperData}> = ({paper}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame - paper.at;
	if (t < 0) return null;
	const rise = spring({frame: t, fps, config: {damping: 14}});
	const written = interpolate(t, [6, 24], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const fix = paper.fix;
	const ft = fix ? frame - fix.at : -1;
	const strike = interpolate(ft, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const rewrite = interpolate(ft, [8, 22], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const words = paper.text.split(/\s+/);
	const struck = fix ? words.findIndex((w) => w.replace(/[^\p{L}\p{N}]/gu, '') === fix.strike.replace(/[^\p{L}\p{N}]/gu, '')) : -1;
	return (
		<div
			style={{
				position: 'absolute',
				left: 700,
				top: 300,
				width: 500,
				minHeight: 280,
				padding: '50px 44px 80px', // room under the last line for a correction
				background: 'linear-gradient(#f6ecd2, #ead9b0)',
				border: '4px solid #6b5a3a',
				borderRadius: 6,
				boxShadow: '0 18px 30px rgba(0,0,0,0.35)',
				transform: `translateY(${(1 - rise) * 700}px) rotate(-3deg)`,
				fontFamily: 'Marker, sans-serif',
				fontSize: 50,
				lineHeight: 1.25,
				color: '#2a2118',
				textAlign: 'center',
			}}
		>
			<Sequence from={paper.at} layout="none">
				<Audio src={staticFile('sfx/whoosh.wav')} volume={0.25} />
			</Sequence>
			{fix && (
				<Sequence from={fix.at} layout="none">
					<Audio src={staticFile('sfx/scribble.wav')} volume={0.4} />
				</Sequence>
			)}
			<div style={{clipPath: `inset(-60px ${100 - written}% -120px -20px)`}}>
				{words.map((w, i) => (
					<React.Fragment key={i}>
						{i > 0 && ' '}
						<span style={{position: 'relative', display: 'inline-block'}}>
							{w}
							{i === struck && (
								<>
									{/* red pen stroke through the word, then the correction written above it */}
									<span style={{position: 'absolute', left: -6, top: '52%', height: 7, width: `calc(${strike * 100}% + 12px)`, background: '#c62828', borderRadius: 4, transform: 'rotate(-4deg)'}} />
									{/* written under the struck word: above it would collide with the previous line */}
									<span style={{position: 'absolute', left: '50%', top: '88%', transform: 'translateX(-50%) rotate(-5deg)', whiteSpace: 'nowrap', color: '#c62828', fontSize: 54, clipPath: `inset(-20px ${100 - rewrite}% -20px -20px)`}}>
										{fix?.write}
									</span>
								</>
							)}
						</span>
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

export const Callouts: React.FC<{callouts: CalloutData[]; iconStyle: 'panel' | 'bubble'}> = ({callouts, iconStyle}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const slots = SLOTS[iconStyle];
	return (
		<>
			{callouts.filter((c) => !c.target).slice(0, slots.length).map((c, i) => {
				const slot = slots[i];
				const t = frame - c.at;
				// Not written yet: the -20px left inset of the clip would still show a sliver of the first letter.
				if (t < 0) return null;
				// Write-on: reveal left to right over ~half a second, like a marker stroke.
				const written = interpolate(t, [0, 14], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
				const pop = spring({frame: t, fps, config: {damping: 12}});
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: slot.left,
							top: slot.top,
							maxWidth: 590,
							fontFamily: 'Marker, sans-serif',
							fontSize: 64,
							lineHeight: 1.05,
							color: slot.color,
							WebkitTextStroke: '10px #1b1b1b',
							paintOrder: 'stroke fill',
							textShadow: '0 6px 0 rgba(0,0,0,0.35)',
							transform: `rotate(${slot.rotate}deg) scale(${0.9 + 0.1 * pop})`,
							clipPath: `inset(-20px ${100 - written}% -20px -20px)`,
						}}
					>
						<Sequence from={c.at} layout="none">
							<Audio src={staticFile('sfx/scribble.wav')} volume={0.35} />
						</Sequence>
						{c.text}
					</div>
				);
			})}
		</>
	);
};
