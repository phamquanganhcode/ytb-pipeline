import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Episode, EpisodeProps, overlapBefore, SceneData} from './Episode';
import {Thumbnail, ThumbnailProps} from './Thumbnail';

// Scenes and durations come from public/manifest.json, written by make_video.py.
export const Root: React.FC = () => (
	<>
		<Composition
			id="Episode"
			component={Episode}
			width={1920}
			height={1080}
			fps={30}
			durationInFrames={1}
			defaultProps={{scenes: []} as EpisodeProps}
			calculateMetadata={async () => {
				const manifest = await fetch(staticFile('manifest.json')).then((r) => r.json());
				const scenes: SceneData[] = manifest.scenes;
				return {
					fps: manifest.fps,
					// Transitions overlap neighbouring scenes, so each one shortens the total; hard cuts do not.
					durationInFrames: scenes.reduce((sum, s, i) => sum + s.frames - overlapBefore(s, i), 0),
					props: {
						scenes,
						captionWords: manifest.captionWords ?? 4,
						captionStyle: manifest.captionStyle ?? 'kinetic',
						showCounter: manifest.showCounter ?? false,
						iconStyle: manifest.iconStyle ?? 'panel',
						cast: manifest.cast ?? {},
						music: manifest.music,
					},
				};
			}}
		/>

		<Composition
			id="Thumbnail"
			component={Thumbnail}
			width={1280}
			height={720}
			fps={30}
			durationInFrames={1}
			defaultProps={
				{
					title: '50% IN 45 DAYS?',
					badge: 'TRUE STORY',
					subtitle: 'THE $15M SCAM',
					stat: '$0 ➜ $15,000,000',
					face: 'faces/charles-ponzi_shock.png',
					bg: 'bg/exchange.png',
				} as ThumbnailProps
			}
			calculateMetadata={async () => {
				try {
					const manifest = await fetch(staticFile('manifest.json')).then((r) => r.json());
					const youFaces = manifest.cast?.you?.faces || {};
					const face = youFaces.shock || youFaces.happy || youFaces.neutral || 'faces/charles-ponzi_shock.png';
					const firstBg = manifest.scenes?.[0]?.bg;
					const bg = firstBg ? `bg/${firstBg}.png` : 'bg/exchange.png';

					// Extract high-impact headline from manifest title
					const rawTitle: string = manifest.title || '';
					const parts = rawTitle.split('|').map((s) => s.trim());
					const mainHeadline = parts.length > 1 ? parts[1] : parts[0] || 'TRUE STORY';

					return {
						props: {
							title: mainHeadline.toUpperCase().slice(0, 32),
							badge: 'TRUE STORY',
							subtitle: parts[0] ? parts[0].toUpperCase().slice(0, 28) : undefined,
							face,
							bg,
							stat: manifest.scenes?.[0]?.counter ? `${manifest.scenes[0].counter.label}: ${manifest.scenes[0].counter.value}` : undefined,
						},
					};
				} catch {
					return {props: {}};
				}
			}}
		/>
	</>
);
