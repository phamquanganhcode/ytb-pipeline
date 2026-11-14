import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Icon, IconName} from './Icons';

export type Pose = 'idle' | 'point' | 'shrug' | 'cheer' | 'handOut';
export type Expression = 'neutral' | 'happy' | 'shock';
export type Variant = 'you' | 'friend';
// [left upper, left elbow, right upper, right elbow] in degrees. Upper is measured from hanging
// straight down (positive = clockwise on screen); elbow is relative to the upper arm.
export type Arms = [number, number, number, number];

export const POSES: Record<Pose, Arms> = {
	idle: [12, -6, -12, 6],
	point: [12, -6, -90, 0],
	shrug: [45, 75, -45, -75],
	cheer: [160, 0, -160, 0],
	handOut: [12, -6, -15, -75],
};

const UPPER = 80;
const FORE = 75;
const dir = (deg: number) => {
	const r = (deg * Math.PI) / 180;
	return {x: -Math.sin(r), y: Math.cos(r)};
};

// "you": short, round, orange shirt. "friend": taller, thinner, teal shirt, red cap.
const LOOK = {
	you: {head: 115, headY: 150, body: {x: 125, w: 150}, shirt: '#e8572a'},
	friend: {head: 100, headY: 160, body: {x: 140, w: 120}, shirt: '#2a9d8f'},
};

// Drawn heads (painted channel) get a thin stick body in brown ink so the face carries the character,
// matching the painted backgrounds' outlines; the black-head characters keep their colored shirts.
const INK = {shirt: {color: '#000', width: 16}, stick: {color: '#151210', width: 9}};
const FACE_BOX = 380; // drawn head box; In Their Shoes heads are about a third of the figure's height
const STICK = {neck: 278, shoulder: 312, hip: 452};

const Arm: React.FC<{sx: number; sy: number; upper: number; elbow: number; ink: {color: string; width: number}}> = ({sx, sy, upper, elbow, ink}) => {
	const e = dir(upper);
	const ex = sx + e.x * UPPER;
	const ey = sy + e.y * UPPER;
	const f = dir(upper + elbow);
	return (
		<path
			d={`M ${sx} ${sy} L ${ex} ${ey} L ${ex + f.x * FORE} ${ey + f.y * FORE}`}
			fill="none"
			stroke={ink.color}
			strokeWidth={ink.width}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	);
};

// Shoulder points (left, right) and their height for each body style.
const shoulders = (variant: Variant, stick: boolean) => {
	const {body} = LOOK[variant];
	return stick ? {l: 200, r: 200, y: STICK.shoulder} : {l: body.x + 10, r: body.x + body.w - 10, y: 300};
};

// Head center and radius in the 400x600 viewBox. A drawn head's face sits in the upper part of its
// box (neck and collar below), estimated at 40% down the box with a radius of about 140.
// bottom: lowest point of the head, or of the collar on a drawn head.
export const headCenter = (variant: Variant, drawn: boolean) => {
	const look = LOOK[variant];
	const bottom = look.headY + look.head + (drawn ? 10 : 0);
	return drawn ? {x: 200, y: bottom - FACE_BOX * 0.6, r: 140, bottom} : {x: 200, y: look.headY, r: look.head, bottom};
};

export const handPosition =(variant: Variant, arms: Arms, stick = false) => {
	const s = shoulders(variant, stick);
	const e = dir(arms[2]);
	const f = dir(arms[2] + arms[3]);
	return {x: s.r + e.x * UPPER + f.x * FORE, y: s.y + e.y * UPPER + f.y * FORE};
};

export const StickFigure: React.FC<{
	variant: Variant;
	arms: Arms;
	expression: Expression;
	mouth: number;
	hold?: IconName | null;
	holdScale?: number;
	mirrored?: boolean; // face left, e.g. the friend turned towards "you"
	face?: string; // URL of a drawn head (public/faces) that replaces the black head, eyes and mouth
	shirt?: string;
	stick?: boolean; // thin ink body; defaults to on with a drawn head (a black head can use it too)
}> = ({variant, arms, expression, mouth, hold, holdScale = 1, mirrored = false, face, shirt, stick: stickBody}) => {
	const frame = useCurrentFrame();
	const look = {...LOOK[variant], ...(shirt ? {shirt} : {})};
	const {body} = look;
	const breathe = Math.sin(frame / 20) * 2;
	const blinking = (frame + (variant === 'friend' ? 40 : 0)) % 110 < 4;
	const eyeR = expression === 'shock' ? 30 : 22;
	const pupilR = expression === 'shock' ? 8 : 10;
	const eyeY = look.headY - 10;
	const stick = stickBody ?? Boolean(face);
	const ink = stick ? INK.stick : INK.shirt;
	const sh = shoulders(variant, stick);
	const hand = handPosition(variant, arms, stick);
	const holdSize = 110 * holdScale;
	// Leg tops: two hips on the shirt body, one hip point on the stick body.
	const hips = stick ? [200, 200] : [body.x + 45, body.x + body.w - 45];
	const hipY = stick ? STICK.hip : 445;

	return (
		<svg viewBox="0 0 400 600" width="100%" height="100%" style={{overflow: 'visible'}}>
			{/* contact shadow grounds the figure on painted floors; it does not breathe or flip */}
			<ellipse cx={200} cy={596} rx={78} ry={11} fill="rgba(0,0,0,0.22)" />
			<g transform={`translate(0 ${breathe})${mirrored ? ' translate(400 0) scale(-1 1)' : ''}`}>
				{[-1, 1].map((side, i) => {
					const footX = 200 + side * (stick ? 32 : 58);
					return (
						<g key={side}>
							<line x1={hips[i]} y1={hipY} x2={footX} y2={588} stroke={ink.color} strokeWidth={stick ? ink.width : 18} strokeLinecap="round" />
							{/* small shoe pointing the way the figure faces (right; mirrored flips it); stick bodies end in bare lines */}
							{!stick && <ellipse cx={footX + 10} cy={590} rx={19} ry={9} fill={ink.color} />}
						</g>
					);
				})}
				{stick ? (
					<line x1={200} y1={STICK.neck} x2={200} y2={STICK.hip} stroke={ink.color} strokeWidth={ink.width + 1} strokeLinecap="round" />
				) : (
					<rect x={body.x} y={265} width={body.w} height={190} rx={40} fill={look.shirt} />
				)}
				<Arm sx={sh.l} sy={sh.y} upper={arms[0]} elbow={arms[1]} ink={ink} />
				<Arm sx={sh.r} sy={sh.y} upper={arms[2]} elbow={arms[3]} ink={ink} />
				{face ? (
					// Drawn head (with neck and collar) sits on top of the stick torso; it turns with the body when mirrored.
					<image href={face} x={200 - FACE_BOX / 2} y={look.headY + look.head + 10 - FACE_BOX} width={FACE_BOX} height={FACE_BOX} preserveAspectRatio="xMidYMax meet" />
				) : (
					<>
						<circle cx={200} cy={look.headY} r={look.head} fill="#0b0b0b" stroke="#2b2b2b" strokeWidth={4} />
						{variant === 'friend' && (
							<>
								<path d={`M 105 ${look.headY - 35} A 95 95 0 0 1 295 ${look.headY - 35} Z`} fill="#d62828" stroke="#111" strokeWidth={6} />
								<path d={`M 270 ${look.headY - 38} L 345 ${look.headY - 30} L 340 ${look.headY - 18} L 268 ${look.headY - 22} Z`} fill="#a4161a" stroke="#111" strokeWidth={6} />
							</>
						)}
						{[155, 245].map((cx) =>
							expression === 'happy' ? (
								<path key={cx} d={`M ${cx - 22} ${eyeY + 5} Q ${cx} ${eyeY - 25} ${cx + 22} ${eyeY + 5}`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" />
							) : (
								<g key={cx} transform={`translate(${cx} ${eyeY}) scale(1 ${blinking ? 0.1 : 1})`}>
									<circle r={eyeR} fill="#fff" />
									<circle r={pupilR} fill="#000" cx={6} />
								</g>
							)
						)}
						{expression === 'shock' && (
							<>
								<line x1={128} y1={eyeY - 48} x2={180} y2={eyeY - 56} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
								<line x1={220} y1={eyeY - 56} x2={272} y2={eyeY - 48} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
							</>
						)}
						<ellipse cx={200} cy={look.headY + 60} rx={expression === 'happy' ? 32 : 24} ry={4 + mouth * 22} fill="#ff5d5d" />
					</>
				)}
				{hold && holdScale > 0 && (
					// Counter-flip held props so "$" and text never read backwards.
					<g transform={`${mirrored ? `translate(${2 * hand.x} 0) scale(-1 1) ` : ''}translate(${hand.x - holdSize / 2} ${hand.y - holdSize * 0.75})`}>
						<Icon name={hold} size={holdSize} />
					</g>
				)}
			</g>
		</svg>
	);
};
