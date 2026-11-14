import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Episode, EpisodeProps, overlapBefore, SceneData} from './Episode';

// Scenes and durations come from public/manifest.json, written by make_video.py.
export const Root: React.FC = () => (
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
				props: {scenes, captionWords: manifest.captionWords ?? 6, showCounter: manifest.showCounter ?? false, iconStyle: manifest.iconStyle ?? 'panel', cast: manifest.cast ?? {}, music: manifest.music},
			};
		}}
	/>
);
