import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ComicBackdrop, MascotHost, MascotPose} from './comic/ComicAssets';

export type ComicThumbnailProps = {
	brand?: string;
	headline: string;
	subline?: string;
	mascot?: MascotPose;
	mediaSrc?: string;
	heroPhotoSrc?: string;
	tag?: string;
	theme?: 'disaster' | 'gold';
	showChart?: boolean;
};

const SANS = "'Arial Black', 'Montserrat', 'Inter', 'Segoe UI', sans-serif";
const INK = '#0a0a0e';

const inferTag = (headline: string, subline?: string): string => {
	const text = `${headline} ${subline ?? ''}`.toUpperCase();
	if (text.includes('HACK') || text.includes('HEIST') || text.includes('STOLEN')) return 'CRITICAL BREACH';
	if (text.includes('COLLAPSE') || text.includes('VANISHED') || text.includes('CRASH')) return 'TOTAL COLLAPSE';
	if (text.includes('OUTAGE') || text.includes('BUG') || text.includes('SERVER')) return 'SYSTEM FAILURE';
	return 'DISASTER FILE';
};

/**
 * High-CTR 1280x720 Disaster-Comic YouTube Thumbnail:
 * - Dark crimson/noir graded scene with subtle comic halftone + radial speed lines
 * - Glowing red crash trajectory chart behind the foreground for instant "collapse" signal
 * - Bold, tilted 2-tier left typography (amber/yellow punchline + crimson caution ribbon)
 * - Pop-out MascotHost on the right with crisp white comic-sticker outline & warning accents
 */
export const ComicThumbnail: React.FC<ComicThumbnailProps> = ({
	brand = 'BRIEFED',
	headline = '-$6 BILLION',
	subline = 'HOW BINANCE GOT HIT',
	mascot = 'shocked',
	mediaSrc = 'comic/art/bg_thumbnail.jpg',
	heroPhotoSrc,
	tag,
	theme = 'disaster',
	showChart = true,
}) => {
	const bgSrc = mediaSrc || 'comic/art/bg_thumbnail.jpg';
	const isDisaster = theme === 'disaster';
	const accentPrimary = isDisaster ? '#ff2d2d' : '#f59e0b';
	const headlineColor = '#ffe600';
	const alertLabel = (tag || inferTag(headline, subline)).toUpperCase();

	const len = headline.trim().length;
	const headlineSize = len <= 10 ? 136 : len <= 14 ? 116 : len <= 19 ? 96 : 80;
	const subLen = (subline ?? '').trim().length;
	const subSize = subLen <= 20 ? 40 : subLen <= 28 ? 34 : 29;

	return (
		<AbsoluteFill style={{backgroundColor: '#090a0f', overflow: 'hidden'}}>
			{/* 1. Graded Background Photo or Comic Grid */}
			{bgSrc ? (
				<Img
					src={staticFile(bgSrc)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'contrast(1.24) saturate(0.95) brightness(0.68)',
						transform: 'scale(1.04)',
					}}
				/>
			) : (
				<ComicBackdrop kind="dark_grid" />
			)}

			{/* 2. Directional Contrast Overlay: Dark Left Panel for Typography + Crimson Spotlight Right */}
			<AbsoluteFill
				style={{
					background: `
						radial-gradient(circle at 77% 52%, ${isDisaster ? 'rgba(255,45,45,0.34)' : 'rgba(255,210,63,0.28)'} 0%, rgba(255,45,45,0.06) 42%, transparent 68%),
						linear-gradient(100deg, rgba(7,8,14,0.88) 0%, rgba(10,11,18,0.72) 44%, rgba(10,11,18,0.20) 72%, rgba(7,8,14,0.48) 100%)
					`,
				}}
			/>

			{/* 3. Comic Halftone Dot Texture + Diagonal Speed Lines behind Mascot */}
			<svg viewBox="0 0 1280 720" width="1280" height="720" style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4}}>
				<defs>
					<pattern id="comicDots" width="14" height="14" patternUnits="userSpaceOnUse">
						<circle cx="3" cy="3" r="1.6" fill="#ffffff" opacity="0.06" />
					</pattern>
				</defs>
				<rect width="1280" height="720" fill="url(#comicDots)" />
				{/* Radial comic burst centered behind mascot */}
				{Array.from({length: 18}, (_, i) => {
					const angle = (i * 20 * Math.PI) / 180;
					const cx = 985;
					const cy = 385;
					const x1 = cx + Math.cos(angle) * 180;
					const y1 = cy + Math.sin(angle) * 180;
					const x2 = cx + Math.cos(angle) * 620;
					const y2 = cy + Math.sin(angle) * 620;
					return (
						<line
							key={i}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke={i % 2 === 0 ? accentPrimary : '#ffe600'}
							strokeWidth={i % 3 === 0 ? 4 : 2}
							opacity={0.14}
						/>
					);
				})}
			</svg>

			{/* 4. Disaster Visual Hook: Crashing Trajectory Graph */}
			{showChart && (
				<svg viewBox="0 0 1280 720" width="1280" height="720" style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8}}>
					<defs>
						<linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#ff2d2d" stopOpacity="0.34" />
							<stop offset="100%" stopColor="#ff2d2d" stopOpacity="0.0" />
						</linearGradient>
						<filter id="crashGlow" x="-20%" y="-20%" width="140%" height="140%">
							<feGaussianBlur stdDeviation="7" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					<line x1="60" y1="220" x2="760" y2="220" stroke="rgba(255,255,255,0.08)" strokeDasharray="8 8" strokeWidth="2" />
					<line x1="60" y1="390" x2="760" y2="390" stroke="rgba(255,255,255,0.08)" strokeDasharray="8 8" strokeWidth="2" />
					<line x1="60" y1="560" x2="760" y2="560" stroke="rgba(255,255,255,0.08)" strokeDasharray="8 8" strokeWidth="2" />
					<path
						d="M 40 430 L 175 370 L 295 395 L 440 215 L 520 245 L 600 175 L 710 610 L 710 720 L 40 720 Z"
						fill="url(#crashFill)"
					/>
					<path
						d="M 40 430 L 175 370 L 295 395 L 440 215 L 520 245 L 600 175 L 702 596"
						fill="none"
						stroke="#ff3333"
						strokeWidth="11"
						strokeLinecap="round"
						strokeLinejoin="round"
						filter="url(#crashGlow)"
					/>
					<polygon points="718,642 652,586 724,560" fill="#ff3333" stroke="#ffffff" strokeWidth="3" />
					<circle cx="600" cy="175" r="11" fill="#ffe600" stroke="#0a0a0e" strokeWidth="4" />
				</svg>
			)}

			{/* 5. Right Column: Pop-Out Mascot / Hero with White Comic Sticker Outline */}
			{heroPhotoSrc ? (
				<div
					style={{
						position: 'absolute',
						right: 26,
						bottom: -8,
						width: 560,
						height: 690,
						zIndex: 18,
						filter:
							'drop-shadow(3px 0 0 #ffffff) drop-shadow(-3px 0 0 #ffffff) drop-shadow(0 -3px 0 #ffffff) drop-shadow(0 18px 34px rgba(0,0,0,0.92))',
					}}
				>
					<Img
						src={staticFile(heroPhotoSrc)}
						style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center'}}
					/>
				</div>
			) : mascot ? (
				<div
					style={{
						position: 'absolute',
						right: -8,
						bottom: -24,
						zIndex: 18,
						transform: 'rotate(-3deg)',
						filter:
							'drop-shadow(4px 0 0 #ffffff) drop-shadow(-4px 0 0 #ffffff) drop-shadow(0 -4px 0 #ffffff) drop-shadow(0 20px 38px rgba(0,0,0,0.92))',
					}}
				>
					<MascotHost pose={mascot} size={650} flipX talking={false} />
				</div>
			) : null}

			{/* 6. Comic Warning Triangle Accent next to Mascot */}
			{isDisaster && (
				<div
					style={{
						position: 'absolute',
						top: 76,
						right: 430,
						zIndex: 20,
						transform: 'rotate(-10deg)',
						filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.85))',
					}}
				>
					<svg width="96" height="90" viewBox="0 0 96 90">
						<polygon
							points="48,6 91,82 5,82"
							fill="#ff2d2d"
							stroke="#ffffff"
							strokeWidth="6"
							strokeLinejoin="round"
						/>
						<rect x="43" y="30" width="10" height="27" rx="4" fill="#ffe600" />
						<circle cx="48" cy="68" r="6" fill="#ffe600" />
					</svg>
				</div>
			)}

			{/* 7. Left Column: High-Contrast Disaster Typography Stack */}
			<div
				style={{
					position: 'absolute',
					left: 52,
					top: 0,
					bottom: 0,
					width: 730,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'flex-start',
					zIndex: 25,
				}}
			>
				{/* Compact Eyebrow Strip: Alert Tag + Integrated Channel Badge */}
				<div
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 12,
						marginBottom: 22,
					}}
				>
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 10,
							backgroundColor: '#dc2626',
							color: '#ffffff',
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 24,
							letterSpacing: 2,
							padding: '8px 18px',
							border: `4px solid ${INK}`,
							boxShadow: `5px 5px 0 ${INK}`,
						}}
					>
						<span
							style={{
								width: 12,
								height: 12,
								borderRadius: '50%',
								backgroundColor: '#ffe600',
								display: 'inline-block',
							}}
						/>
						{alertLabel}
					</div>
					{brand ? (
						<div
							style={{
								backgroundColor: 'rgba(15, 17, 26, 0.92)',
								color: '#ffe600',
								fontFamily: SANS,
								fontWeight: 900,
								fontSize: 22,
								letterSpacing: 2,
								padding: '8px 16px',
								border: '3px solid rgba(255,230,0,0.65)',
								boxShadow: `4px 4px 0 ${INK}`,
							}}
						>
							{brand}
						</div>
					) : null}
				</div>

				{/* Giant Yellow Comic Headline */}
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: headlineSize,
						color: headlineColor,
						textTransform: 'uppercase',
						lineHeight: 0.94,
						letterSpacing: -2,
						WebkitTextStroke: '14px #0a0a0e',
						paintOrder: 'stroke fill',
						textShadow: '0 10px 0 #0a0a0e, 0 20px 38px rgba(0,0,0,0.96)',
						transform: 'rotate(-2deg)',
						transformOrigin: 'left center',
						marginBottom: 26,
						maxWidth: 720,
					}}
				>
					{headline}
				</div>

				{/* Skewed High-Contrast Subline Ribbon */}
				{subline ? (
					<div
						style={{
							backgroundColor: '#ffffff',
							color: INK,
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: subSize,
							lineHeight: 1.08,
							textTransform: 'uppercase',
							letterSpacing: 0.5,
							padding: '12px 26px',
							border: `5px solid ${INK}`,
							boxShadow: `8px 8px 0 ${accentPrimary}, 12px 12px 24px rgba(0,0,0,0.85)`,
							transform: 'skewX(-6deg)',
							maxWidth: 690,
						}}
					>
						<div style={{transform: 'skewX(6deg)'}}>{subline}</div>
					</div>
				) : null}
			</div>

			{/* 8. Crisp Comic Panel Outer Border */}
			<AbsoluteFill
				style={{
					boxShadow: `inset 0 0 0 8px ${INK}, inset 0 0 42px rgba(255,45,45,0.22)`,
					pointerEvents: 'none',
					zIndex: 35,
				}}
			/>
		</AbsoluteFill>
	);
};
