import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ComicBackdrop, MascotHost, MascotPose} from './comic/ComicAssets';

export type ComicThumbnailProps = {
	brand?: string;
	headline: string;
	subline?: string;
	mascot?: MascotPose;
	mediaSrc?: string;
	heroPhotoSrc?: string;
};

const SANS = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const INK = '#141418';

/**
 * High-CTR 1280x720 Documentary-Comic Thumbnail:
 * - Dramatic full-bleed crisis/editorial background
 * - Illustrated MascotHost on the right (copyright-safe & consistent channel branding;
 *   optional licensed heroPhotoSrc still supported if explicitly provided)
 * - Fixed yellow/black brand badge in top-right corner
 * - Extra-bold yellow/white ALL-CAPS punchline across bottom third
 */
export const ComicThumbnail: React.FC<ComicThumbnailProps> = ({
	brand = 'BRIEFED',
	headline = '-$6 BILLION',
	subline = 'HOW BINANCE GOT HIT',
	mascot = 'shocked',
	mediaSrc = 'comic/art/bg_thumbnail.jpg',
	heroPhotoSrc,
}) => {
	const bgSrc = mediaSrc || 'comic/art/bg_thumbnail.jpg';
	return (
		<AbsoluteFill style={{backgroundColor: '#0c0e13', overflow: 'hidden'}}>
			{bgSrc ? (
				<Img
					src={staticFile(bgSrc)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'contrast(1.16) saturate(1.15) brightness(0.72)',
					}}
				/>
			) : (
				<ComicBackdrop kind="dark_grid" />
			)}

			{/* Red-amber crisis atmosphere + dark vignette */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 68% 36%, rgba(239,68,68,0.22) 0%, transparent 52%), linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.24) 50%, rgba(0,0,0,0.92) 100%)',
				}}
			/>

			{/* Illustrated Mascot Host (default, copyright-safe) or optional licensed hero photo */}
			{heroPhotoSrc ? (
				<div
					style={{
						position: 'absolute',
						right: 44,
						bottom: 16,
						width: 560,
						height: 690,
						zIndex: 18,
						filter: 'drop-shadow(0 0 36px rgba(239, 68, 68, 0.35)) drop-shadow(0 14px 28px rgba(0,0,0,0.85))',
					}}
				>
					<Img
						src={staticFile(heroPhotoSrc)}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							objectPosition: 'bottom center',
						}}
					/>
				</div>
			) : mascot ? (
				<div
					style={{
						position: 'absolute',
						right: 16,
						bottom: -12,
						zIndex: 18,
						filter: 'drop-shadow(0 0 28px rgba(255, 230, 0, 0.28)) drop-shadow(0 14px 28px rgba(0,0,0,0.85))',
					}}
				>
					<MascotHost pose={mascot} size={620} flipX talking={false} />
				</div>
			) : null}

			{/* Fixed Top-Right Brand Badge */}
			<div
				style={{
					position: 'absolute',
					top: 22,
					right: 26,
					backgroundColor: '#ffe600',
					color: INK,
					fontFamily: SANS,
					fontWeight: 900,
					fontSize: 42,
					padding: '8px 24px',
					border: `5px solid ${INK}`,
					letterSpacing: 1.5,
					boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
					zIndex: 30,
				}}
			>
				{brand}
			</div>

			{/* Bottom-Third Extra-Bold Punchline */}
			<div
				style={{
					position: 'absolute',
					left: 42,
					right: 42,
					bottom: 24,
					zIndex: 25,
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
				}}
			>
				{subline && (
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 900,
							fontSize: 48,
							color: '#ffffff',
							textTransform: 'uppercase',
							lineHeight: 1.04,
							WebkitTextStroke: '4px #000000',
							paintOrder: 'stroke fill',
							textShadow: '0 6px 18px rgba(0,0,0,0.95)',
						}}
					>
						{subline}
					</div>
				)}
				<div
					style={{
						fontFamily: SANS,
						fontWeight: 900,
						fontSize: 120,
						color: '#ffe600',
						textTransform: 'uppercase',
						lineHeight: 0.96,
						letterSpacing: -1.5,
						WebkitTextStroke: '7px #000000',
						paintOrder: 'stroke fill',
						textShadow: '0 10px 28px rgba(0,0,0,0.98)',
					}}
				>
					{headline}
				</div>
			</div>
		</AbsoluteFill>
	);
};
