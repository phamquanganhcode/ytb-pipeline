import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Episode, EpisodeProps, overlapBefore, SceneData} from './Episode';
import {Thumbnail, ThumbnailProps} from './Thumbnail';
import {DocuPrototype, DocuPrototypeProps} from './DocuPrototype';
import {DocuEngine, DocuManifest} from './DocuEngine';
import {DocuThumbnail, DocuThumbnailProps} from './DocuThumbnail';
import {ComicExplainer, ComicManifest} from './ComicExplainer';
import {ComicThumbnail, ComicThumbnailProps} from './ComicThumbnail';
import {ShortEpisode, ShortManifest} from './ShortEpisode';

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
					const colonParts = (parts.length > 1 ? parts[1] : parts[0] || '').split(':').map((s) => s.trim());
					const statMatch = rawTitle.match(/(?:^|\s)(-\$?\d+(?:\.\d+)?[MBK]?|\$\d+(?:\.\d+)?[MBK]?|\d+(?:\.\d+)?[MBK]?\s*(?:PCs|MILLION|BILLION|%|DAYS|MINUTES))/i);
					const autoHeadline = statMatch ? statMatch[1].trim().toUpperCase() : colonParts[0] || 'TRUE STORY';
					const autoSubtitle = statMatch ? colonParts[0] || undefined : colonParts[1] || (parts.length > 1 ? parts[0] : undefined);
					const isDisaster =
						manifest.meta?.format === 'disaster' ||
						manifest.meta?.theme === 'disaster' ||
						rawTitle.toUpperCase().includes('CHERNOBYL') ||
						rawTitle.toUpperCase().includes('THẢM HỌA') ||
						rawTitle.toUpperCase().includes('DISASTER');
					const rawThumb = manifest.meta?.thumbnail;
					const thumb = rawThumb && typeof rawThumb === 'object' ? rawThumb : {};
					const defaultBadge = isDisaster
						? manifest.lang === 'vi'
							? 'THẢM HỌA KỸ THUẬT'
							: 'SYSTEM POSTMORTEM'
						: 'TRUE STORY';

					const hasExplicitThumb = Boolean(rawThumb && typeof rawThumb === 'object');
					return {
						props: {
							title: (thumb.title || autoHeadline).toUpperCase().slice(0, 26),
							badge: thumb.badge || defaultBadge,
							subtitle: (thumb.subtitle || autoSubtitle || '').toUpperCase().slice(0, 30) || undefined,
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
			id="DocuThumbnail"
			component={DocuThumbnail}
			width={1280}
			height={720}
			fps={30}
			durationInFrames={1}
			defaultProps={
				{
					layout: 'fern_evidence',
					headline: '-$440M',
					subline: 'IN 45 MINUTES',
					badge: 'SYSTEM POSTMORTEM',
					visual: 'server_fault',
				} as DocuThumbnailProps
			}
			calculateMetadata={async ({props}) => {
				try {
					const manifest = await fetch(staticFile('docu/manifest.json')).then((r) => r.json());
					const scenes = manifest.scenes || [];
					const first = scenes[0] || {};
					const th = manifest.thumbnail || {};
					const hasServers = scenes.some((s: {servers?: unknown[]}) => Array.isArray(s.servers) && s.servers.length > 0);
					const hasChart = scenes.some((s: {points?: unknown[]}) => Array.isArray(s.points) && s.points.length > 0);
					const titleUpper = String(manifest.title || '').toUpperCase();
					const autoVisual =
						hasServers || titleUpper.includes('SERVER')
							? 'server_fault'
							: hasChart
								? 'crash_chart'
								: 'alert_terminal';
					const imgs: string[] = [];
					for (const s of scenes as Array<{media?: {type?: string; src?: string}}>) {
						if (s.media?.type === 'image' && s.media.src && !imgs.includes(s.media.src)) {
							imgs.push(s.media.src);
						}
					}
					const docScene = scenes.find((s: {kind?: string; source?: string}) => s.kind === 'document') || {};
					const statRaw = String(first.stat || '').trim();
					const headRaw = String(first.headline || '').trim();
					const autoQuote =
						statRaw && headRaw
							? `${statRaw.charAt(0).toUpperCase() + statRaw.slice(1).toLowerCase()} ${headRaw.toLowerCase()}.`
							: headRaw || String(manifest.title || 'System failure breakdown.');
					const preferBg =
						imgs.find((src) => src.includes('trading_floor')) ||
						(imgs.some((src) => src.includes('stock_exchange')) ? 'docu/media/new_york_stock_exchange_trading_floor.jpg' : imgs[0]);
					return {
						props: {
							layout: th.layout || 'fern_evidence',
							headline: (th.headline || first.stat || '-$440M').toUpperCase(),
							subline: (th.subline || first.headline || 'IN 45 MINUTES').toUpperCase(),
							badge: th.badge || 'SYSTEM POSTMORTEM',
							proof: th.proof || first.subline,
							mediaSrc: th.mediaSrc || preferBg || imgs[0],
							centerPhotoSrc: th.centerPhotoSrc || imgs[1] || imgs[0],
							centerLabel: th.centerLabel,
							evidenceQuote: th.evidenceQuote || autoQuote,
							highlightPhrase: th.highlightPhrase,
							evidenceSource: th.evidenceSource || docScene.source || 'OFFICIAL RECORD',
							visual: th.visual || autoVisual,
						} as DocuThumbnailProps,
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
							tag: th.tag,
							theme: th.theme,
							showChart: th.showChart,
						} as ComicThumbnailProps,
					};
				} catch {
					return {props};
				}
			}}
		/>

		<Composition
			id="ShortEpisode"
			component={ShortEpisode}
			width={1080}
			height={1920}
			fps={30}
			durationInFrames={840}
			defaultProps={
				{
					title: 'Watch the full story',
					hookBadge: 'FULL BREAKDOWN',
					fps: 30,
					durationInFrames: 840,
					videoSrc: '',
					ctaText: 'WATCH FULL VIDEO BELOW ↓',
					cues: [],
				} as ShortManifest
			}
			calculateMetadata={async ({props}) => {
				try {
					const manifest = await fetch(staticFile('short_manifest.json')).then((r) => r.json());
					return {
						fps: manifest.fps ?? 30,
						durationInFrames: manifest.durationInFrames ?? 840,
						props: manifest as ShortManifest,
					};
				} catch {
					return {props};
				}
			}}
		/>
	</>
);
