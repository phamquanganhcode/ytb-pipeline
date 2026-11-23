import React from 'react';
import {AbsoluteFill, Audio, Loop, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Weather = 'rain' | 'storm' | 'snow' | 'alarm' | 'smoke' | 'fire';

const DROPS = 140;
const FLAKES = 90;
const SMOKE_PUFFS = 30;
const EMBERS = 60;

// Ambient effect drawn over the scene (inside the camera zoom). Positions come from seeded random(),
// so every render of a frame is identical.
const FLASH_EVERY = 105; // storm: a lightning flash about every 3.5 s, thunder right after

// Looping ambience under the voice (sfx/*.wav are synthesised by make_video.py), plus thunder per flash.
const Ambience: React.FC<{kind: Weather}> = ({kind}) => {
	const {durationInFrames} = useVideoConfig();
	if (kind === 'alarm') {
		return (
			<Loop durationInFrames={60}>
				<Audio src={staticFile('sfx/alarm.wav')} volume={0.3} />
			</Loop>
		);
	}
	return (
		<>
			<Loop durationInFrames={120}>
				<Audio
					src={staticFile(
						kind === 'snow'
							? 'sfx/wind.wav'
							: kind === 'fire' || kind === 'smoke'
							? 'sfx/wind.wav'
							: 'sfx/rain.wav'
					)}
					volume={kind === 'storm' ? 0.35 : 0.25}
				/>
			</Loop>
			{kind === 'storm' &&
				Array.from({length: Math.ceil(durationInFrames / FLASH_EVERY)}, (_, i) => (
					<Sequence key={i} from={i * FLASH_EVERY + 4} layout="none">
						<Audio src={staticFile('sfx/thunder.wav')} volume={0.45} />
					</Sequence>
				))}
		</>
	);
};

export const WeatherFx: React.FC<{kind: Weather}> = ({kind}) => {
	const frame = useCurrentFrame();

	if (kind === 'alarm') {
		// Pulsing emergency red alert overlay
		const pulse = 0.15 + 0.25 * Math.sin((frame / 6) * Math.PI);
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Ambience kind={kind} />
				<AbsoluteFill
					style={{
						background: `radial-gradient(circle at 50% 50%, rgba(255, 30, 30, ${Math.max(0, pulse * 0.5)}) 0%, rgba(200, 0, 0, ${Math.max(0, pulse)}) 100%)`,
						boxShadow: 'inset 0 0 100px rgba(255, 0, 0, 0.8)',
					}}
				/>
			</AbsoluteFill>
		);
	}

	if (kind === 'smoke') {
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Ambience kind={kind} />
				<AbsoluteFill style={{background: 'rgba(20, 20, 25, 0.3)'}} />
				<svg width={1920} height={1080}>
					{Array.from({length: SMOKE_PUFFS}, (_, i) => {
						const speed = 1.5 + random(`smoke-v-${i}`) * 2.2;
						const y = (1180 - (random(`smoke-y-${i}`) * 1180 + frame * speed)) % 1180;
						const x = random(`smoke-x-${i}`) * 1920 + Math.sin(frame / 30 + i) * 35;
						const r = 60 + random(`smoke-r-${i}`) * 100;
						return <circle key={i} cx={x} cy={y} r={r} fill="#2f3742" opacity={0.18} />;
					})}
				</svg>
			</AbsoluteFill>
		);
	}

	if (kind === 'fire') {
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Ambience kind={kind} />
				<AbsoluteFill style={{background: 'rgba(50, 15, 5, 0.2)'}} />
				<svg width={1920} height={1080}>
					{Array.from({length: EMBERS}, (_, i) => {
						const speed = 2.5 + random(`ember-v-${i}`) * 4.0;
						const y = (1180 - (random(`ember-y-${i}`) * 1180 + frame * speed)) % 1180;
						const x = random(`ember-x-${i}`) * 1920 + Math.sin(frame / 20 + i) * 25;
						const r = 2 + random(`ember-r-${i}`) * 6;
						const isYellow = i % 2 === 0;
						return (
							<circle
								key={i}
								cx={x}
								cy={y}
								r={r}
								fill={isYellow ? '#ffd23f' : '#ff4d00'}
								opacity={0.75}
							/>
						);
					})}
				</svg>
			</AbsoluteFill>
		);
	}

	if (kind === 'snow') {
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Ambience kind={kind} />
				<svg width={1920} height={1080}>
					{Array.from({length: FLAKES}, (_, i) => {
						const speed = 1.2 + random(`snow-v-${i}`) * 1.8;
						const y = (random(`snow-y-${i}`) * 1180 + frame * speed) % 1180 - 50;
						const x = random(`snow-x-${i}`) * 1920 + Math.sin(frame / 25 + i) * 18;
						return <circle key={i} cx={x} cy={y} r={3 + random(`snow-r-${i}`) * 5} fill="#fff" opacity={0.85} />;
					})}
				</svg>
			</AbsoluteFill>
		);
	}
	// Storm: lightning flashes about every 3.5 s, a bright flash then a weaker second flicker.
	const beat = frame % FLASH_EVERY;
	const flash = kind === 'storm' ? (beat < 3 ? 0.75 : beat >= 6 && beat < 8 ? 0.4 : 0) : 0;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<Ambience kind={kind} />
			{/* Rain darkens the scene a little, a storm more. */}
			<AbsoluteFill style={{background: kind === 'storm' ? 'rgba(12,18,40,0.38)' : 'rgba(20,30,50,0.18)'}} />
			<svg width={1920} height={1080}>
				{Array.from({length: DROPS}, (_, i) => {
					const speed = 38 + random(`rain-v-${i}`) * 22;
					const len = 40 + random(`rain-l-${i}`) * 40;
					const y = (random(`rain-y-${i}`) * 1200 + frame * speed) % 1200 - 100;
					const x = (random(`rain-x-${i}`) * 2100 - frame * speed * 0.18) % 2100;
					const xx = x < 0 ? x + 2100 : x;
					return <line key={i} x1={xx} y1={y} x2={xx - len * 0.18} y2={y + len} stroke="#cfe3ff" strokeWidth={2.5} opacity={0.55} strokeLinecap="round" />;
				})}
			</svg>
			{flash > 0 && <AbsoluteFill style={{background: `rgba(235,240,255,${flash})`}} />}
		</AbsoluteFill>
	);
};
