import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

// Deterministic pseudo-random so every render draws the same skyline.
const rand = (i: number) => {
	const x = Math.sin(i * 12.9898) * 43758.5453;
	return x - Math.floor(x);
};

const Cafe = () => (
	<>
		<defs>
			<linearGradient id="cafeWall" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#6b4330" />
				<stop offset="1" stopColor="#3a2318" />
			</linearGradient>
		</defs>
		<rect width={1920} height={1080} fill="url(#cafeWall)" />
		{[1000, 1450].map((x) => (
			<g key={x}>
				<rect x={x} y={150} width={340} height={380} rx={12} fill="#14213d" stroke="#2a160e" strokeWidth={16} />
				<circle cx={x + 250} cy={230} r={30} fill="#f4e9c1" />
				<line x1={x + 170} y1={150} x2={x + 170} y2={530} stroke="#2a160e" strokeWidth={10} />
				<line x1={x} y1={340} x2={x + 340} y2={340} stroke="#2a160e" strokeWidth={10} />
			</g>
		))}
		{[300, 720].map((x) => (
			<g key={x}>
				<circle cx={x} cy={200} r={130} fill="#ffcf6b" opacity={0.12} />
				<line x1={x} y1={0} x2={x} y2={120} stroke="#111" strokeWidth={6} />
				<path d={`M ${x - 60} 190 L ${x - 30} 120 L ${x + 30} 120 L ${x + 60} 190 Z`} fill="#1f1f1f" />
				<ellipse cx={x} cy={192} rx={40} ry={12} fill="#ffe29a" />
			</g>
		))}
		<rect x={60} y={560} width={820} height={18} fill="#2a160e" />
		{[110, 230, 350, 650, 770].map((x) => (
			<rect key={x} x={x} y={510} width={50} height={50} rx={8} fill="#e8e1d5" stroke="#2a160e" strokeWidth={6} />
		))}
		<rect y={860} width={1920} height={220} fill="#24150e" />
	</>
);

const City = () => (
	<>
		<defs>
			<linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#0b1330" />
				<stop offset="1" stopColor="#2b4878" />
			</linearGradient>
		</defs>
		<rect width={1920} height={1080} fill="url(#citySky)" />
		<circle cx={1420} cy={150} r={70} fill="#f4f1de" />
		{Array.from({length: 15}, (_, i) => {
			const w = 110 + rand(i) * 50;
			const x = i * 135 - 20;
			const h = 260 + rand(i + 50) * 420;
			const y = 860 - h;
			const rows = Math.floor((h - 40) / 50);
			return (
				<g key={i}>
					<rect x={x} y={y} width={w} height={h} fill={i % 2 ? '#152238' : '#1c2c48'} />
					{Array.from({length: rows}, (_, r) =>
						[0, 1, 2].map((c) => (
							<rect key={`${r}-${c}`} x={x + 16 + c * 32} y={y + 25 + r * 50} width={18} height={26} fill={rand(i * 100 + r * 7 + c) > 0.6 ? '#ffd56b' : '#0f1828'} />
						))
					)}
				</g>
			);
		})}
		<rect y={860} width={1920} height={220} fill="#0a0f1a" />
	</>
);

const Bank = () => (
	<>
		<defs>
			<linearGradient id="bankWall" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#1d3b4f" />
				<stop offset="1" stopColor="#10232f" />
			</linearGradient>
		</defs>
		<rect width={1920} height={1080} fill="url(#bankWall)" />
		<rect y={120} width={1920} height={40} fill="#c9d3da" />
		{[100, 760, 1140, 1520, 1880].map((x) => (
			<g key={x}>
				<rect x={x - 45} y={160} width={90} height={700} fill="#c9d3da" />
				<rect x={x - 45} y={160} width={22} height={700} fill="#e6ecef" />
				<rect x={x - 60} y={160} width={120} height={30} fill="#aab6bf" />
				<rect x={x - 60} y={830} width={120} height={30} fill="#aab6bf" />
			</g>
		))}
		{Array.from({length: 10}, (_, i) => (
			<rect key={i} x={i * 200} y={860} width={200} height={220} fill={i % 2 ? '#2c3e48' : '#344b57'} />
		))}
	</>
);

const Future = () => (
	<>
		<defs>
			<linearGradient id="futureSky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#4b2a7b" />
				<stop offset="1" stopColor="#ff9f5a" />
			</linearGradient>
		</defs>
		<rect width={1920} height={1080} fill="url(#futureSky)" />
		<circle cx={1300} cy={700} r={220} fill="#ffd166" />
		{[
			[300, 200, 90],
			[1500, 260, 120],
			[900, 140, 70],
		].map(([cx, cy, r]) => (
			<g key={cx} fill="#fff" opacity={0.85}>
				<ellipse cx={cx} cy={cy} rx={r} ry={r * 0.45} />
				<ellipse cx={cx + r * 0.6} cy={cy + 10} rx={r * 0.7} ry={r * 0.35} />
			</g>
		))}
		<path d="M0 760 Q 480 600 960 740 T 1920 700 V1080 H0 Z" fill="#2f7d5b" />
		<path d="M0 860 Q 600 780 1200 850 T 1920 840 V1080 H0 Z" fill="#1f5e43" />
	</>
);

const Office = () => (
	<>
		<rect width={1920} height={1080} fill="#dfe6ea" />
		<rect x={980} y={110} width={820} height={440} fill="#8ecae6" stroke="#5c6b73" strokeWidth={14} />
		{Array.from({length: 9}, (_, i) => {
			const h = 120 + rand(i + 7) * 200;
			return <rect key={i} x={990 + i * 92} y={550 - h} width={80} height={h} fill={i % 2 ? '#6c8ea0' : '#7fa1b3'} />;
		})}
		<line x1={1390} y1={110} x2={1390} y2={550} stroke="#5c6b73" strokeWidth={10} />
		<rect x={140} y={170} width={300} height={190} rx={8} fill="#fff" stroke="#5c6b73" strokeWidth={8} />
		<path d="M170 320 L240 270 L300 300 L410 210" fill="none" stroke="#e63946" strokeWidth={10} strokeLinecap="round" />
		{/* back desk row with monitors */}
		{[60, 1000, 1450].map((x) => (
			<g key={x}>
				<rect x={x} y={700} width={420} height={26} fill="#8d6e63" />
				<rect x={x + 30} y={726} width={18} height={134} fill="#6d4c41" />
				<rect x={x + 372} y={726} width={18} height={134} fill="#6d4c41" />
				<rect x={x + 150} y={590} width={140} height={95} rx={8} fill="#263238" stroke="#111" strokeWidth={6} />
				<rect x={x + 210} y={685} width={20} height={15} fill="#263238" />
			</g>
		))}
		<rect y={860} width={1920} height={220} fill="#9aa5ab" />
	</>
);

const Home = () => (
	<>
		<rect width={1920} height={1080} fill="#f1e3c8" />
		<rect x={1150} y={140} width={420} height={360} rx={10} fill="#bde0fe" stroke="#8d6e63" strokeWidth={16} />
		<line x1={1360} y1={140} x2={1360} y2={500} stroke="#8d6e63" strokeWidth={10} />
		<rect x={180} y={200} width={220} height={160} fill="#fff" stroke="#8d6e63" strokeWidth={10} />
		<circle cx={290} cy={280} r={45} fill="#ffb703" />
		{/* sofa */}
		<rect x={1100} y={640} width={620} height={160} rx={40} fill="#457b9d" stroke="#1d3557" strokeWidth={8} />
		<rect x={1100} y={560} width={620} height={110} rx={40} fill="#5a8fb4" stroke="#1d3557" strokeWidth={8} />
		<rect x={1120} y={800} width={24} height={60} fill="#1d3557" />
		<rect x={1676} y={800} width={24} height={60} fill="#1d3557" />
		<rect y={860} width={1920} height={220} fill="#b08968" />
		<ellipse cx={700} cy={900} rx={520} ry={40} fill="#e76f51" opacity={0.5} />
	</>
);

const Vault = () => (
	<>
		<rect width={1920} height={1080} fill="#4a5560" />
		{Array.from({length: 4}, (_, row) => (
			<g key={row}>
				<rect x={40} y={180 + row * 160} width={880} height={16} fill="#2f3840" />
				{Array.from({length: 9}, (_, c) => (
					<rect key={c} x={70 + c * 95} y={120 + row * 160} width={80} height={60} rx={6} fill={rand(row * 10 + c) > 0.25 ? '#3fae5a' : '#f5c518'} stroke="#1b4d2b" strokeWidth={4} />
				))}
			</g>
		))}
		<circle cx={1420} cy={470} r={330} fill="#8d99a6" stroke="#2f3840" strokeWidth={22} />
		<circle cx={1420} cy={470} r={250} fill="none" stroke="#6c7884" strokeWidth={14} />
		{Array.from({length: 6}, (_, i) => {
			const a = (i * Math.PI) / 3;
			return <line key={i} x1={1420} y1={470} x2={1420 + Math.cos(a) * 140} y2={470 + Math.sin(a) * 140} stroke="#2f3840" strokeWidth={18} strokeLinecap="round" />;
		})}
		<circle cx={1420} cy={470} r={50} fill="#2f3840" />
		<rect y={860} width={1920} height={220} fill="#2f3840" />
	</>
);

// Pick the place the scene's words describe; the prompt lists these names.
const BACKGROUNDS = {office: Office, home: Home, vault: Vault, bank: Bank, city: City, cafe: Cafe, future: Future};
// Any other name is a painted background, public/bg/<name>.png (listed in assets/backgrounds.json; make_video.py
// checks the file exists before rendering).
export type BgName = string;

// Camera framings: [scale, x% at shot start, x% at shot end, horizontal focus %]. Every zoom is anchored at
// the floor line (80% height) so characters, who are not zoomed, stay standing on the floor.
const FRAMINGS: [number, number, number, number][] = [
	[1.04, 0, 0, 50], // wide, slow push-in
	[1.25, 5, -5, 50], // pan to the right
	[1.4, 0, -2, 72], // close on the right side
	[1.25, -5, 5, 50], // pan to the left
	[1.35, 0, 2, 35], // close on the left side
];

// `shot` picks the framing (consecutive shots always differ); `progress` 0..1 moves the camera within the shot.
export const Background: React.FC<{name: BgName; shot?: number; progress?: number}> = ({name, shot = 0, progress = 0}) => {
	const [scale, x0, x1, focus] = FRAMINGS[shot % FRAMINGS.length];
	const s = shot % FRAMINGS.length === 0 ? 1 + (scale - 1) * progress : scale;
	const style = {transform: `translateX(${x0 + (x1 - x0) * progress}%) scale(${s})`, transformOrigin: `${focus}% 80%`};
	const Scene = BACKGROUNDS[name as keyof typeof BACKGROUNDS];
	if (!Scene) {
		return (
			<AbsoluteFill style={style}>
				<Img src={staticFile(`bg/${name}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={style}>
			<svg viewBox="0 0 1920 1080" width="100%" height="100%">
				<Scene />
			</svg>
		</AbsoluteFill>
	);
};
