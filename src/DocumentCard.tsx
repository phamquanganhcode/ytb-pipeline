import React from 'react';
import {Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type DocumentCardData = {
	source: string;
	date?: string;
	headline: string;
	excerpt: string;
	highlight: string;
	highlightColor?: 'yellow' | 'red';
	stamp?: string;
	word?: string;
	at?: number;
};

export const DocumentCard: React.FC<DocumentCardData> = ({
	source,
	date,
	headline,
	excerpt,
	highlight,
	highlightColor = 'yellow',
	stamp,
	at = 10,
}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const entrance = spring({frame, fps, config: {damping: 14}});
	const driftScale = interpolate(frame, [0, Math.max(30, durationInFrames)], [1.0, 1.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const slideX = interpolate(entrance, [0, 1], [60, 0]);

	const sweepFrame = Math.max(0, at);
	const sweep = interpolate(frame, [sweepFrame, sweepFrame + 14], [0, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// Case-insensitive match of the highlighted phrase inside excerpt
	const lowerExcerpt = excerpt.toLowerCase();
	const lowerTarget = highlight.toLowerCase();
	const matchIdx = lowerTarget ? lowerExcerpt.indexOf(lowerTarget) : -1;
	const before = matchIdx >= 0 ? excerpt.slice(0, matchIdx) : '';
	const matched = matchIdx >= 0 ? excerpt.slice(matchIdx, matchIdx + highlight.length) : excerpt;
	const after = matchIdx >= 0 ? excerpt.slice(matchIdx + highlight.length) : '';

	const markerBg =
		highlightColor === 'red' ? 'rgba(239, 68, 68, 0.34)' : 'rgba(250, 204, 21, 0.72)';

	return (
		<div
			style={{
				position: 'absolute',
				left: 820,
				top: 255,
				width: 1000,
				transform: `translateX(${slideX}px) scale(${driftScale})`,
				transformOrigin: 'center center',
				opacity: entrance,
				zIndex: 22,
				filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.8))',
			}}
		>
			<Sequence from={sweepFrame} layout="none">
				<Audio src={staticFile('sfx/scribble.wav')} volume={0.22} />
			</Sequence>

			<div
				style={{
					backgroundColor: '#f4efe2',
					backgroundImage:
						'linear-gradient(rgba(30, 41, 59, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.03) 1px, transparent 1px)',
					backgroundSize: '28px 28px',
					borderRadius: 12,
					border: '2px solid #cbd5e1',
					padding: '34px 42px 38px',
					color: '#111827',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* Archival Source Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						borderBottom: '3px solid #1e293b',
						paddingBottom: 14,
						marginBottom: 22,
						fontFamily: 'monospace',
						fontSize: 18,
						fontWeight: 700,
						letterSpacing: 1.5,
						color: '#334155',
						textTransform: 'uppercase',
					}}
				>
					<span>
						{source}
						{date ? `  •  ${date}` : ''}
					</span>
				</div>

				{/* Optional Archival Stamp */}
				{stamp ? (
					<div
						style={{
							position: 'absolute',
							top: 26,
							right: 36,
							border: '3px solid #b91c1c',
							color: '#b91c1c',
							fontFamily: 'Arial Black, sans-serif',
							fontSize: 18,
							letterSpacing: 2,
							padding: '4px 12px',
							borderRadius: 4,
							transform: 'rotate(-5deg)',
							opacity: 0.85,
							textTransform: 'uppercase',
						}}
					>
						{stamp}
					</div>
				) : null}

				{/* Document Headline */}
				<div
					style={{
						fontFamily: "'Georgia', 'Times New Roman', serif",
						fontSize: 32,
						fontWeight: 700,
						lineHeight: 1.22,
						color: '#0f172a',
						marginBottom: 18,
						paddingRight: stamp ? 180 : 0,
					}}
				>
					{headline}
				</div>

				{/* Excerpt with Animated Highlighter Marker Sweep */}
				<div
					style={{
						fontFamily: "'Georgia', 'Times New Roman', serif",
						fontSize: 28,
						lineHeight: 1.55,
						color: '#1e293b',
					}}
				>
					<span>{before}</span>
					<span
						style={{
							backgroundImage: `linear-gradient(90deg, ${markerBg} 0%, ${markerBg} 100%)`,
							backgroundRepeat: 'no-repeat',
							backgroundSize: `${sweep}% 88%`,
							backgroundPosition: '0 65%',
							padding: '2px 4px',
							borderRadius: 3,
							fontWeight: 700,
							color: '#090d16',
						}}
					>
						{matched}
					</span>
					<span>{after}</span>
				</div>
			</div>
		</div>
	);
};
