import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {KineticCaptions, WordTiming} from './KineticCaptions';

export type ShortCue = {
	text: string;
	startFrame: number;
	endFrame: number;
	words?: WordTiming[];
};

export type ShortManifest = {
	title: string;
	hookBadge?: string;
	fps: number;
	durationInFrames: number;
	videoSrc: string;
	ctaText?: string;
	cues: ShortCue[];
};

export const ShortEpisode: React.FC<ShortManifest> = ({
	title,
	hookBadge = 'WATCH TILL THE END',
	videoSrc,
	ctaText = 'WATCH FULL VIDEO BELOW ↓',
	cues,
}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const activeCue = cues.find((c) => frame >= c.startFrame && frame < c.endFrame);
	const ctaStart = Math.max(0, durationInFrames - 3 * fps);
	const showCta = frame >= ctaStart;
	const ctaSpring = spring({
		frame: Math.max(0, frame - ctaStart),
		fps,
		config: {damping: 12, stiffness: 180},
	});
	const ctaBounce = Math.sin((frame - ctaStart) / 6) * 5;
	const badgeIn = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{backgroundColor: '#07090e', overflow: 'hidden'}}>
			{videoSrc ? (
				<OffthreadVideo
					src={staticFile(videoSrc)}
					muted
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'blur(32px) brightness(0.32)',
						transform: 'scale(1.18)',
					}}
				/>
			) : null}

			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(5,7,12,0.75) 0%, rgba(5,7,12,0.18) 38%, rgba(5,7,12,0.82) 100%)',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					top: 118,
					left: 60,
					right: 60,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 14,
					opacity: badgeIn,
				}}
			>
				<div
					style={{
						padding: '10px 26px',
						borderRadius: 999,
						backgroundColor: '#ffd23f',
						color: '#111',
						fontFamily: 'Arial Black, Impact, sans-serif',
						fontSize: 28,
						letterSpacing: 2,
						textTransform: 'uppercase',
						boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
					}}
				>
					{hookBadge}
				</div>
				{title ? (
					<div
						style={{
							fontFamily: 'Arial Black, Impact, sans-serif',
							fontSize: 38,
							lineHeight: 1.18,
							textAlign: 'center',
							color: '#ffffff',
							textShadow: '0 4px 16px rgba(0,0,0,0.9)',
							maxWidth: 940,
						}}
					>
						{title}
					</div>
				) : null}
			</div>

			<div
				style={{
					position: 'absolute',
					top: 310,
					left: 30,
					width: 1020,
					height: 574,
					borderRadius: 28,
					overflow: 'hidden',
					border: '4px solid rgba(255, 210, 63, 0.85)',
					boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
					backgroundColor: '#000',
				}}
			>
				{videoSrc ? (
					<OffthreadVideo
						src={staticFile(videoSrc)}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				) : null}
			</div>

			{activeCue ? (
				<div style={{position: 'absolute', left: 0, right: 0, top: 920, height: 480}}>
					<KineticCaptions
						text={activeCue.text}
						words={activeCue.words}
						frames={Math.max(1, activeCue.endFrame - activeCue.startFrame)}
						padFrames={0}
						chunkSize={3}
					/>
				</div>
			) : null}

			{showCta ? (
				<div
					style={{
						position: 'absolute',
						left: 80,
						right: 80,
						bottom: 240,
						display: 'flex',
						justifyContent: 'center',
						transform: `translateY(${ctaBounce}px) scale(${0.85 + 0.15 * ctaSpring})`,
					}}
				>
					<div
						style={{
							padding: '20px 38px',
							borderRadius: 22,
							backgroundColor: '#ef4444',
							border: '4px solid #ffffff',
							color: '#ffffff',
							fontFamily: 'Arial Black, Impact, sans-serif',
							fontSize: 38,
							letterSpacing: 1.5,
							textAlign: 'center',
							boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
						}}
					>
						{ctaText}
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};
