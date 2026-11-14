import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon, IconName, MONEY_ICONS} from './Icons';

type BubbleIcon = {icon: IconName; label?: string; at: number};

// Gentle looping motion per prop, t = frames since it appeared.
const idle = (icon: IconName, t: number) => {
	switch (icon) {
		case 'coin':
			return `scaleX(${Math.cos(t / 6)})`; // spins on its edge
		case 'money':
			return `translateY(${-Math.abs(Math.sin(t / 7)) * 14}px)`;
		case 'chart':
			return `scaleY(${Math.min(1, t / 20)})`; // bars grow up
		case 'calendar':
			return `rotate(${Math.sin(t / 5) * 6}deg)`;
		case 'piggy':
			return `rotate(${Math.sin(t / 8) * 8}deg)`;
		case 'question':
			return `scale(${1 + Math.sin(t / 6) * 0.08})`;
		default:
			return '';
	}
};

const W = 600; // cloud size
const H = 320;
const TAIL = 80; // room on the left for the trail of small circles
const CLOUD: [number, number, number, number][] = [
	[0.5, 0.5, 0.46, 0.42],
	[0.22, 0.35, 0.2, 0.28],
	[0.78, 0.33, 0.2, 0.27],
	[0.3, 0.72, 0.22, 0.24],
	[0.72, 0.72, 0.22, 0.24],
];

// A painted picture filling the bubble ("you" imagines a place); src is relative to public/.
export type Vision = {src: string; at: number};

// Cloud-shaped thought bubble to the right of a character's head; (x, y) is the head's right edge.
// With `vision`, the cloud is filled with that picture (slow push-in) instead of icons.
export const ThoughtBubble: React.FC<{icons: BubbleIcon[]; x: number; y: number; vision?: Vision; id?: string}> = ({icons, x, y, vision, id = 'tb'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (icons.length === 0 && !vision) return null;
	const at = vision ? vision.at : icons[0].at;
	const grow = spring({frame: frame - at + 6, fps, config: {damping: 12}});
	const top = Math.max(30, y - H * 0.55);

	return (
		<div style={{position: 'absolute', left: x, top, width: W + TAIL, height: H, transform: `scale(${grow})`, transformOrigin: `0% ${((y - top) / H) * 100}%`}}>
			<svg viewBox={`0 0 ${W + TAIL} ${H}`} width={W + TAIL} height={H} style={{position: 'absolute', overflow: 'visible'}}>
				<g fill="#fffdf6" stroke="#2b2b2b" strokeWidth={5}>
					{CLOUD.map(([cx, cy, rx, ry], i) => (
						<ellipse key={i} cx={TAIL + W * cx} cy={H * cy} rx={W * rx} ry={H * ry} />
					))}
					<circle cx={TAIL - 22} cy={y - top + 4} r={16} />
					<circle cx={10} cy={y - top + 22} r={9} />
				</g>
				{/* second fill pass, slightly smaller, hides the inner outlines so the cloud reads as one shape */}
				<g fill="#fffdf6">
					{CLOUD.map(([cx, cy, rx, ry], i) => (
						<ellipse key={i} cx={TAIL + W * cx} cy={H * cy} rx={W * rx - 4} ry={H * ry - 4} />
					))}
				</g>
				{vision && (
					<>
						{/* Same inner ellipses as the fill pass, so the picture also hides the inner outlines. */}
						<clipPath id={id}>
							{CLOUD.map(([cx, cy, rx, ry], i) => (
								<ellipse key={i} cx={TAIL + W * cx} cy={H * cy} rx={W * rx - 4} ry={H * ry - 4} />
							))}
						</clipPath>
						<g clipPath={`url(#${id})`}>
							<image
								href={staticFile(vision.src)}
								x={TAIL}
								y={0}
								width={W}
								height={H}
								preserveAspectRatio="xMidYMid slice"
								style={{transform: `scale(${1 + Math.max(0, frame - at) * 0.0008})`, transformOrigin: `${TAIL + W / 2}px ${H / 2}px`}}
							/>
						</g>
					</>
				)}
			</svg>
			{vision && (
				<Sequence from={vision.at} layout="none">
					<Audio src={staticFile('sfx/pop.wav')} volume={0.35} />
				</Sequence>
			)}
			<div style={{position: 'absolute', left: TAIL + 50, right: 50, top: 30, bottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly'}}>
				{icons.map((icon, i) => {
					const t = frame - icon.at;
					const pop = spring({frame: t, fps, config: {damping: 10}});
					return (
						<div key={i} style={{textAlign: 'center', transform: `scale(${pop})`}}>
							<Sequence from={icon.at} layout="none">
								{/* Kept well under the voice: the coin chime is bright and repeats often. */}
								<Audio src={staticFile(MONEY_ICONS.includes(icon.icon) ? 'sfx/coin.wav' : 'sfx/pop.wav')} volume={MONEY_ICONS.includes(icon.icon) ? 0.2 : 0.35} />
							</Sequence>
							<div style={{transform: idle(icon.icon, Math.max(0, t)), transformOrigin: '50% 100%'}}>
								<Icon name={icon.icon} size={150} />
							</div>
							{icon.label && (
								<div style={{fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 46, color: '#2b2b2b', marginTop: -6}}>{icon.label}</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
