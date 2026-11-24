import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BACKGROUNDS} from './Backgrounds';

export type ThumbnailProps = {
	title?: string;
	badge?: string;
	subtitle?: string;
	stat?: string;
	statIcon?: string;
	face?: string;
	bg?: string;
	accentColor?: string;
	emojis?: [string, string];
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
	title = '50% IN 45 DAYS?',
	badge = 'TRUE STORY',
	subtitle = 'THE $15M SCAM',
	stat,
	statIcon,
	face = 'faces/charles-ponzi_shock.png',
	bg = 'bg/exchange.png',
	accentColor = '#ffd23f',
	emojis,
}) => {
	const isDisaster =
		badge.toUpperCase().includes('THẢM HỌA') ||
		badge.toUpperCase().includes('DISASTER') ||
		badge.toUpperCase().includes('POSTMORTEM') ||
		title.toUpperCase().includes('NỔ') ||
		title.toUpperCase().includes('SẬP') ||
		title.toUpperCase().includes('CHERNOBYL');

	const effectiveAccent = isDisaster ? '#ff3b30' : accentColor;
	const accentGlow = isDisaster ? 'rgba(255,59,48,0.65)' : 'rgba(255,210,63,0.65)';
	const borderGlow = isDisaster ? 'rgba(255,59,48,0.35)' : 'rgba(255,210,63,0.3)';

	return (
		<AbsoluteFill
			style={{
				width: 1280,
				height: 720,
				backgroundColor: '#0c0e14',
				fontFamily: "'Montserrat', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
				overflow: 'hidden',
			}}
		>
			{/* Background Image or SVG with Dark Dramatic Grading */}
			{(() => {
				const SvgBg = bg ? BACKGROUNDS[bg as keyof typeof BACKGROUNDS] : null;
				if (SvgBg) {
					return (
						<div
							style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
								filter: 'brightness(0.38) contrast(1.25) saturate(1.2)',
							}}
						>
							<svg viewBox="0 0 1920 1080" width="100%" height="100%">
								<SvgBg />
							</svg>
						</div>
					);
				}
				if (bg) {
					const imgSrc = bg.startsWith('bg/') || bg.includes('/') ? bg : `bg/${bg}.png`;
					return (
						<Img
							src={staticFile(imgSrc)}
							style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								filter: 'brightness(0.38) contrast(1.25) saturate(1.2)',
							}}
						/>
					);
				}
				return null;
			})()}

			{/* Contrast Vignette Gradient (Dark on left for text, clear on right for face) */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 75% 50%, rgba(20,20,35,0.2) 0%, rgba(5,6,10,0.85) 60%, rgba(3,4,6,0.98) 100%), linear-gradient(90deg, rgba(5,6,10,0.95) 0%, rgba(5,6,10,0.8) 45%, rgba(5,6,10,0.2) 100%)',
				}}
			/>

			{/* Left Column: Clean High-CTR Documentary Headline */}
			<div
				style={{
					position: 'absolute',
					top: 84,
					left: 72,
					width: 710,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					zIndex: 10,
				}}
			>
				{/* Subtle Eyebrow Tag */}
				{badge ? (
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 10,
							backgroundColor: 'rgba(15, 23, 42, 0.85)',
							borderLeft: `5px solid ${effectiveAccent}`,
							color: '#e2e8f0',
							fontSize: 22,
							fontWeight: 800,
							padding: '8px 18px',
							borderRadius: 4,
							letterSpacing: 3,
							textTransform: 'uppercase',
							marginBottom: 22,
						}}
					>
						<span
							style={{
								width: 10,
								height: 10,
								borderRadius: '50%',
								backgroundColor: effectiveAccent,
								display: 'inline-block',
							}}
						/>
						{badge}
					</div>
				) : null}

				{/* Giant Punchy Hook Headline (1-3 words for 2-inch mobile legibility) */}
				<div
					style={{
						fontSize: 104,
						fontWeight: 900,
						lineHeight: 0.98,
						color: '#ffffff',
						textTransform: 'uppercase',
						textShadow: '0 8px 28px rgba(0,0,0,0.92), 0 2px 6px rgba(0,0,0,0.95)',
						letterSpacing: -2,
						marginBottom: 24,
					}}
				>
					{title}
				</div>

				{/* High-Contrast Accent Bar */}
				{subtitle ? (
					<div
						style={{
							backgroundColor: effectiveAccent,
							color: isDisaster ? '#ffffff' : '#000000',
							fontSize: 46,
							fontWeight: 900,
							padding: '10px 26px',
							borderRadius: 6,
							letterSpacing: 1,
							textTransform: 'uppercase',
							boxShadow: '0 12px 30px rgba(0,0,0,0.65)',
							marginBottom: 24,
						}}
					>
						{subtitle}
					</div>
				) : null}

				{/* Optional Minimalist Telemetry Proof Line */}
				{stat ? (
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 12,
							borderTop: `2px solid ${effectiveAccent}`,
							paddingTop: 12,
						}}
					>
						<span
							style={{
								fontSize: 30,
								color: isDisaster ? '#fca5a5' : '#bbf7d0',
								fontWeight: 800,
								letterSpacing: 1.5,
								textShadow: '0 2px 10px rgba(0,0,0,0.9)',
							}}
						>
							{stat}
						</span>
					</div>
				) : null}
			</div>

			{/* Right Column: Character Focal Point */}
			<div
				style={{
					position: 'absolute',
					right: 50,
					bottom: -20,
					width: 480,
					height: 680,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'flex-end',
					zIndex: 5,
				}}
			>
				{/* Glow Aura behind character */}
				<div
					style={{
						position: 'absolute',
						bottom: 120,
						width: 420,
						height: 420,
						borderRadius: '50%',
						background: `radial-gradient(circle, ${effectiveAccent}66 0%, transparent 70%)`,
						filter: 'blur(30px)',
						zIndex: 1,
					}}
				/>

				{/* Character Head Cutout with Accent Rim */}
				{face ? (
					<Img
						src={staticFile(face)}
						style={{
							width: 460,
							height: 460,
							objectFit: 'contain',
							zIndex: 3,
							filter: `drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 24px ${accentGlow}) drop-shadow(0 15px 30px rgba(0,0,0,0.85))`,
						}}
					/>
				) : null}
			</div>

			{/* Dramatic Corner Framing Elements */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					boxShadow: `inset 0 0 60px rgba(0,0,0,0.9), inset 0 0 15px ${borderGlow}`,
					pointerEvents: 'none',
					zIndex: 20,
				}}
			/>
		</AbsoluteFill>
	);
};
