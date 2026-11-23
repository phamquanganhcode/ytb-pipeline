import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type TimelineEvent = {
	time: string;
	label: string;
	status?: 'normal' | 'warning' | 'critical' | 'fatal';
	sceneIndex: number;
};

export type TimelineBarProps = {
	events: TimelineEvent[];
	currentSceneIndex: number;
	totalScenes: number;
};

export const TimelineBar: React.FC<TimelineBarProps> = ({
	events = [],
	currentSceneIndex = 0,
	totalScenes = 20,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (events.length === 0) return null;

	const progress = Math.min(1, Math.max(0, currentSceneIndex / Math.max(1, totalScenes - 1)));
	const trackWidth = 1400;
	const scrubberX = 260 + progress * trackWidth;

	return (
		<div
			style={{
				position: 'absolute',
				top: 24,
				left: 0,
				width: 1920,
				height: 60,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 30,
				pointerEvents: 'none',
			}}
		>
			{/* High-Tech Container */}
			<div
				style={{
					width: 1500,
					height: 52,
					backgroundColor: 'rgba(9, 13, 22, 0.85)',
					backdropFilter: 'blur(10px)',
					border: '1.5px solid rgba(0, 220, 255, 0.4)',
					borderRadius: 10,
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
				}}
			>
				{/* Category Badge on Far Left */}
				<div
					style={{
						position: 'absolute',
						left: 16,
						backgroundColor: '#ff2a2a',
						color: '#fff',
						fontFamily: 'Arial Black',
						fontSize: 12,
						padding: '4px 10px',
						borderRadius: 4,
						letterSpacing: 1.5,
					}}
				>
					TIMELINE
				</div>

				{/* Horizontal Timeline Track */}
				<div
					style={{
						position: 'absolute',
						left: 140,
						width: trackWidth,
						height: 4,
						backgroundColor: 'rgba(255, 255, 255, 0.15)',
						borderRadius: 2,
					}}
				>
					{/* Active Progress Fill */}
					<div
						style={{
							width: `${progress * 100}%`,
							height: '100%',
							background: 'linear-gradient(90deg, #00dcff 0%, #ff8800 60%, #ff2a2a 100%)',
							borderRadius: 2,
							boxShadow: '0 0 10px rgba(255, 60, 40, 0.6)',
						}}
					/>
				</div>

				{/* Event Milestone Markers along the track */}
				{events.map((ev, i) => {
					const evProgress = Math.min(1, Math.max(0, ev.sceneIndex / Math.max(1, totalScenes - 1)));
					const posX = 140 + evProgress * trackWidth;
					const isReached = currentSceneIndex >= ev.sceneIndex;
					const isCurrent = currentSceneIndex === ev.sceneIndex;

					const color =
						ev.status === 'fatal'
							? '#ff2a2a'
							: ev.status === 'critical'
							? '#ff6b00'
							: ev.status === 'warning'
							? '#ffd23f'
							: '#00dcff';

					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: posX,
								transform: 'translateX(-50%)',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 2,
							}}
						>
							{/* Tick Dot */}
							<div
								style={{
									width: isCurrent ? 14 : 8,
									height: isCurrent ? 14 : 8,
									borderRadius: '50%',
									backgroundColor: isReached ? color : '#475569',
									border: isCurrent ? '2px solid #ffffff' : 'none',
									boxShadow: isCurrent ? `0 0 12px ${color}` : 'none',
									transition: 'all 0.3s ease',
								}}
							/>
							{/* Timestamp Label */}
							<div
								style={{
									fontFamily: 'monospace',
									fontSize: 10,
									fontWeight: 'bold',
									color: isReached ? '#ffffff' : '#64748b',
									marginTop: 4,
								}}
							>
								{ev.time}
							</div>
						</div>
					);
				})}

				{/* Scrubber Glow Indicator */}
				<div
					style={{
						position: 'absolute',
						left: 140 + progress * trackWidth,
						transform: 'translate(-50%, 0)',
						width: 22,
						height: 22,
						borderRadius: '50%',
						backgroundColor: '#ffffff',
						border: '4px solid #ff2a2a',
						boxShadow: '0 0 16px #ff2a2a, 0 0 30px rgba(255, 42, 42, 0.8)',
					}}
				/>
			</div>
		</div>
	);
};
