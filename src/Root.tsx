import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Episode, EpisodeProps, overlapBefore, SceneData} from './Episode';
import {Thumbnail, ThumbnailProps} from './Thumbnail';
import {DocuPrototype, DocuPrototypeProps} from './DocuPrototype';
import {DocuEngine, DocuManifest} from './DocuEngine';
import {ComicExplainer, ComicManifest} from './ComicExplainer';
import {ComicThumbnail, ComicThumbnailProps} from './ComicThumbnail';

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
						meta: manifest.meta ?? {},
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
					const bg = firstBg || 'exchange';

					// Extract high-impact headline from manifest title (or explicit meta.thumbnail override)
					const rawTitle: string = manifest.title || '';
					const parts = rawTitle.split('|').map((s) => s.trim());
					const mainHeadline = parts.length > 1 ? parts[1] : parts[0] || 'TRUE STORY';
					const isDisaster =
						manifest.meta?.format === 'disaster' ||
						manifest.meta?.theme === 'disaster' ||
						rawTitle.toUpperCase().includes('CHERNOBYL') ||
						rawTitle.toUpperCase().includes('THẢM HỌA') ||
						rawTitle.toUpperCase().includes('DISASTER');
					const thumb = manifest.meta?.thumbnail || {};
					const defaultBadge = isDisaster
						? manifest.lang === 'vi'
							? 'THẢM HỌA KỸ THUẬT'
							: 'SYSTEM POSTMORTEM'
						: 'TRUE STORY';

					const hasExplicitThumb = Boolean(manifest.meta?.thumbnail);
					return {
						props: {
							title: (thumb.title || mainHeadline).toUpperCase().slice(0, 32),
							badge: thumb.badge || defaultBadge,
							subtitle: (thumb.subtitle || (parts.length > 1 ? parts[0] : '') || '').toUpperCase().slice(0, 36) || undefined,
							face,
							bg,
							stat:
								thumb.stat ??
								(!hasExplicitThumb && manifest.scenes?.[0]?.counter
									? `${manifest.scenes[0].counter.label}: ${manifest.scenes[0].counter.value}`
									: ''),
						},
					};
				} catch {
					return {props: {}};
				}
			}}
		/>

		<Composition
			id="DocuPrototype"
			component={DocuPrototype}
			width={1920}
			height={1080}
			fps={30}
			durationInFrames={1500}
			defaultProps={
				{
					audio: 'docu/narration.wav',
					fps: 30,
					durationInFrames: 1500,
					beats: [0, 240, 480, 720, 960, 1140, 1380],
					hasNyseImg: false,
					hasFloorImg: false,
					hasServerImg: false,
				} as DocuPrototypeProps
			}
			calculateMetadata={async ({props}) => {
				try {
					const meta = await fetch(staticFile('docu/proto_manifest.json')).then((r) => r.json());
					return {
						fps: meta.fps ?? 30,
						durationInFrames: meta.durationInFrames ?? 1500,
						props: meta as DocuPrototypeProps,
					};
				} catch {
					return {props};
				}
			}}
		/>

		<Composition
			id="DocuEngine"
			component={DocuEngine}
			width={1920}
			height={1080}
			fps={30}
			durationInFrames={5400}
			defaultProps={
				{
					title: 'Documentary',
					fps: 30,
					durationInFrames: 5400,
					audio: 'docu/narration_3min.wav',
					scenes: [],
				} as DocuManifest
			}
			calculateMetadata={async ({props}) => {
				try {
					const manifest = await fetch(staticFile('docu/manifest.json')).then((r) => r.json());
					return {
						fps: manifest.fps ?? 30,
						durationInFrames: manifest.durationInFrames ?? 5400,
						props: manifest as DocuManifest,
					};
				} catch {
					return {props};
				}
			}}
		/>

		<Composition
			id="ComicExplainer"
			component={ComicExplainer}
			width={1920}
			height={1080}
			fps={30}
			durationInFrames={4500}
			defaultProps={
				{
					title: 'Comic Explainer',
					brand: 'BRIEFED',
					fps: 30,
					durationInFrames: 4500,
					audio: 'comic/narration.wav',
					scenes: [],
				} as ComicManifest
			}
			calculateMetadata={async ({props}) => {
				try {
					const manifest = await fetch(staticFile('comic/manifest.json')).then((r) => r.json());
					return {
						fps: manifest.fps ?? 30,
						durationInFrames: manifest.durationInFrames ?? 4500,
						props: manifest as ComicManifest,
					};
				} catch {
					return {props};
				}
			}}
		/>

		<Composition
			id="ComicThumbnail"
			component={ComicThumbnail}
			width={1280}
			height={720}
			fps={30}
			durationInFrames={1}
			defaultProps={
				{
					brand: 'BRIEFED',
					headline: '-$6 BILLION',
					subline: 'HOW BINANCE GOT HIT',
					mascot: 'shades',
				} as ComicThumbnailProps
			}
			calculateMetadata={async ({props}) => {
				try {
					const manifest = await fetch(staticFile('comic/manifest.json')).then((r) => r.json());
					const th = manifest.thumbnail || {};
					return {
						props: {
							brand: th.brand || manifest.brand || 'BRIEFED',
							headline: th.headline || manifest.title || '-$6 BILLION',
							subline: th.subline,
							mascot: th.mascot,
							mediaSrc: th.mediaSrc,
							heroPhotoSrc: th.heroPhotoSrc,
						} as ComicThumbnailProps,
					};
				} catch {
					return {props};
				}
			}}
		/>
	</>
);
