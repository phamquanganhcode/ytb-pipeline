import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

export type DocuThumbnailProps = {
	layout?: 'fern_evidence' | 'forensic';
	headline: string;
	subline?: string;
	badge?: string;
	proof?: string;
	mediaSrc?: string;
	centerPhotoSrc?: string;
	centerLabel?: string;
	evidenceQuote?: string;
	highlightPhrase?: string;
	evidenceSource?: string;
	visual?: 'server_fault' | 'crash_chart' | 'alert_terminal';
};

const SANS = "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const BLACK_SANS = "'Arial Black', 'Montserrat', 'Inter', 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace";

const ServerFaultPanel: React.FC = () => {
	const nodes = ['SRV-01', 'SRV-02', 'SRV-03', 'SRV-04', 'SRV-05', 'SRV-06', 'SRV-07', 'SRV-08'];
	return (
		<div
			style={{
				width: 470,
				borderRadius: 16,
				backgroundColor: 'rgba(8, 12, 22, 0.92)',
				border: '2px solid rgba(239, 68, 68, 0.55)',
				boxShadow: '0 24px 60px rgba(0,0,0,0.88), 0 0 40px rgba(239,68,68,0.22)',
				padding: '22px 24px 26px',
				position: 'relative',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 16,
					borderBottom: '1px solid rgba(148,163,184,0.2)',
					paddingBottom: 10,
				}}
			>
				<span style={{fontFamily: MONO, fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#94a3b8'}}>
					PROD CLUSTER // SMARS
				</span>
				<span
					style={{
						fontFamily: MONO,
						fontSize: 14,
						fontWeight: 800,
						color: '#fca5a5',
						backgroundColor: 'rgba(220,38,38,0.24)',
						border: '1px solid #ef4444',
						padding: '3px 10px',
						borderRadius: 4,
					}}
				>
					1 NODE FAILED
				</span>
			</div>

			<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
				{nodes.map((id, idx) => {
					const rogue = idx === 7;
					return (
						<div
							key={id}
							style={{
								position: 'relative',
								padding: '12px 14px',
								borderRadius: 10,
								backgroundColor: rogue ? 'rgba(185, 28, 28, 0.38)' : 'rgba(15, 23, 42, 0.85)',
								border: rogue ? '2.5px solid #ff3b30' : '1.5px solid rgba(34, 197, 94, 0.35)',
								boxShadow: rogue ? '0 0 24px rgba(255, 59, 48, 0.55)' : undefined,
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<div style={{fontFamily: MONO, fontSize: 18, fontWeight: 800, color: rogue ? '#ffffff' : '#cbd5e1'}}>
									{id}
								</div>
								<div style={{fontFamily: MONO, fontSize: 12, color: rogue ? '#fecaca' : '#86efac', marginTop: 2}}>
									{rogue ? 'OLD 2003 CODE' : '2012 PATCH OK'}
								</div>
							</div>
							<div
								style={{
									width: 12,
									height: 12,
									borderRadius: '50%',
									backgroundColor: rogue ? '#ff3b30' : '#22c55e',
									boxShadow: rogue ? '0 0 12px #ff3b30' : '0 0 8px rgba(34,197,94,0.6)',
								}}
							/>
						</div>
					);
				})}
			</div>

			<svg
				viewBox="0 0 470 360"
				width="470"
				height="360"
				style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}
			>
				<ellipse
					cx="342"
					cy="318"
					rx="114"
					ry="38"
					fill="none"
					stroke="#ff3b30"
					strokeWidth="6"
					transform="rotate(-3 342 318)"
				/>
				<path
					d="M -32 245 Q 92 225 206 302"
					fill="none"
					stroke="#ff3b30"
					strokeWidth="8"
					strokeLinecap="round"
				/>
				<polygon points="224,314 186,312 204,282" fill="#ff3b30" stroke="#ffffff" strokeWidth="2.5" />
			</svg>
		</div>
	);
};

const CrashChartPanel: React.FC = () => (
	<div
		style={{
			width: 470,
			height: 340,
			borderRadius: 16,
			backgroundColor: 'rgba(8, 12, 22, 0.92)',
			border: '2px solid rgba(239, 68, 68, 0.55)',
			boxShadow: '0 24px 60px rgba(0,0,0,0.88), 0 0 40px rgba(239,68,68,0.22)',
			padding: '20px 24px',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
		}}
	>
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
			<span style={{fontFamily: MONO, fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#94a3b8'}}>
				REAL-TIME LOSS
			</span>
			<span style={{fontFamily: MONO, fontSize: 18, fontWeight: 900, color: '#ff4d4d'}}>-99.4%</span>
		</div>
		<svg viewBox="0 0 420 240" width="100%" height="245">
			<defs>
				<linearGradient id="docuCrashGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
					<stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
				</linearGradient>
			</defs>
			<line x1="10" y1="55" x2="410" y2="55" stroke="rgba(148,163,184,0.16)" strokeDasharray="6 6" />
			<line x1="10" y1="125" x2="410" y2="125" stroke="rgba(148,163,184,0.16)" strokeDasharray="6 6" />
			<line x1="10" y1="195" x2="410" y2="195" stroke="rgba(148,163,184,0.16)" strokeDasharray="6 6" />
			<path d="M 15 80 L 110 68 L 195 76 L 245 50 L 368 212 L 368 232 L 15 232 Z" fill="url(#docuCrashGrad)" />
			<path
				d="M 15 80 L 110 68 L 195 76 L 245 50 L 364 205"
				fill="none"
				stroke="#ff3b30"
				strokeWidth="8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<polygon points="376,225 344,198 378,184" fill="#ff3b30" stroke="#ffffff" strokeWidth="2.5" />
			<circle cx="245" cy="50" r="8" fill="#ffe600" stroke="#080c16" strokeWidth="3" />
		</svg>
	</div>
);

const AlertTerminalPanel: React.FC = () => (
	<div
		style={{
			width: 470,
			borderRadius: 16,
			backgroundColor: 'rgba(8, 12, 22, 0.94)',
			border: '2px solid rgba(239, 68, 68, 0.65)',
			boxShadow: '0 24px 60px rgba(0,0,0,0.88), 0 0 42px rgba(239,68,68,0.28)',
			overflow: 'hidden',
		}}
	>
		<div
			style={{
				backgroundColor: '#dc2626',
				padding: '12px 20px',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			<span style={{fontFamily: MONO, fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: 2}}>
				KERNEL PANIC // RING 0
			</span>
			<span style={{fontFamily: MONO, fontSize: 14, fontWeight: 800, color: '#fef08a'}}>FATAL</span>
		</div>
		<div style={{padding: '22px 24px', fontFamily: MONO, fontSize: 17, lineHeight: 1.65, color: '#e2e8f0'}}>
			<div style={{color: '#94a3b8'}}>&gt; LOADING CONFIG UPDATE...</div>
			<div style={{color: '#fca5a5', fontWeight: 700}}>&gt; ERR: EXPECTED 20 FIELDS, GOT 21</div>
			<div style={{color: '#ff4d4d', fontWeight: 900, fontSize: 20, marginTop: 8}}>
				STOP: 0x0000001E OUT-OF-BOUNDS READ
			</div>
			<div
				style={{
					marginTop: 18,
					padding: '10px 14px',
					borderRadius: 8,
					backgroundColor: 'rgba(239, 68, 68, 0.16)',
					border: '1px solid rgba(239, 68, 68, 0.5)',
					color: '#fecaca',
					fontSize: 16,
					fontWeight: 700,
				}}
			>
				STATUS: BOOT LOOP DETECTED
			</div>
		</div>
	</div>
);

/**
 * Authentic `fern`-style Real-Photo + Circled Real-Evidence Thumbnail:
 * - Real archival scene filling the background (graded dark, realistic depth)
 * - Top authentic dark social/document evidence quote with blurred source & hand-drawn red circle loop
 * - Center-bottom real focal photo cutout framed in blazing crimson neon glow
 */
const FernEvidenceThumbnail: React.FC<DocuThumbnailProps> = ({
	mediaSrc = 'docu/media/new_york_stock_exchange_trading_floor.jpg',
	centerPhotoSrc = 'docu/media/wikimedia_foundation_servers_rack.jpg',
	centerLabel,
	evidenceQuote = 'We just lost $440 million in 45 minutes.',
	highlightPhrase,
	evidenceSource = 'SEC Order #70694 • Oct 16, 2013',
}) => {
	const quote = evidenceQuote.trim();
	const phrase = highlightPhrase && quote.toLowerCase().includes(highlightPhrase.toLowerCase()) ? highlightPhrase : quote;
	const idx = quote.toLowerCase().indexOf(phrase.toLowerCase());
	const before = idx > 0 ? quote.slice(0, idx) : '';
	const match = idx >= 0 ? quote.slice(idx, idx + phrase.length) : quote;
	const after = idx >= 0 ? quote.slice(idx + phrase.length) : '';

	return (
		<AbsoluteFill style={{backgroundColor: '#090b10', overflow: 'hidden'}}>
			{/* 1. Full-bleed real archival photograph */}
			{mediaSrc ? (
				<Img
					src={staticFile(mediaSrc)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: 'center 55%',
						filter: 'contrast(1.12) saturate(0.88) brightness(0.76)',
					}}
				/>
			) : null}

			{/* 2. Top dark evidence header gradient + clear real photo lower half */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(16,18,22,0.96) 0%, rgba(16,18,22,0.90) 32%, rgba(12,14,18,0.28) 54%, rgba(6,8,12,0.48) 100%)',
				}}
			/>

			{/* 3. Authentic Dark Post / Document Evidence Strip (Top) */}
			<div
				style={{
					position: 'absolute',
					top: 34,
					left: 0,
					right: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					zIndex: 20,
					padding: '0 64px',
				}}
			>
				{/* Blurred source identity row (exact fern social-post / leaked-doc aesthetic) */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						marginBottom: 14,
						alignSelf: 'flex-start',
						marginLeft: 130,
						filter: 'blur(4.5px)',
						opacity: 0.72,
					}}
				>
					<div
						style={{
							width: 54,
							height: 54,
							borderRadius: '50%',
							background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
						}}
					/>
					<div style={{fontFamily: SANS, fontSize: 24, fontWeight: 700, color: '#e2e8f0'}}>
						{evidenceSource}
					</div>
				</div>

				{/* Clean natural sentence-case quote with uniform-stroke hand-drawn red marker loop */}
				<div
					style={{
						fontFamily: SANS,
						fontSize: quote.length > 48 ? 36 : 42,
						fontWeight: 600,
						lineHeight: 1.25,
						color: '#f8fafc',
						textAlign: 'center',
						textShadow: '0 4px 18px rgba(0,0,0,0.85)',
						maxWidth: 1080,
					}}
				>
					{before}
					<span style={{position: 'relative', display: 'inline-block', padding: '16px 34px', margin: '0 4px'}}>
						{match}
						<svg
							viewBox="0 0 400 120"
							preserveAspectRatio="none"
							style={{
								position: 'absolute',
								left: '-4%',
								top: '-10%',
								width: '108%',
								height: '120%',
								pointerEvents: 'none',
								overflow: 'visible',
								filter: 'drop-shadow(0 0 10px rgba(255, 40, 40, 0.7))',
							}}
						>
							<path
								d="M 22 68 C 12 24, 105 8, 210 10 C 335 12, 390 28, 388 62 C 386 96, 295 108, 192 106 C 78 104, 10 88, 16 56 C 22 24, 145 14, 255 16"
								fill="none"
								stroke="#ff2b2b"
								strokeWidth="5.5"
								vectorEffect="non-scaling-stroke"
								strokeLinecap="round"
							/>
						</svg>
					</span>
					{after}
				</div>
			</div>

			{/* 4. Center-Bottom Real Focal Object Card with Blazing Red Glow */}
			{centerPhotoSrc ? (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						bottom: 34,
						transform: 'translateX(-50%)',
						width: 560,
						height: 360,
						borderRadius: 18,
						overflow: 'hidden',
						border: '4px solid #ff2e2e',
						boxShadow:
							'0 0 45px rgba(255, 36, 36, 0.85), 0 0 90px rgba(255, 36, 36, 0.35), 0 24px 50px rgba(0,0,0,0.92)',
						zIndex: 18,
						backgroundColor: '#05070c',
					}}
				>
					<Img
						src={staticFile(centerPhotoSrc)}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							objectPosition: '70% center',
							filter: 'contrast(1.18) brightness(0.96)',
						}}
					/>
					{/* Crimson spotlight over the single offending server bay */}
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background:
								'radial-gradient(circle at 68% 48%, rgba(255, 35, 35, 0.42) 0%, rgba(255, 35, 35, 0.12) 38%, rgba(0,0,0,0.45) 100%)',
						}}
					/>
					{centerLabel ? (
						<div
							style={{
								position: 'absolute',
								left: 20,
								bottom: 18,
								backgroundColor: 'rgba(10, 12, 18, 0.88)',
								border: '2px solid #ff3b30',
								borderRadius: 6,
								padding: '6px 14px',
								fontFamily: MONO,
								fontSize: 20,
								fontWeight: 800,
								color: '#ffffff',
								letterSpacing: 1.5,
								boxShadow: '0 6px 18px rgba(0,0,0,0.75)',
							}}
						>
							{centerLabel}
						</div>
					) : null}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/**
 * Forensic Dark-Documentary 1280x720 Thumbnail (supports both `fern_evidence` real-photo style and `forensic` telemetry panel).
 */
export const DocuThumbnail: React.FC<DocuThumbnailProps> = (props) => {
	if ((props.layout ?? 'fern_evidence') === 'fern_evidence') {
		return <FernEvidenceThumbnail {...props} />;
	}

	const {
		headline = '-$440M',
		subline = 'IN 45 MINUTES',
		badge = 'SYSTEM POSTMORTEM',
		proof,
		mediaSrc,
		visual = 'server_fault',
	} = props;
	const len = headline.trim().length;
	const headlineSize = len <= 7 ? 152 : len <= 11 ? 122 : len <= 16 ? 98 : 80;
	const subLen = (subline ?? '').trim().length;
	const subSize = subLen <= 18 ? 42 : subLen <= 26 ? 34 : 28;

	return (
		<AbsoluteFill style={{backgroundColor: '#06080f', overflow: 'hidden'}}>
			{mediaSrc ? (
				<Img
					src={staticFile(mediaSrc)}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						filter: 'contrast(1.25) saturate(0.42) brightness(0.62)',
						transform: 'scale(1.03)',
					}}
				/>
			) : null}

			<svg viewBox="0 0 1280 720" width="1280" height="720" style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2}}>
				<defs>
					<pattern id="docuThumbGrid" width="48" height="48" patternUnits="userSpaceOnUse">
						<path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
					</pattern>
				</defs>
				<rect width="1280" height="720" fill="url(#docuThumbGrid)" />
			</svg>

			<AbsoluteFill
				style={{
					background: `
						radial-gradient(circle at 76% 48%, rgba(239, 68, 68, 0.28) 0%, transparent 55%),
						linear-gradient(95deg, rgba(5,7,14,0.94) 0%, rgba(7,10,18,0.84) 46%, rgba(7,10,18,0.32) 76%, rgba(5,7,14,0.52) 100%)
					`,
					zIndex: 3,
				}}
			/>

			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 0,
					bottom: 0,
					width: 650,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'flex-start',
					zIndex: 20,
				}}
			>
				{badge ? (
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 10,
							backgroundColor: 'rgba(15, 23, 42, 0.88)',
							borderLeft: '5px solid #ef4444',
							padding: '8px 18px',
							borderRadius: 4,
							marginBottom: 24,
							boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
						}}
					>
						<span style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block'}} />
						<span style={{fontFamily: MONO, fontSize: 20, fontWeight: 800, letterSpacing: 3, color: '#f1f5f9'}}>
							{badge}
						</span>
					</div>
				) : null}

				<div
					style={{
						fontFamily: BLACK_SANS,
						fontWeight: 900,
						fontSize: headlineSize,
						lineHeight: 0.94,
						color: '#ffffff',
						textTransform: 'uppercase',
						letterSpacing: -2,
						textShadow: '0 8px 0 rgba(185, 28, 28, 0.85), 0 18px 36px rgba(0,0,0,0.96)',
						marginBottom: 24,
						maxWidth: 640,
					}}
				>
					{headline}
				</div>

				{subline ? (
					<div
						style={{
							backgroundColor: '#dc2626',
							color: '#ffffff',
							fontFamily: BLACK_SANS,
							fontWeight: 900,
							fontSize: subSize,
							lineHeight: 1.08,
							textTransform: 'uppercase',
							letterSpacing: 1,
							padding: '12px 24px',
							borderRadius: 6,
							border: '2px solid rgba(255,255,255,0.22)',
							boxShadow: '0 14px 32px rgba(0,0,0,0.75)',
							marginBottom: proof ? 22 : 0,
							maxWidth: 630,
						}}
					>
						{subline}
					</div>
				) : null}

				{proof ? (
					<div
						style={{
							fontFamily: MONO,
							fontSize: 21,
							fontWeight: 800,
							letterSpacing: 2,
							color: '#fbbf24',
							textShadow: '0 2px 12px rgba(0,0,0,0.95)',
							borderTop: '2px solid rgba(239, 68, 68, 0.5)',
							paddingTop: 12,
						}}
					>
						{proof}
					</div>
				) : null}
			</div>

			<div
				style={{
					position: 'absolute',
					right: 54,
					top: 0,
					bottom: 54,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 15,
				}}
			>
				{visual === 'crash_chart' ? (
					<CrashChartPanel />
				) : visual === 'alert_terminal' ? (
					<AlertTerminalPanel />
				) : (
					<ServerFaultPanel />
				)}
			</div>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					boxShadow: 'inset 0 0 0 6px #04060b, inset 0 0 48px rgba(0,0,0,0.85)',
					pointerEvents: 'none',
					zIndex: 30,
				}}
			/>
		</AbsoluteFill>
	);
};
