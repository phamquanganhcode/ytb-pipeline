import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

export type ThumbnailProps = {
	title?: string;
	badge?: string;
	subtitle?: string;
	stat?: string;
	face?: string;
	bg?: string;
	accentColor?: string;
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
	title = '50% IN 45 DAYS?',
	badge = 'TRUE STORY',
	subtitle = 'THE $15M SCAM',
	stat = '$0 ➜ $15,000,000',
	face = 'faces/charles-ponzi_shock.png',
	bg = 'bg/exchange.png',
	accentColor = '#ffd23f',
}) => {
	return (
		<AbsoluteFill
			style={{
				width: 1280,
				height: 720,
				backgroundColor: '#0c0e14',
				fontFamily: 'Arial Black, Impact, sans-serif',
				overflow: 'hidden',
			}}
		>
			{/* Background Image with Dark Dramatic Grading */}
			{bg ? (
				<Img
					src={staticFile(bg)}
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'brightness(0.38) contrast(1.25) saturate(1.2)',
					}}
				/>
			) : null}

			{/* Contrast Vignette Gradient (Dark on left for text, clear on right for face) */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 75% 50%, rgba(20,20,35,0.2) 0%, rgba(5,6,10,0.85) 60%, rgba(3,4,6,0.98) 100%), linear-gradient(90deg, rgba(5,6,10,0.95) 0%, rgba(5,6,10,0.8) 45%, rgba(5,6,10,0.2) 100%)',
				}}
			/>

			{/* Left Column: CTR Headline & Badges */}
			<div
				style={{
					position: 'absolute',
					top: 50,
					left: 60,
					width: 720,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					zIndex: 10,
				}}
			>
				{/* Category Badge */}
				<div
					style={{
						backgroundColor: '#ff2a2a',
						color: '#ffffff',
						fontSize: 26,
						fontWeight: 900,
						padding: '8px 22px',
						borderRadius: 8,
						letterSpacing: 2,
						textTransform: 'uppercase',
						boxShadow: '0 8px 20px rgba(255, 42, 42, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
						marginBottom: 20,
						transform: 'rotate(-2deg)',
					}}
				>
					⚡ {badge}
				</div>

				{/* Giant Hook Headline */}
				<div
					style={{
						fontSize: 82,
						lineHeight: 1.02,
						color: '#ffffff',
						textTransform: 'uppercase',
						WebkitTextStroke: '4px #000000',
						textShadow: '0 8px 0 #000000, 0 18px 30px rgba(0,0,0,0.9)',
						letterSpacing: -1,
						marginBottom: 24,
					}}
				>
					{title}
				</div>

				{/* High-Impact Subtitle Pill */}
				{subtitle ? (
					<div
						style={{
							backgroundColor: accentColor,
							color: '#000000',
							fontSize: 44,
							fontWeight: 900,
							padding: '10px 26px',
							borderRadius: 10,
							textTransform: 'uppercase',
							boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
							transform: 'rotate(1.5deg)',
							marginBottom: 28,
						}}
					>
						{subtitle}
					</div>
				) : null}

				{/* Stat / Proof Box */}
				{stat ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 14,
							backgroundColor: 'rgba(0, 0, 0, 0.75)',
							border: `3px solid ${accentColor}`,
							borderRadius: 14,
							padding: '12px 24px',
							backdropFilter: 'blur(8px)',
						}}
					>
						<span style={{fontSize: 32}}>📈</span>
						<span
							style={{
								fontSize: 34,
								color: '#00ff88',
								fontWeight: 900,
								letterSpacing: 1,
								textShadow: '0 4px 10px rgba(0, 255, 136, 0.5)',
							}}
						>
							{stat}
						</span>
					</div>
				) : null}
			</div>

			{/* Right Column: Character with Shock/Exaggerated Face */}
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
						background: `radial-gradient(circle, ${accentColor}66 0%, transparent 70%)`,
						filter: 'blur(30px)',
						zIndex: 1,
					}}
				/>

				{/* Character Head Cutout with Outline */}
				{face ? (
					<Img
						src={staticFile(face)}
						style={{
							width: 460,
							height: 460,
							objectFit: 'contain',
							zIndex: 3,
							filter: 'drop-shadow(0 0 10px #ffffff) drop-shadow(0 0 25px rgba(255,210,63,0.8)) drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
						}}
					/>
				) : null}

				{/* Floating Money / Cash Accent */}
				<div
					style={{
						position: 'absolute',
						top: 60,
						left: -20,
						fontSize: 88,
						transform: 'rotate(-25deg)',
						filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
						zIndex: 6,
					}}
				>
					💸
				</div>
				<div
					style={{
						position: 'absolute',
						bottom: 180,
						right: -10,
						fontSize: 72,
						transform: 'rotate(20deg)',
						filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
						zIndex: 6,
					}}
				>
					💰
				</div>
			</div>

			{/* Dramatic Corner Framing Elements */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					boxShadow: 'inset 0 0 60px rgba(0,0,0,0.9), inset 0 0 15px rgba(255,210,63,0.3)',
					pointerEvents: 'none',
					zIndex: 20,
				}}
			/>
		</AbsoluteFill>
	);
};
