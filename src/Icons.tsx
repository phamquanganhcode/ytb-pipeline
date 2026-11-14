import React from 'react';

// Flat cartoon props, 200x200 viewBox, dark outline to match the stick figure.
const O = {stroke: '#111', strokeWidth: 8, strokeLinejoin: 'round' as const};

const ICONS = {
	coffee: (
		<>
			<ellipse cx={95} cy={178} rx={80} ry={12} fill="#ddd" {...O} strokeWidth={6} />
			<path d="M40 70 H150 V140 a30 30 0 0 1 -30 30 H70 a30 30 0 0 1 -30 -30 Z" fill="#fff" {...O} />
			<path d="M150 88 a26 26 0 0 1 0 48" fill="none" {...O} strokeWidth={10} />
			<ellipse cx={95} cy={72} rx={52} ry={9} fill="#6f4426" />
			{[75, 115].map((x) => (
				<path key={x} d={`M${x} 52 q-10 -14 0 -26 q10 -12 0 -24`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
			))}
		</>
	),
	coin: (
		<>
			<circle cx={100} cy={100} r={80} fill="#f5c518" {...O} />
			<circle cx={100} cy={100} r={58} fill="none" stroke="#d19e00" strokeWidth={6} />
			<text x={100} y={132} fontSize={92} fontWeight={900} textAnchor="middle" fill="#a87400" fontFamily="Arial Black, sans-serif">$</text>
		</>
	),
	money: (
		<>
			{[30, 15, 0].map((o) => (
				<g key={o}>
					<rect x={20} y={55 + o} width={160} height={90} rx={10} fill="#3fae5a" {...O} strokeWidth={6} />
					<circle cx={100} cy={100 + o} r={24} fill="#2e8b47" />
					<text x={100} y={115 + o} fontSize={40} fontWeight={900} textAnchor="middle" fill="#bff0c9" fontFamily="Arial Black, sans-serif">$</text>
				</g>
			))}
		</>
	),
	calendar: (
		<>
			<rect x={30} y={40} width={140} height={130} rx={14} fill="#fff" {...O} />
			<path d="M30 54 a14 14 0 0 1 14 -14 H156 a14 14 0 0 1 14 14 V75 H30 Z" fill="#e63946" {...O} />
			{[65, 135].map((x) => (
				<line key={x} x1={x} y1={24} x2={x} y2={56} stroke="#111" strokeWidth={10} strokeLinecap="round" />
			))}
			{[0, 1, 2].flatMap((r) =>
				[0, 1, 2].map((c) => <rect key={`${r}${c}`} x={50 + c * 38} y={90 + r * 26} width={24} height={16} rx={3} fill={r === 1 && c === 1 ? '#e63946' : '#cfcfcf'} />)
			)}
		</>
	),
	piggy: (
		<>
			{[60, 122].map((x) => (
				<rect key={x} x={x} y={140} width={24} height={36} rx={6} fill="#ff9fb2" {...O} strokeWidth={6} />
			))}
			<path d="M58 70 L66 34 L92 60 Z" fill="#ff8aa1" {...O} strokeWidth={6} />
			<ellipse cx={100} cy={110} rx={75} ry={55} fill="#ff9fb2" {...O} />
			<ellipse cx={170} cy={110} rx={16} ry={22} fill="#ff7f9a" {...O} strokeWidth={6} />
			<circle cx={166} cy={104} r={3.5} fill="#111" />
			<circle cx={166} cy={118} r={3.5} fill="#111" />
			<circle cx={138} cy={88} r={7} fill="#111" />
			<rect x={82} y={54} width={44} height={9} rx={4} fill="#111" />
		</>
	),
	chart: (
		<>
			{[0, 1, 2, 3].map((i) => (
				<rect key={i} x={45 + i * 34} y={150 - (i + 1) * 26} width={24} height={(i + 1) * 26} fill="#3fae5a" {...O} strokeWidth={5} />
			))}
			<path d="M30 25 V160 H180" fill="none" stroke="#eee" strokeWidth={8} strokeLinecap="round" />
			<path d="M40 130 L95 85 L120 100 L168 48" fill="none" stroke="#ffd23f" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
			<path d="M146 44 L176 38 L170 68 Z" fill="#ffd23f" />
		</>
	),
	question: (
		<>
			<circle cx={100} cy={100} r={80} fill="#7b5cff" {...O} />
			<text x={100} y={142} fontSize={120} fontWeight={900} textAnchor="middle" fill="#fff" fontFamily="Arial Black, sans-serif">?</text>
		</>
	),
};

export type IconName = keyof typeof ICONS;
export const MONEY_ICONS: IconName[] = ['coin', 'money'];

export const Icon: React.FC<{name: IconName; size?: number}> = ({name, size = 240}) => {
	if (!ICONS[name]) throw new Error(`Unknown icon "${name}". Available: ${Object.keys(ICONS).join(', ')}`);
	return (
		<svg viewBox="0 0 200 200" width={size} height={size}>
			{ICONS[name]}
		</svg>
	);
};
