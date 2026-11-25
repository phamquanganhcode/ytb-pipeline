import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type MascotPose =
	| 'explaining'
	| 'pointing'
	| 'shades'
	| 'deadpan'
	| 'shocked'
	| 'skeptical';

export type ChibiRole =
	| 'trader'
	| 'investor'
	| 'hacker'
	| 'boss'
	| 'engineer'
	| 'fbi'
	| 'support'
	| 'dad'
	| 'victim';

export type ChibiMood = 'neutral' | 'happy' | 'panic' | 'smug' | 'sad';

export type ComicIconName =
	| 'bitcoin'
	| 'eth'
	| 'usdt'
	| 'usdc'
	| 'xrp'
	| 'wallet'
	| 'bank'
	| 'building'
	| 'laptop'
	| 'document'
	| 'cash'
	| 'skull'
	| 'lock'
	| 'shield'
	| 'globe'
	| 'fire'
	| 'warning'
	| 'chart'
	| 'red_x'
	| 'freeze'
	| 'bug';

export type BackdropKind =
	| 'dark_grid'
	| 'light_paper'
	| 'candlestick_chart'
	| 'office'
	| 'living_room'
	| 'bank_counter'
	| 'hacker_room';

const INK = '#141418';

const HOST_SPRITE: Record<MascotPose, string> = {
	explaining: 'host_deadpan',
	deadpan: 'host_deadpan',
	skeptical: 'host_deadpan',
	pointing: 'host_pointing',
	shades: 'host_glasses',
	shocked: 'host_shocked',
};

/**
 * Original 2D Comic Investigator Host (charcoal turtleneck, camel trench coat, round glasses).
 * Completely distinct from animal/dragon mascots — built for English finance & tech explainers.
 */
export const MascotHost: React.FC<{
	pose?: MascotPose;
	size?: number;
	flipX?: boolean;
	talking?: boolean;
	stickerOutline?: boolean;
	style?: React.CSSProperties;
}> = ({
	pose = 'explaining',
	size = 420,
	flipX = false,
	talking = true,
	style,
}) => {
		const frame = useCurrentFrame();
		const { fps } = useVideoConfig();
		const pop = talking ? spring({ frame, fps, config: { damping: 14, stiffness: 150 } }) : 1;
		const bobY = talking ? Math.sin(frame / 7) * 4.5 : 0;
		const tilt = talking ? Math.sin(frame / 13) * 1.4 : 0;

		const base = HOST_SPRITE[pose] ?? 'host_deadpan';
		const file = `comic/art/${base}.png`;

		return (
			<div
				style={{
					width: size,
					height: size,
					display: 'flex',
					alignItems: 'flex-end',
					justifyContent: 'center',
					transform: `translateY(${bobY}px) scale(${0.92 + 0.08 * pop}) scaleX(${flipX ? -1 : 1}) rotate(${tilt}deg)`,
					opacity: pop,
					filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.45))',
					pointerEvents: 'none',
					...style,
				}}
			>
				<Img
					src={staticFile(file)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'contain',
						objectPosition: 'bottom center',
					}}
				/>
			</div>
		);
	};

const CHIBI_SPRITE: Record<ChibiRole, string> = {
	trader: 'comic/art/chibi_trader.png',
	investor: 'comic/art/chibi_trader.png',
	victim: 'comic/art/chibi_victim.png',
	hacker: 'comic/art/chibi_hacker.png',
	engineer: 'comic/art/chibi_engineer.png',
	boss: 'comic/art/chibi_engineer.png',
	support: 'comic/art/chibi_engineer.png',
	fbi: 'comic/art/chibi_hacker.png',
	dad: 'comic/art/chibi_trader.png',
};

/**
 * Studio-illustrated 2D Chibi Character Cast (clean Lóng-style — no clunky nameplate pills).
 */
export const ChibiCharacter: React.FC<{
	role: ChibiRole;
	mood?: ChibiMood;
	label?: string;
	size?: number;
	delay?: number;
	flipX?: boolean;
}> = ({ role, size = 390, delay = 0, flipX = false }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const pop = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 155 } });
	const bob = Math.sin((frame + delay * 3) / 11) * 3;
	const src = CHIBI_SPRITE[role] ?? CHIBI_SPRITE.trader;

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				transform: `scale(${0.92 + 0.08 * pop}) translateY(${bob}px)`,
				opacity: pop,
			}}
		>
			<div
				style={{
					width: size,
					height: size,
					transform: `scaleX(${flipX ? -1 : 1})`,
					filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
				}}
			>
				<Img
					src={staticFile(src)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'contain',
						objectPosition: 'bottom center',
					}}
				/>
			</div>
		</div>
	);
};

/**
 * Clean organic hand-drawn comic speech bubble (matches Lóng's 00:30 & 08:42 bubbles).
 */
export const SpeechBubble: React.FC<{
	text: string;
	tail?: 'left' | 'right' | 'bottom';
	delay?: number;
	maxWidth?: number;
}> = ({ text, tail = 'bottom', delay = 10, maxWidth = 460 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const pop = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 185 } });

	return (
		<div
			style={{
				position: 'relative',
				maxWidth,
				backgroundColor: '#ffffff',
				border: `4px solid ${INK}`,
				borderRadius: 46,
				padding: '22px 34px',
				transform: `scale(${pop})`,
				opacity: pop,
				fontFamily: "'Georgia', 'Comic Sans MS', 'Segoe UI', serif",
				fontWeight: 700,
				fontSize: 31,
				lineHeight: 1.28,
				color: INK,
				textAlign: 'center',
			}}
		>
			{text}
			<div
				style={{
					position: 'absolute',
					width: 24,
					height: 24,
					backgroundColor: '#ffffff',
					borderRight: `5px solid ${INK}`,
					borderBottom: `5px solid ${INK}`,
					...(tail === 'bottom'
						? { bottom: -15, left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
						: tail === 'left'
							? { bottom: -14, left: 48, transform: 'rotate(45deg)' }
							: { bottom: -14, right: 48, transform: 'rotate(45deg)' }),
				}}
			/>
		</div>
	);
};

/**
 * Flat-vector comic icon library with crisp dark ink outlines.
 */
export const ComicIcon: React.FC<{
	name: ComicIconName;
	size?: number;
	crossedOut?: boolean;
}> = ({ name, size = 120, crossedOut = false }) => {
	const renderShape = () => {
		switch (name) {
			case 'bitcoin':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#f7931a" stroke={INK} strokeWidth="6" />
						<circle cx="64" cy="64" r="40" fill="none" stroke="#fde68a" strokeWidth="3" />
						<text x="64" y="82" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							₿
						</text>
					</g>
				);
			case 'eth':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#6366f1" stroke={INK} strokeWidth="6" />
						<polygon points="64,22 92,66 64,82 36,66" fill="#e0e7ff" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
						<polygon points="64,108 92,74 64,90 36,74" fill="#c7d2fe" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
					</g>
				);
			case 'usdt':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#10b981" stroke={INK} strokeWidth="6" />
						<text x="64" y="84" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							₮
						</text>
					</g>
				);
			case 'usdc':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#2563eb" stroke={INK} strokeWidth="6" />
						<text x="64" y="84" textAnchor="middle" fontSize="56" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							$
						</text>
					</g>
				);
			case 'xrp':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#94a3b8" stroke={INK} strokeWidth="6" />
						<path d="M 38 42 L 64 62 L 90 42 M 38 86 L 64 66 L 90 86" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
					</g>
				);
			case 'wallet':
				return (
					<g>
						<circle cx="52" cy="36" r="16" fill="#facc15" stroke={INK} strokeWidth="5" />
						<circle cx="78" cy="34" r="14" fill="#fb923c" stroke={INK} strokeWidth="5" />
						<rect x="20" y="42" width="88" height="66" rx="14" fill="#3b82f6" stroke={INK} strokeWidth="6" />
						<rect x="74" y="64" width="38" height="24" rx="8" fill="#1d4ed8" stroke={INK} strokeWidth="5" />
						<circle cx="88" cy="76" r="5" fill="#facc15" />
					</g>
				);
			case 'bank':
				return (
					<g>
						<polygon points="16,52 64,20 112,52" fill="#34d399" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<circle cx="64" cy="40" r="10" fill="#fef08a" stroke={INK} strokeWidth="4" />
						<rect x="26" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="57" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="88" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="14" y="96" width="100" height="16" rx="4" fill="#10b981" stroke={INK} strokeWidth="6" />
					</g>
				);
			case 'building':
				return (
					<g>
						<rect x="26" y="18" width="76" height="94" rx="6" fill="#64748b" stroke={INK} strokeWidth="6" />
						{[0, 1, 2].map((r) =>
							[0, 1, 2].map((c) => (
								<rect key={`${r}-${c}`} x={38 + c * 20} y={30 + r * 22} width="12" height="14" fill="#bae6fd" stroke={INK} strokeWidth="3" />
							)),
						)}
					</g>
				);
			case 'laptop':
				return (
					<g>
						<rect x="22" y="26" width="84" height="58" rx="8" fill="#334155" stroke={INK} strokeWidth="6" />
						<rect x="30" y="34" width="68" height="42" fill="#38bdf8" />
						<polygon points="10,88 118,88 108,104 20,104" fill="#94a3b8" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
					</g>
				);
			case 'document':
				return (
					<g>
						<path d="M 30 16 L 80 16 L 100 36 L 100 112 L 30 112 Z" fill="#fef3c7" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<polygon points="80,16 100,36 80,36" fill="#fde68a" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
						<line x1="44" y1="54" x2="86" y2="54" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="44" y1="72" x2="86" y2="72" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="44" y1="90" x2="72" y2="90" stroke={INK} strokeWidth="5" strokeLinecap="round" />
					</g>
				);
			case 'cash':
				return (
					<g>
						<rect x="16" y="44" width="96" height="52" rx="8" fill="#22c55e" stroke={INK} strokeWidth="6" />
						<rect x="22" y="34" width="96" height="52" rx="8" fill="#4ade80" stroke={INK} strokeWidth="6" />
						<circle cx="70" cy="60" r="14" fill="#bbf7d0" stroke={INK} strokeWidth="4" />
						<text x="70" y="67" textAnchor="middle" fontSize="22" fontWeight="900" fill={INK}>
							$
						</text>
					</g>
				);
			case 'bug':
				return (
					<g>
						<rect x="30" y="36" width="68" height="56" rx="14" fill="#22c55e" stroke={INK} strokeWidth="6" />
						<rect x="44" y="52" width="12" height="12" fill={INK} />
						<rect x="72" y="52" width="12" height="12" fill={INK} />
						<path d="M 46 76 H 82 M 22 50 H 30 M 22 72 H 30 M 98 50 H 106 M 98 72 H 106 M 44 24 L 52 36 M 84 24 L 76 36" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					</g>
				);
			case 'freeze':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#06b6d4" stroke={INK} strokeWidth="6" />
						<path d="M 64 26 V 102 M 26 64 H 102 M 38 38 L 90 90 M 90 38 L 38 90" stroke="#ecfeff" strokeWidth="7" strokeLinecap="round" />
						<circle cx="64" cy="64" r="14" fill="#0891b2" stroke="#ecfeff" strokeWidth="5" />
					</g>
				);
			case 'warning':
				return (
					<g>
						<polygon points="64,18 112,106 16,106" fill="#facc15" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<line x1="64" y1="48" x2="64" y2="76" stroke={INK} strokeWidth="8" strokeLinecap="round" />
						<circle cx="64" cy="92" r="5.5" fill={INK} />
					</g>
				);
			case 'lock':
				return (
					<g>
						<path d="M 42 54 V 38 C 42 22, 86 22, 86 38 V 54" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
						<rect x="28" y="52" width="72" height="58" rx="10" fill="#f59e0b" stroke={INK} strokeWidth="6" />
						<circle cx="64" cy="78" r="8" fill={INK} />
					</g>
				);
			case 'shield':
				return (
					<g>
						<path d="M 64 16 L 106 32 V 66 C 106 90, 86 106, 64 114 C 42 106, 22 90, 22 66 V 32 Z" fill="#38bdf8" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<path d="M 46 64 L 58 76 L 84 48" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
					</g>
				);
			case 'red_x':
				return (
					<g>
						<path d="M 28 28 L 100 100 M 100 28 L 28 100" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" />
						<path d="M 28 28 L 100 100 M 100 28 L 28 100" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.25" />
					</g>
				);
			default:
				return (
					<g>
						<circle cx="64" cy="64" r="50" fill="#38bdf8" stroke={INK} strokeWidth="6" />
						<text x="64" y="76" textAnchor="middle" fontSize="42" fontWeight="900" fill="#ffffff">
							★
						</text>
					</g>
				);
		}
	};

	return (
		<div style={{ position: 'relative', width: size, height: size }}>
			<svg viewBox="0 0 128 128" width="100%" height="100%">
				{renderShape()}
				{crossedOut && (
					<g>
						<path d="M 22 22 L 106 106 M 106 22 L 22 106" stroke={INK} strokeWidth="20" strokeLinecap="round" />
						<path d="M 22 22 L 106 106 M 106 22 L 22 106" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
					</g>
				)}
			</svg>
		</div>
	);
};

/**
 * Dual Signature Backdrops (Dark Grid + Light Paper) + Cartoon Skit Environments.
 */
export const ComicBackdrop: React.FC<{ kind?: BackdropKind; blur?: number }> = ({
	kind = 'dark_grid',
	blur = 0,
}) => {
	const frame = useCurrentFrame();
	const drift = (frame * 0.25) % 48;

	const wrapStyle: React.CSSProperties = {
		position: 'absolute',
		inset: 0,
		filter: blur > 0 ? `blur(${blur}px)` : undefined,
		transform: blur > 0 ? 'scale(1.04)' : undefined,
	};

	if (kind === 'light_paper') {
		return (
			<div
				style={{
					...wrapStyle,
					backgroundColor: '#f3f2ee',
					backgroundImage:
						'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(215,211,202,0.32) 100%)',
				}}
			/>
		);
	}

	if (kind === 'candlestick_chart') {
		const candles = [
			{ x: 100, o: 580, c: 510, h: 470, l: 615, up: true },
			{ x: 185, o: 510, c: 565, h: 485, l: 600, up: false },
			{ x: 270, o: 565, c: 455, h: 425, l: 585, up: true },
			{ x: 355, o: 455, c: 495, h: 420, l: 530, up: false },
			{ x: 440, o: 495, c: 365, h: 330, l: 515, up: true },
			{ x: 525, o: 365, c: 415, h: 340, l: 445, up: false },
			{ x: 610, o: 415, c: 290, h: 245, l: 435, up: true },
			{ x: 695, o: 290, c: 350, h: 265, l: 385, up: false },
			{ x: 780, o: 350, c: 240, h: 205, l: 370, up: true },
			{ x: 865, o: 240, c: 430, h: 225, l: 485, up: false },
			{ x: 950, o: 430, c: 585, h: 410, l: 645, up: false },
			{ x: 1035, o: 585, c: 690, h: 550, l: 735, up: false },
			{ x: 1120, o: 690, c: 640, h: 610, l: 720, up: true },
			{ x: 1205, o: 640, c: 760, h: 620, l: 800, up: false },
		];
		const coinPop1 = interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		const coinPop2 = interpolate(frame, [65, 81], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		const coinPop3 = interpolate(frame, [90, 106], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		return (
			<div style={{ ...wrapStyle, backgroundColor: '#f3f2ee' }}>
				<svg viewBox="0 0 1920 1080" width="100%" height="100%">
					<rect x="85" y="70" width="1645" height="785" fill="#232c3d" stroke={INK} strokeWidth="5" />
					{[200, 345, 490, 635, 780].map((y, idx) => (
						<g key={y}>
							<line x1="85" y1={y} x2="1730" y2={y} stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
							<text x="1756" y={y + 8} fill="#1f2937" fontSize="26" fontWeight="700" fontFamily="Georgia, serif">
								{['49.00', '48.50', '48.00', '47.50', '47.00'][idx]}
							</text>
						</g>
					))}
					{[320, 680, 1040, 1400].map((x, idx) => (
						<g key={x}>
							<line x1={x} y1="70" x2={x} y2="855" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
							<text x={x - 18} y="902" fill="#1f2937" fontSize="28" fontWeight="700" fontFamily="Georgia, serif">
								{['Jan', '17', '24', '31'][idx]}
							</text>
						</g>
					))}
					{candles.map((cd, i) => {
						const col = cd.up ? '#22c55e' : '#ef4444';
						const top = Math.min(cd.o, cd.c);
						const h = Math.max(16, Math.abs(cd.o - cd.c));
						const grow = interpolate(frame, [i * 2, i * 2 + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
						return (
							<g key={i} opacity={grow}>
								<line x1={cd.x + 170} y1={cd.h} x2={cd.x + 170} y2={cd.l} stroke={col} strokeWidth="6" />
								<rect x={cd.x + 152} y={top} width="36" height={h} rx="3" fill={col} stroke={INK} strokeWidth="2.5" />
							</g>
						);
					})}
					{/* Floating crypto coins popping above candlesticks (exact Lóng 00:09-00:15 motif) */}
					<g transform={`translate(460, ${235 + Math.sin(frame / 10) * 6}) scale(${coinPop1})`} opacity={coinPop1}>
						<circle r="62" fill="#f7931a" stroke={INK} strokeWidth="5" />
						<text y="22" textAnchor="middle" fontSize="64" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">₿</text>
					</g>
					<g transform={`translate(930, ${195 + Math.sin(frame / 10 + 1.5) * 6}) scale(${coinPop2})`} opacity={coinPop2}>
						<circle r="62" fill="#6366f1" stroke={INK} strokeWidth="5" />
						<text y="22" textAnchor="middle" fontSize="60" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">Ξ</text>
					</g>
					<g transform={`translate(1390, ${245 + Math.sin(frame / 10 + 3.0) * 6}) scale(${coinPop3})`} opacity={coinPop3}>
						<circle r="58" fill="#10b981" stroke={INK} strokeWidth="5" />
						<text y="20" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">₮</text>
					</g>
				</svg>
			</div>
		);
	}

	if (kind === 'office' || kind === 'living_room' || kind === 'bank_counter' || kind === 'hacker_room') {
		const bgMap: Record<string, string> = {
			office: 'comic/art/bg_office.jpg',
			living_room: 'comic/art/bg_office.jpg',
			bank_counter: 'comic/art/bg_bank_counter.jpg',
			hacker_room: 'comic/art/bg_hacker_room.jpg',
		};
		const slowZoom = interpolate(frame, [0, 360], [1.0, 1.045], { extrapolateRight: 'clamp' });
		return (
			<div style={{ ...wrapStyle, overflow: 'hidden' }}>
				<Img
					src={staticFile(bgMap[kind])}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${slowZoom})`,
					}}
				/>
			</div>
		);
	}

	// Default: Lóng's exact Dark Grid (#1d1f23 with crisp subtle 42px grid lines)
	return (
		<div
			style={{
				...wrapStyle,
				backgroundColor: '#1d1f23',
				backgroundImage:
					'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.42) 100%), linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
				backgroundSize: '100% 100%, 42px 42px, 42px 42px',
				backgroundPosition: `0 0, ${drift}px ${drift}px, ${drift}px ${drift}px`,
			}}
		/>
	);
};
