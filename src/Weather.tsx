import React from 'react';
import {AbsoluteFill, Audio, Loop, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Weather = 'rain' | 'storm' | 'snow';

const DROPS = 140;
const FLAKES = 90;

// Ambient effect drawn over the scene (inside the camera zoom). Positions come from seeded random(),
// so every render of a frame is identical.
const FLASH_EVERY = 105; // storm: a lightning flash about every 3.5 s, thunder right after

// Looping ambience under the voice (sfx/*.wav are synthesised by make_video.py), plus thunder per flash.
const Ambience: React.FC<{kind: Weather}> = ({kind}) => {
	const {durationInFrames} = useVideoConfig();
	return (
		<>
			<Loop durationInFrames={120}>
				<Audio src={staticFile(kind === 'snow' ? 'sfx/wind.wav' : 'sfx/rain.wav')} volume={kind === 'storm' ? 0.35 : 0.25} />
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
