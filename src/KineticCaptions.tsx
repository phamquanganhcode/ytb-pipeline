import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type WordTiming = {
	word: string;
	at: number;
};

export type KineticCaptionsProps = {
	text: string;
	words?: WordTiming[];
	frames: number;
	speaker?: 'narrator' | 'friend';
	padFrames?: number;
	chunkSize?: number;
	disabled?: boolean;
};

export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
	text,
	words,
	frames,
	speaker = 'narrator',
	padFrames = 15,
	chunkSize = 4,
	disabled = false,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (disabled || !text) return null;
	// Don't render during scene ending pad
	if (frame >= frames - padFrames) return null;

	// Fallback to evenly spaced words if whisper word timestamps are not passed
	const rawWords = text.trim().split(/\s+/);
	const speechFrames = Math.max(1, frames - padFrames);
	const timingList: WordTiming[] =
		words && words.length === rawWords.length
			? words
			: rawWords.map((w, i) => ({
					word: w,
					at: Math.floor((i / rawWords.length) * speechFrames),
				}));

	if (timingList.length === 0) return null;

	// Split words into chunks of chunkSize (e.g. 3-4 words per display phrase)
	const chunks: WordTiming[][] = [];
	for (let i = 0; i < timingList.length; i += chunkSize) {
		chunks.push(timingList.slice(i, i + chunkSize));
	}

	// Find the current active chunk based on frame
	let activeChunkIndex = 0;
	for (let i = 0; i < chunks.length; i++) {
		const chunkStart = chunks[i][0].at;
		const nextChunkStart = i + 1 < chunks.length ? chunks[i + 1][0].at : speechFrames;
		if (frame >= chunkStart && frame < nextChunkStart) {
			activeChunkIndex = i;
			break;
		}
		if (frame >= nextChunkStart) {
			activeChunkIndex = i;
		}
	}

	const activeChunk = chunks[activeChunkIndex] || [];
	if (activeChunk.length === 0) return null;

	const chunkStartFrame = activeChunk[0].at;
	// Bounce pop when chunk switches
	const chunkSpring = spring({
		frame: Math.max(0, frame - chunkStartFrame),
		fps,
		config: {damping: 14, mass: 0.6, stiffness: 180},
	});

	const chunkOpacity = interpolate(frame - chunkStartFrame, [0, 3], [0.6, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const highlightColor = speaker === 'friend' ? '#00f0ff' : '#ffd23f';

	return (
		<div
			style={{
				position: 'absolute',
				left: 100,
				right: 100,
				bottom: 60,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				flexWrap: 'wrap',
				gap: '12px 18px',
				zIndex: 40,
				pointerEvents: 'none',
				transform: `scale(${0.96 + 0.04 * chunkSpring})`,
				opacity: chunkOpacity,
				transformOrigin: 'bottom center',
			}}
		>
			{activeChunk.map((item, idx) => {
				const isCurrent =
					frame >= item.at &&
					(idx + 1 < activeChunk.length
						? frame < activeChunk[idx + 1].at
						: activeChunkIndex + 1 < chunks.length
							? frame < chunks[activeChunkIndex + 1][0].at
							: true);

				const isPast = frame >= item.at && !isCurrent;

				const wordSpring = spring({
					frame: Math.max(0, frame - item.at),
					fps,
					config: {damping: 12, mass: 0.5, stiffness: 220},
				});

				const scale = isCurrent ? 1.08 + 0.08 * wordSpring : 1.0;
				const color = isCurrent ? highlightColor : isPast ? '#ffffff' : 'rgba(255, 255, 255, 0.65)';

				return (
					<span
						key={idx}
						style={{
							fontFamily: 'Arial Black, Impact, sans-serif',
							fontSize: 54,
							fontWeight: 900,
							lineHeight: 1.15,
							textTransform: 'uppercase',
							color,
							WebkitTextStroke: isCurrent ? '4px #000000' : '3px #000000',
							paintOrder: 'stroke fill',
							textShadow: isCurrent
								? `0 6px 0 #000, 0 0 25px ${highlightColor}aa`
								: '0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.8)',
							transform: `scale(${scale})`,
							transformOrigin: 'center bottom',
							transition: 'transform 0.08s ease, color 0.08s ease',
							display: 'inline-block',
						}}
					>
						{item.word}
					</span>
				);
			})}
		</div>
	);
};
