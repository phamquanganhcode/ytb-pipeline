import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/** Real-time per-frame mouth openness (0=closed, 1=slight, 2=open, 3=wide) computed from narration audio. */
export const MouthLevelContext = React.createContext<number>(0);

export type MascotPose =
	| 'explaining'
	| 'pointing'
	| 'shades'
	| 'deadpan'
	| 'shocked'
	| 'skeptical';

export type ChibiRole =
	| 'trader'
	| 'investor'
	| 'hacker'
	| 'boss'
	| 'engineer'
	| 'fbi'
	| 'support'
	| 'dad'
	| 'victim';

export type ChibiMood = 'neutral' | 'happy' | 'panic' | 'smug' | 'sad';

export type ComicIconName =
	| 'bitcoin'
	| 'eth'
	| 'usdt'
	| 'usdc'
	| 'xrp'
	| 'wallet'
	| 'bank'
	| 'building'
	| 'laptop'
	| 'document'
	| 'cash'
	| 'skull'
	| 'lock'
	| 'shield'
	| 'globe'
	| 'fire'
	| 'warning'
	| 'chart'
	| 'red_x'
	| 'freeze'
	| 'bug';

export type BackdropKind =
	| 'dark_grid'
	| 'light_paper'
	| 'candlestick_chart'
	| 'office'
	| 'living_room'
	| 'bank_counter'
	| 'hacker_room';

const INK = '#141418';

/** Shared natural blink helper: returns true for 4 frames every ~period frames. */
const useBlink = (frame: number, offset = 0, period = 104): boolean => {
	const mod = (frame + offset) % period;
	return mod >= period - 4;
};

/**
 * Lóng-Style 2D Comic Investigator Host (matches reference image 2 & 3 aesthetic):
 * - Bold uniform ink outlines, big expressive round head, pill-shaped trench coat torso
 * - Floating cartoon hands (no awkward elbow joints or broken arm paths)
 * - Static expressive mouth (NO lip-sync flapping), calm held pose + natural blink only
 */
export const MascotHost: React.FC<{
	pose?: MascotPose;
	size?: number;
	flipX?: boolean;
	talking?: boolean;
	stickerOutline?: boolean;
	style?: React.CSSProperties;
}> = ({
	pose = 'explaining',
	size = 420,
	flipX = false,
	talking = true,
	style,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const pop = talking ? spring({ frame, fps, config: { damping: 16, stiffness: 150 } }) : 1;
	const blink = talking && pose !== 'shocked' && pose !== 'shades' && useBlink(frame, 19, 120);
	const handFloat = talking ? Math.sin(frame / 28) * 3 : 0;
	const shineX = talking ? interpolate(frame % 110, [0, 18, 110], [-36, 46, 46], { extrapolateRight: 'clamp' }) : 6;

	const renderFace = () => {
		if (pose === 'shades') {
			return (
				<g>
					<defs>
						<clipPath id="hostShadesClip">
							<circle cx="136" cy="122" r="20" />
							<circle cx="184" cy="122" r="20" />
						</clipPath>
					</defs>
					<path d="M 118 95 Q 136 90 152 94" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					<path d="M 168 94 Q 184 90 202 95" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					<line x1="156" y1="121" x2="164" y2="121" stroke={INK} strokeWidth="5.5" />
					<circle cx="136" cy="122" r="20" fill="#18181f" stroke={INK} strokeWidth="5.5" />
					<circle cx="184" cy="122" r="20" fill="#18181f" stroke={INK} strokeWidth="5.5" />
					<g clipPath="url(#hostShadesClip)">
						<polygon
							points={`${120 + shineX},96 ${134 + shineX},96 ${116 + shineX},148 ${102 + shineX},148`}
							fill="rgba(255,255,255,0.42)"
						/>
						<polygon
							points={`${168 + shineX},96 ${182 + shineX},96 ${164 + shineX},148 ${150 + shineX},148`}
							fill="rgba(255,255,255,0.42)"
						/>
					</g>
					<path d="M 147 160 Q 160 168 175 158" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
				</g>
			);
		}

		const pupilR = pose === 'shocked' ? 3.5 : 5;
		const eyeRy = pose === 'shocked' ? 12 : pose === 'deadpan' ? 6.5 : 9.5;
		const lookX = pose === 'pointing' ? 3 : pose === 'skeptical' ? -2 : 0;

		return (
			<g>
				{/* Eyebrows */}
				{pose === 'shocked' ? (
					<>
						<path d="M 118 93 Q 136 82 152 92" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
						<path d="M 168 92 Q 184 82 202 93" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					</>
				) : pose === 'skeptical' ? (
					<>
						<path d="M 118 100 Q 136 96 152 101" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
						<path d="M 168 93 Q 184 84 202 92" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					</>
				) : (
					<>
						<path d="M 118 98 Q 136 93 152 98" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
						<path d="M 168 98 Q 184 93 202 98" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					</>
				)}

				{/* Eyes */}
				{blink ? (
					<>
						<path d="M 124 122 Q 136 128 148 122" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
						<path d="M 172 122 Q 184 128 196 122" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
					</>
				) : (
					<>
						<ellipse cx="136" cy="122" rx="11.5" ry={eyeRy} fill="#ffffff" stroke={INK} strokeWidth="4" />
						<ellipse cx="184" cy="122" rx="11.5" ry={eyeRy} fill="#ffffff" stroke={INK} strokeWidth="4" />
						<circle cx={136 + lookX} cy="122" r={pupilR} fill={INK} />
						<circle cx={184 + lookX} cy="122" r={pupilR} fill={INK} />
						<circle cx={138 + lookX} cy="119.5" r="2" fill="#ffffff" />
						<circle cx={186 + lookX} cy="119.5" r="2" fill="#ffffff" />
						{(pose === 'deadpan' || pose === 'skeptical') && (
							<>
								<line x1="123" y1="115" x2="149" y2="115" stroke={INK} strokeWidth="4" strokeLinecap="round" />
								{pose === 'deadpan' && <line x1="171" y1="115" x2="197" y2="115" stroke={INK} strokeWidth="4" strokeLinecap="round" />}
							</>
						)}
					</>
				)}

				{/* Round Signature Glasses */}
				<circle cx="136" cy="122" r="20" fill="rgba(255,255,255,0.08)" stroke={INK} strokeWidth="4.8" />
				<circle cx="184" cy="122" r="20" fill="rgba(255,255,255,0.08)" stroke={INK} strokeWidth="4.8" />
				<line x1="156" y1="121" x2="164" y2="121" stroke={INK} strokeWidth="4.8" />
				<line x1="116" y1="120" x2="104" y2="118" stroke={INK} strokeWidth="4.5" />
				<line x1="204" y1="120" x2="216" y2="118" stroke={INK} strokeWidth="4.5" />

				{/* Static Expressive Mouth (no lip-sync flapping) */}
				{pose === 'shocked' ? (
					<g>
						<path
							d="M 143 154 Q 160 145 177 154 Q 180 173 160 175 Q 140 173 143 154 Z"
							fill="#5c1622"
							stroke={INK}
							strokeWidth="4.5"
							strokeLinejoin="round"
						/>
						<path d="M 147 154 L 173 154 L 171 159 L 149 159 Z" fill="#ffffff" />
						<ellipse cx="160" cy="170" rx="10" ry="4" fill="#e06377" />
					</g>
				) : pose === 'deadpan' || pose === 'skeptical' ? (
					<path d="M 147 161 Q 160 159 173 161" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
				) : (
					<path d="M 146 158 Q 160 168 174 158" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
				)}
			</g>
		);
	};

	const renderFloatingHands = () => {
		if (pose === 'shocked') {
			return (
				<g transform={`translate(0, ${handFloat})`}>
					{/* Left floating shocked palm */}
					<path
						d="M 46 244 L 38 206 Q 42 198 49 205 L 55 220 L 56 196 Q 62 190 67 197 L 68 218 L 74 200 Q 80 195 84 203 L 80 226 L 89 218 Q 95 221 89 232 L 77 248 Q 62 254 46 244 Z"
						fill="#fde3d2"
						stroke={INK}
						strokeWidth="6"
						strokeLinejoin="round"
					/>
					{/* Right floating shocked palm */}
					<path
						d="M 274 244 L 282 206 Q 278 198 271 205 L 265 220 L 264 196 Q 258 190 253 197 L 252 218 L 246 200 Q 240 195 236 203 L 240 226 L 231 218 Q 225 221 231 232 L 243 248 Q 258 254 274 244 Z"
						fill="#fde3d2"
						stroke={INK}
						strokeWidth="6"
						strokeLinejoin="round"
					/>
				</g>
			);
		}
		if (pose === 'pointing') {
			return (
				/* Floating pointing hand (exact reference image 3 style!) */
				<g transform={`translate(0, ${handFloat})`}>
					<path
						d="M 232 232 Q 226 218 240 210 L 274 176 Q 284 168 292 177 Q 297 185 288 195 L 268 214 L 278 218 Q 286 224 280 234 L 272 246 Q 254 256 238 246 Z"
						fill="#fde3d2"
						stroke={INK}
						strokeWidth="6.5"
						strokeLinejoin="round"
					/>
					<path d="M 256 222 Q 266 222 268 230" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
					<path d="M 250 232 Q 260 232 262 240" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
				</g>
			);
		}
		if (pose === 'explaining') {
			return (
				/* Two floating open palms shrugging/explaining (exact reference image 2 style!) */
				<g transform={`translate(0, ${handFloat})`}>
					<path
						d="M 86 244 Q 68 248 48 232 Q 38 224 44 216 Q 52 212 64 218 L 46 204 Q 40 196 49 192 Q 56 190 70 202 L 62 192 Q 62 184 71 188 L 90 208 Q 98 228 86 244 Z"
						fill="#fde3d2"
						stroke={INK}
						strokeWidth="6"
						strokeLinejoin="round"
					/>
					<path
						d="M 234 244 Q 252 248 272 232 Q 282 224 276 216 Q 268 212 256 218 L 274 204 Q 280 196 271 192 Q 264 190 250 202 L 258 192 Q 258 184 249 188 L 230 208 Q 222 228 234 244 Z"
						fill="#fde3d2"
						stroke={INK}
						strokeWidth="6"
						strokeLinejoin="round"
					/>
				</g>
			);
		}
		/* Deadpan / skeptical / shades: single floating explaining/pointing hand on right */
		return (
			<g transform={`translate(0, ${handFloat})`}>
				<path
					d="M 236 248 Q 254 252 272 236 Q 282 228 276 220 Q 268 216 256 222 L 272 208 Q 278 200 269 196 Q 262 194 248 206 L 232 220 Q 224 236 236 248 Z"
					fill="#fde3d2"
					stroke={INK}
					strokeWidth="6"
					strokeLinejoin="round"
				/>
			</g>
		);
	};

	return (
		<div
			style={{
				width: size,
				height: size,
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'center',
				transform: `scale(${0.92 + 0.08 * pop}) scaleX(${flipX ? -1 : 1})`,
				opacity: pop,
				filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))',
				pointerEvents: 'none',
				...style,
			}}
		>
			<svg viewBox="0 0 320 340" width="100%" height="100%" style={{ overflow: 'visible' }}>
				{/* Pill-Shaped Trench Coat Torso (exact Lóng silhouette — clean, no broken arms!) */}
				<path
					d="M 102 224 Q 108 192 160 192 Q 212 192 218 224 L 226 340 L 94 340 Z"
					fill="#c99352"
					stroke={INK}
					strokeWidth="7"
					strokeLinejoin="round"
				/>
				{/* Charcoal turtleneck center */}
				<path
					d="M 134 194 L 186 194 L 182 340 L 138 340 Z"
					fill="#3c464f"
					stroke={INK}
					strokeWidth="5.5"
					strokeLinejoin="round"
				/>
				{/* Turtleneck collar */}
				<path
					d="M 138 184 Q 160 192 182 184 L 185 212 Q 160 220 135 212 Z"
					fill="#47535e"
					stroke={INK}
					strokeWidth="5.5"
					strokeLinejoin="round"
				/>
				{/* Clean Trench Coat Lapels */}
				<path
					d="M 134 196 L 116 226 L 130 244 L 118 264 L 138 340"
					fill="none"
					stroke={INK}
					strokeWidth="5.5"
					strokeLinejoin="round"
				/>
				<path
					d="M 186 196 L 204 226 L 190 244 L 202 264 L 182 340"
					fill="none"
					stroke={INK}
					strokeWidth="5.5"
					strokeLinejoin="round"
				/>

				{/* Big Round Head */}
				<g>
					{/* Ears */}
					<circle cx="102" cy="126" r="13" fill="#fde3d2" stroke={INK} strokeWidth="6" />
					<circle cx="218" cy="126" r="13" fill="#fde3d2" stroke={INK} strokeWidth="6" />
					{/* Round Head Base */}
					<ellipse cx="160" cy="124" rx="58" ry="60" fill="#fde3d2" stroke={INK} strokeWidth="7" />
					{/* Messy Dark Hair Cap */}
					<path
						d="M 102 118 Q 98 64 158 56 Q 218 60 218 118 Q 206 94 188 86 Q 170 96 154 82 Q 134 96 116 88 Q 106 98 102 118 Z"
						fill="#4a2e20"
						stroke={INK}
						strokeWidth="6.5"
						strokeLinejoin="round"
					/>
					{/* Subtle cheeks */}
					<path d="M 118 148 Q 124 154 132 152" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
					<path d="M 202 148 Q 196 154 188 152" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
					{/* Face */}
					{renderFace()}

					{/* Shocked Comic FX */}
					{pose === 'shocked' && (
						<g>
							<path
								d="M 226 80 Q 234 92 226 98 Q 218 92 226 80 Z"
								fill="#38bdf8"
								stroke={INK}
								strokeWidth="3.5"
							/>
							<line x1="90" y1="54" x2="74" y2="38" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
							<line x1="230" y1="54" x2="246" y2="38" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
						</g>
					)}
				</g>

				{/* Floating Hands */}
				{renderFloatingHands()}
			</svg>
		</div>
	);
};

/**
 * Lóng-Style 2D Pill-Body Chibi Cast (matches reference images 2 & 3):
 * - Clean tapered pill torso with thick crisp #141418 outline
 * - Floating cartoon hands (shrugging, pointing, holding laptop, grabbing head)
 * - Calm held poses + natural blinking (zero hyperactive jitter)
 */
export const ChibiCharacter: React.FC<{
	role: ChibiRole;
	mood?: ChibiMood;
	label?: string;
	size?: number;
	delay?: number;
	flipX?: boolean;
	speaking?: boolean;
}> = ({ role, mood = 'neutral', size = 390, delay = 0, flipX = false }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const pop = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 150 } });
	const blink = mood !== 'panic' && useBlink(frame, role.length * 13, 114);
	const handFloat = Math.sin((frame + delay * 3) / 30) * 2.5;

	const kind =
		role === 'hacker' || role === 'fbi'
			? 'hacker'
			: role === 'victim'
				? 'victim'
				: role === 'engineer' || role === 'boss' || role === 'support'
					? 'engineer'
					: 'trader';

	const torsoColor =
		kind === 'hacker'
			? '#263147'
			: kind === 'victim'
				? '#dc2626'
				: kind === 'engineer'
					? '#334155'
					: '#1e3a5f';

	const hairColor =
		kind === 'victim'
			? '#16a34a'
			: kind === 'engineer'
				? '#1e293b'
				: '#3f2a1d';

	const renderChibiFace = () => {
		if (kind === 'hacker') {
			return (
				<g>
					<path d="M 104 114 L 130 122" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
					<path d="M 176 114 L 150 122" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
					{blink ? (
						<>
							<line x1="108" y1="132" x2="128" y2="132" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
							<line x1="152" y1="132" x2="172" y2="132" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
						</>
					) : (
						<>
							<path d="M 106 128 Q 118 140 130 131 Q 118 124 106 128 Z" fill="#ffffff" stroke={INK} strokeWidth="4" />
							<path d="M 174 128 Q 162 140 150 131 Q 162 124 174 128 Z" fill="#ffffff" stroke={INK} strokeWidth="4" />
						</>
					)}
					{/* Black mask */}
					<path
						d="M 88 144 Q 140 134 192 144 Q 190 182 140 186 Q 90 182 88 144 Z"
						fill="#1f2430"
						stroke={INK}
						strokeWidth="5.5"
						strokeLinejoin="round"
					/>
				</g>
			);
		}

		return (
			<g>
				{/* Brows */}
				{mood === 'sad' || mood === 'panic' ? (
					<>
						<path d="M 104 114 Q 118 106 128 112" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
						<path d="M 176 114 Q 162 106 152 112" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
					</>
				) : (
					<>
						<path d="M 106 112 Q 118 108 128 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<path d="M 152 112 Q 162 108 174 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
					</>
				)}

				{/* Eyes */}
				{blink ? (
					<>
						<path d="M 108 130 Q 118 136 128 130" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
						<path d="M 152 130 Q 162 136 172 130" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
					</>
				) : (
					<>
						<circle cx="118" cy="130" r={mood === 'panic' ? 11 : 8.5} fill="#ffffff" stroke={INK} strokeWidth="4.2" />
						<circle cx="162" cy="130" r={mood === 'panic' ? 11 : 8.5} fill="#ffffff" stroke={INK} strokeWidth="4.2" />
						<circle cx="118" cy="130" r={mood === 'panic' ? 3.5 : 4.5} fill={INK} />
						<circle cx="162" cy="130" r={mood === 'panic' ? 3.5 : 4.5} fill={INK} />
					</>
				)}

				{/* Engineer glasses */}
				{kind === 'engineer' && (
					<g>
						<circle cx="118" cy="130" r="15" fill="none" stroke={INK} strokeWidth="4.2" />
						<circle cx="162" cy="130" r="15" fill="none" stroke={INK} strokeWidth="4.2" />
						<line x1="133" y1="130" x2="147" y2="130" stroke={INK} strokeWidth="4.2" />
					</g>
				)}

				{/* Cheek dimples (reference image 3 charm) */}
				<path d="M 104 152 Q 110 158 116 156" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
				<path d="M 176 152 Q 170 158 164 156" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />

				{/* Static Expressive Mouth */}
				{mood === 'panic' ? (
					<path
						d="M 122 158 Q 140 148 158 158 Q 160 174 140 175 Q 120 174 122 158 Z"
						fill="#7f1d1d"
						stroke={INK}
						strokeWidth="4.5"
					/>
				) : mood === 'sad' ? (
					<path d="M 128 164 Q 140 154 152 164" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
				) : mood === 'happy' ? (
					<path
						d="M 126 156 Q 140 170 154 156 Z"
						fill="#ffffff"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>
				) : (
					<path d="M 129 160 Q 140 163 151 160" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
				)}
			</g>
		);
	};

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				transform: `scale(${0.92 + 0.08 * pop})`,
				opacity: pop,
			}}
		>
			<div
				style={{
					width: size,
					height: size,
					transform: `scaleX(${flipX ? -1 : 1})`,
					filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.26))',
				}}
			>
				<svg viewBox="0 0 280 300" width="100%" height="100%" style={{ overflow: 'visible' }}>
					{/* Clean Pill-Shaped Torso (exact reference image 2 & 3 shape!) */}
					<path
						d="M 94 214 Q 100 186 140 186 Q 180 186 186 214 L 194 298 L 86 298 Z"
						fill={torsoColor}
						stroke={INK}
						strokeWidth="7"
						strokeLinejoin="round"
					/>

					{/* Simple Crisp Outfit Accents */}
					{kind === 'trader' && (
						<>
							<path d="M 122 188 L 140 212 L 158 188 Z" fill="#ffffff" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
							<polygon points="140,206 134,254 140,264 146,254" fill="#3b82f6" stroke={INK} strokeWidth="4" />
						</>
					)}
					{kind === 'engineer' && (
						<>
							{/* Blue open jacket + dark tee + yellow diamond badge (exact reference image 3!) */}
							<path d="M 94 214 Q 100 190 120 188 L 122 268 L 90 268 Z" fill="#60a5fa" stroke={INK} strokeWidth="5.5" strokeLinejoin="round" />
							<path d="M 186 214 Q 180 190 160 188 L 158 268 L 190 268 Z" fill="#60a5fa" stroke={INK} strokeWidth="5.5" strokeLinejoin="round" />
							<polygon points="140,214 148,224 140,234 132,224" fill="#facc15" />
						</>
					)}
					{kind === 'victim' && (
						<>
							<line x1="128" y1="196" x2="126" y2="236" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
							<line x1="152" y1="196" x2="154" y2="236" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
						</>
					)}

					{/* Big Round Head */}
					<g>
						{kind === 'hacker' && (
							<path
								d="M 68 144 Q 64 56 140 50 Q 216 56 212 144 Q 208 194 140 198 Q 72 194 68 144 Z"
								fill="#263147"
								stroke={INK}
								strokeWidth="7"
							/>
						)}
						{kind !== 'hacker' && (
							<>
								<circle cx="82" cy="134" r="12" fill="#fde3d2" stroke={INK} strokeWidth="6" />
								<circle cx="198" cy="134" r="12" fill="#fde3d2" stroke={INK} strokeWidth="6" />
							</>
						)}
						<ellipse cx="140" cy="128" rx="56" ry="56" fill="#fde3d2" stroke={INK} strokeWidth="7" />

						{/* Clean Hair Cap */}
						<path
							d={
								kind === 'hacker'
									? 'M 88 112 Q 104 82 140 80 Q 176 82 192 112 Q 170 98 140 100 Q 110 98 88 112 Z'
									: 'M 82 122 Q 78 68 140 62 Q 202 68 198 122 Q 186 96 164 90 Q 142 100 124 88 Q 102 98 82 122 Z'
							}
							fill={hairColor}
							stroke={INK}
							strokeWidth="6"
							strokeLinejoin="round"
						/>
						{renderChibiFace()}

						{(mood === 'panic' || mood === 'sad') && (
							<path
								d="M 204 94 Q 212 106 204 112 Q 196 106 204 94 Z"
								fill="#38bdf8"
								stroke={INK}
								strokeWidth="3.5"
							/>
						)}
					</g>

					{/* Floating Cartoon Hands / Props (reference image 2 & 3 style — ZERO ugly elbows!) */}
					{mood === 'panic' ? (
						<g transform={`translate(0, ${handFloat})`}>
							{/* Two floating hands raised near head in panic */}
							<circle cx="64" cy="158" r="18" fill="#fde3d2" stroke={INK} strokeWidth="6" />
							<circle cx="216" cy="158" r="18" fill="#fde3d2" stroke={INK} strokeWidth="6" />
						</g>
					) : kind === 'hacker' ? (
						/* Floating laptop + two resting hands */
						<g transform={`translate(0, ${handFloat * 0.6})`}>
							<polygon
								points="120,256 218,256 232,208 134,208"
								fill="#334155"
								stroke={INK}
								strokeWidth="5.5"
								strokeLinejoin="round"
							/>
							<polygon points="138,214 226,214 214,250 126,250" fill="#0f172a" />
							<circle cx="176" cy="232" r="6" fill="#22d3ee" />
							<circle cx="122" cy="256" r="13" fill="#fde3d2" stroke={INK} strokeWidth="5.5" />
							<circle cx="154" cy="256" r="13" fill="#fde3d2" stroke={INK} strokeWidth="5.5" />
						</g>
					) : (
						/* Floating shrugging / pointing cartoon hands (exact reference image 2 & 3!) */
						<g transform={`translate(0, ${handFloat})`}>
							<path
								d="M 74 234 Q 58 238 42 224 Q 34 218 40 210 Q 48 206 58 212 L 44 200 Q 38 192 48 188 Q 54 188 68 200 L 78 214 Q 84 226 74 234 Z"
								fill="#fde3d2"
								stroke={INK}
								strokeWidth="5.5"
								strokeLinejoin="round"
							/>
							<path
								d="M 206 234 Q 222 238 238 224 Q 246 218 240 210 Q 232 206 222 212 L 236 200 Q 242 192 232 188 Q 226 188 212 200 L 202 214 Q 196 226 206 234 Z"
								fill="#fde3d2"
								stroke={INK}
								strokeWidth="5.5"
								strokeLinejoin="round"
							/>
						</g>
					)}
				</svg>
			</div>
		</div>
	);
};

/**
 * Clean organic hand-drawn comic speech bubble (matches Lóng's 00:30 & 08:42 bubbles).
 */
export const SpeechBubble: React.FC<{
	text: string;
	tail?: 'left' | 'right' | 'bottom';
	delay?: number;
	maxWidth?: number;
}> = ({ text, tail = 'bottom', delay = 10, maxWidth = 460 }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const pop = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 185 } });

	return (
		<div
			style={{
				position: 'relative',
				maxWidth,
				backgroundColor: '#ffffff',
				border: `4px solid ${INK}`,
				borderRadius: 46,
				padding: '22px 34px',
				transform: `scale(${pop})`,
				opacity: pop,
				fontFamily: "'Georgia', 'Comic Sans MS', 'Segoe UI', serif",
				fontWeight: 700,
				fontSize: 31,
				lineHeight: 1.28,
				color: INK,
				textAlign: 'center',
			}}
		>
			{text}
			<div
				style={{
					position: 'absolute',
					width: 24,
					height: 24,
					backgroundColor: '#ffffff',
					borderRight: `5px solid ${INK}`,
					borderBottom: `5px solid ${INK}`,
					...(tail === 'bottom'
						? { bottom: -15, left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
						: tail === 'left'
							? { bottom: -14, left: 48, transform: 'rotate(45deg)' }
							: { bottom: -14, right: 48, transform: 'rotate(45deg)' }),
				}}
			/>
		</div>
	);
};

/**
 * Flat-vector comic icon library with crisp dark ink outlines.
 */
export const ComicIcon: React.FC<{
	name: ComicIconName;
	size?: number;
	crossedOut?: boolean;
}> = ({ name, size = 120, crossedOut = false }) => {
	const renderShape = () => {
		switch (name) {
			case 'bitcoin':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#f7931a" stroke={INK} strokeWidth="6" />
						<circle cx="64" cy="64" r="40" fill="none" stroke="#fde68a" strokeWidth="3" />
						<text x="64" y="82" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							₿
						</text>
					</g>
				);
			case 'eth':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#6366f1" stroke={INK} strokeWidth="6" />
						<polygon points="64,22 92,66 64,82 36,66" fill="#e0e7ff" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
						<polygon points="64,108 92,74 64,90 36,74" fill="#c7d2fe" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
					</g>
				);
			case 'usdt':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#10b981" stroke={INK} strokeWidth="6" />
						<text x="64" y="84" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							₮
						</text>
					</g>
				);
			case 'usdc':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#2563eb" stroke={INK} strokeWidth="6" />
						<text x="64" y="84" textAnchor="middle" fontSize="56" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">
							$
						</text>
					</g>
				);
			case 'xrp':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#94a3b8" stroke={INK} strokeWidth="6" />
						<path d="M 38 42 L 64 62 L 90 42 M 38 86 L 64 66 L 90 86" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
					</g>
				);
			case 'wallet':
				return (
					<g>
						<circle cx="52" cy="36" r="16" fill="#facc15" stroke={INK} strokeWidth="5" />
						<circle cx="78" cy="34" r="14" fill="#fb923c" stroke={INK} strokeWidth="5" />
						<rect x="20" y="42" width="88" height="66" rx="14" fill="#3b82f6" stroke={INK} strokeWidth="6" />
						<rect x="74" y="64" width="38" height="24" rx="8" fill="#1d4ed8" stroke={INK} strokeWidth="5" />
						<circle cx="88" cy="76" r="5" fill="#facc15" />
					</g>
				);
			case 'bank':
				return (
					<g>
						<polygon points="16,52 64,20 112,52" fill="#34d399" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<circle cx="64" cy="40" r="10" fill="#fef08a" stroke={INK} strokeWidth="4" />
						<rect x="26" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="57" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="88" y="52" width="14" height="44" fill="#6ee7b7" stroke={INK} strokeWidth="5" />
						<rect x="14" y="96" width="100" height="16" rx="4" fill="#10b981" stroke={INK} strokeWidth="6" />
					</g>
				);
			case 'building':
				return (
					<g>
						<rect x="26" y="18" width="76" height="94" rx="6" fill="#64748b" stroke={INK} strokeWidth="6" />
						{[0, 1, 2].map((r) =>
							[0, 1, 2].map((c) => (
								<rect key={`${r}-${c}`} x={38 + c * 20} y={30 + r * 22} width="12" height="14" fill="#bae6fd" stroke={INK} strokeWidth="3" />
							)),
						)}
					</g>
				);
			case 'laptop':
				return (
					<g>
						<rect x="22" y="26" width="84" height="58" rx="8" fill="#334155" stroke={INK} strokeWidth="6" />
						<rect x="30" y="34" width="68" height="42" fill="#38bdf8" />
						<polygon points="10,88 118,88 108,104 20,104" fill="#94a3b8" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
					</g>
				);
			case 'document':
				return (
					<g>
						<path d="M 30 16 L 80 16 L 100 36 L 100 112 L 30 112 Z" fill="#fef3c7" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<polygon points="80,16 100,36 80,36" fill="#fde68a" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
						<line x1="44" y1="54" x2="86" y2="54" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="44" y1="72" x2="86" y2="72" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="44" y1="90" x2="72" y2="90" stroke={INK} strokeWidth="5" strokeLinecap="round" />
					</g>
				);
			case 'cash':
				return (
					<g>
						<rect x="16" y="44" width="96" height="52" rx="8" fill="#22c55e" stroke={INK} strokeWidth="6" />
						<rect x="22" y="34" width="96" height="52" rx="8" fill="#4ade80" stroke={INK} strokeWidth="6" />
						<circle cx="70" cy="60" r="14" fill="#bbf7d0" stroke={INK} strokeWidth="4" />
						<text x="70" y="67" textAnchor="middle" fontSize="22" fontWeight="900" fill={INK}>
							$
						</text>
					</g>
				);
			case 'bug':
				return (
					<g>
						<rect x="30" y="36" width="68" height="56" rx="14" fill="#22c55e" stroke={INK} strokeWidth="6" />
						<rect x="44" y="52" width="12" height="12" fill={INK} />
						<rect x="72" y="52" width="12" height="12" fill={INK} />
						<path d="M 46 76 H 82 M 22 50 H 30 M 22 72 H 30 M 98 50 H 106 M 98 72 H 106 M 44 24 L 52 36 M 84 24 L 76 36" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					</g>
				);
			case 'freeze':
				return (
					<g>
						<circle cx="64" cy="64" r="52" fill="#06b6d4" stroke={INK} strokeWidth="6" />
						<path d="M 64 26 V 102 M 26 64 H 102 M 38 38 L 90 90 M 90 38 L 38 90" stroke="#ecfeff" strokeWidth="7" strokeLinecap="round" />
						<circle cx="64" cy="64" r="14" fill="#0891b2" stroke="#ecfeff" strokeWidth="5" />
					</g>
				);
			case 'warning':
				return (
					<g>
						<polygon points="64,18 112,106 16,106" fill="#facc15" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<line x1="64" y1="48" x2="64" y2="76" stroke={INK} strokeWidth="8" strokeLinecap="round" />
						<circle cx="64" cy="92" r="5.5" fill={INK} />
					</g>
				);
			case 'lock':
				return (
					<g>
						<path d="M 42 54 V 38 C 42 22, 86 22, 86 38 V 54" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
						<rect x="28" y="52" width="72" height="58" rx="10" fill="#f59e0b" stroke={INK} strokeWidth="6" />
						<circle cx="64" cy="78" r="8" fill={INK} />
					</g>
				);
			case 'shield':
				return (
					<g>
						<path d="M 64 16 L 106 32 V 66 C 106 90, 86 106, 64 114 C 42 106, 22 90, 22 66 V 32 Z" fill="#38bdf8" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<path d="M 46 64 L 58 76 L 84 48" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
					</g>
				);
			case 'red_x':
				return (
					<g>
						<path d="M 28 28 L 100 100 M 100 28 L 28 100" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" />
						<path d="M 28 28 L 100 100 M 100 28 L 28 100" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.25" />
					</g>
				);
			case 'globe':
				return (
					<g>
						<circle cx="64" cy="64" r="50" fill="#0ea5e9" stroke={INK} strokeWidth="6" />
						<path d="M 38 36 C 48 32, 62 42, 56 58 C 50 70, 62 84, 52 96 C 40 90, 26 74, 28 54 C 30 44, 34 38, 38 36 Z" fill="#22c55e" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
						<path d="M 74 34 C 88 38, 98 54, 94 72 C 90 86, 78 96, 72 88 C 68 78, 76 68, 70 58 C 66 50, 68 38, 74 34 Z" fill="#22c55e" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
						<ellipse cx="64" cy="64" rx="26" ry="50" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" />
						<line x1="16" y1="64" x2="112" y2="64" stroke="rgba(255,255,255,0.45)" strokeWidth="3.5" />
						<circle cx="64" cy="64" r="50" fill="none" stroke={INK} strokeWidth="6" />
					</g>
				);
			case 'chart':
				return (
					<g>
						<rect x="16" y="20" width="96" height="88" rx="12" fill="#1e293b" stroke={INK} strokeWidth="6" />
						<rect x="30" y="54" width="14" height="40" rx="2" fill="#22c55e" stroke={INK} strokeWidth="3" />
						<rect x="52" y="40" width="14" height="54" rx="2" fill="#38bdf8" stroke={INK} strokeWidth="3" />
						<rect x="74" y="66" width="14" height="28" rx="2" fill="#ef4444" stroke={INK} strokeWidth="3" />
						<polyline points="26,42 54,32 76,58 100,88" fill="none" stroke="#ff3b30" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
						<polygon points="104,94 86,90 100,76" fill="#ff3b30" />
					</g>
				);
			case 'fire':
				return (
					<g>
						<path d="M 64 14 C 82 34, 102 52, 98 80 C 95 100, 82 114, 64 114 C 42 114, 28 96, 30 74 C 32 58, 42 50, 44 38 C 48 48, 54 50, 56 38 C 58 26, 60 20, 64 14 Z" fill="#ef4444" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<path d="M 64 44 C 76 58, 84 70, 82 86 C 80 100, 72 108, 64 108 C 52 108, 44 96, 46 82 C 47 72, 54 66, 56 58 C 59 62, 62 56, 64 44 Z" fill="#f97316" />
						<path d="M 64 68 C 72 78, 74 88, 72 96 C 70 103, 67 106, 64 106 C 58 106, 55 99, 56 90 C 57 84, 61 78, 64 68 Z" fill="#facc15" />
					</g>
				);
			case 'skull':
				return (
					<g>
						<path d="M 24 58 C 24 30, 42 16, 64 16 C 86 16, 104 30, 104 58 C 104 74, 94 84, 86 88 V 104 C 86 109, 82 112, 76 112 H 52 C 46 112, 42 109, 42 104 V 88 C 34 84, 24 74, 24 58 Z" fill="#f8fafc" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
						<circle cx="47" cy="58" r="11" fill={INK} />
						<circle cx="81" cy="58" r="11" fill={INK} />
						<polygon points="64,68 58,80 70,80" fill={INK} />
						<line x1="54" y1="94" x2="54" y2="112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="64" y1="94" x2="64" y2="112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
						<line x1="74" y1="94" x2="74" y2="112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
					</g>
				);
			default:
				return (
					<g>
						<circle cx="64" cy="64" r="50" fill="#38bdf8" stroke={INK} strokeWidth="6" />
						<polygon points="64,26 74,48 98,51 80,68 85,92 64,80 43,92 48,68 30,51 54,48" fill="#ffffff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
					</g>
				);
		}
	};

	return (
		<div style={{ position: 'relative', width: size, height: size }}>
			<svg viewBox="0 0 128 128" width="100%" height="100%">
				{renderShape()}
				{crossedOut && (
					<g>
						<path d="M 22 22 L 106 106 M 106 22 L 22 106" stroke={INK} strokeWidth="20" strokeLinecap="round" />
						<path d="M 22 22 L 106 106 M 106 22 L 22 106" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
					</g>
				)}
			</svg>
		</div>
	);
};

/**
 * Dual Signature Backdrops (Dark Grid + Light Paper) + Cartoon Skit Environments.
 */
export const ComicBackdrop: React.FC<{ kind?: BackdropKind; blur?: number }> = ({
	kind = 'dark_grid',
	blur = 0,
}) => {
	const frame = useCurrentFrame();
	const drift = (frame * 0.25) % 48;

	const wrapStyle: React.CSSProperties = {
		position: 'absolute',
		inset: 0,
		filter: blur > 0 ? `blur(${blur}px)` : undefined,
		transform: blur > 0 ? 'scale(1.04)' : undefined,
	};

	if (kind === 'light_paper') {
		return (
			<div
				style={{
					...wrapStyle,
					backgroundColor: '#f3f2ee',
					backgroundImage:
						'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(215,211,202,0.32) 100%)',
				}}
			/>
		);
	}

	if (kind === 'candlestick_chart') {
		const candles = [
			{ x: 100, o: 580, c: 510, h: 470, l: 615, up: true },
			{ x: 185, o: 510, c: 565, h: 485, l: 600, up: false },
			{ x: 270, o: 565, c: 455, h: 425, l: 585, up: true },
			{ x: 355, o: 455, c: 495, h: 420, l: 530, up: false },
			{ x: 440, o: 495, c: 365, h: 330, l: 515, up: true },
			{ x: 525, o: 365, c: 415, h: 340, l: 445, up: false },
			{ x: 610, o: 415, c: 290, h: 245, l: 435, up: true },
			{ x: 695, o: 290, c: 350, h: 265, l: 385, up: false },
			{ x: 780, o: 350, c: 240, h: 205, l: 370, up: true },
			{ x: 865, o: 240, c: 430, h: 225, l: 485, up: false },
			{ x: 950, o: 430, c: 585, h: 410, l: 645, up: false },
			{ x: 1035, o: 585, c: 690, h: 550, l: 735, up: false },
			{ x: 1120, o: 690, c: 640, h: 610, l: 720, up: true },
			{ x: 1205, o: 640, c: 760, h: 620, l: 800, up: false },
		];
		const coinPop1 = interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		const coinPop2 = interpolate(frame, [65, 81], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		const coinPop3 = interpolate(frame, [90, 106], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
		return (
			<div style={{ ...wrapStyle, backgroundColor: '#f3f2ee' }}>
				<svg viewBox="0 0 1920 1080" width="100%" height="100%">
					<rect x="85" y="70" width="1645" height="785" fill="#232c3d" stroke={INK} strokeWidth="5" />
					{[200, 345, 490, 635, 780].map((y, idx) => (
						<g key={y}>
							<line x1="85" y1={y} x2="1730" y2={y} stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
							<text x="1756" y={y + 8} fill="#1f2937" fontSize="26" fontWeight="700" fontFamily="Georgia, serif">
								{['49.00', '48.50', '48.00', '47.50', '47.00'][idx]}
							</text>
						</g>
					))}
					{[320, 680, 1040, 1400].map((x, idx) => (
						<g key={x}>
							<line x1={x} y1="70" x2={x} y2="855" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
							<text x={x - 18} y="902" fill="#1f2937" fontSize="28" fontWeight="700" fontFamily="Georgia, serif">
								{['Jan', '17', '24', '31'][idx]}
							</text>
						</g>
					))}
					{candles.map((cd, i) => {
						const col = cd.up ? '#22c55e' : '#ef4444';
						const top = Math.min(cd.o, cd.c);
						const h = Math.max(16, Math.abs(cd.o - cd.c));
						const grow = interpolate(frame, [i * 2, i * 2 + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
						return (
							<g key={i} opacity={grow}>
								<line x1={cd.x + 170} y1={cd.h} x2={cd.x + 170} y2={cd.l} stroke={col} strokeWidth="6" />
								<rect x={cd.x + 152} y={top} width="36" height={h} rx="3" fill={col} stroke={INK} strokeWidth="2.5" />
							</g>
						);
					})}
					{/* Floating crypto coins popping above candlesticks (exact Lóng 00:09-00:15 motif) */}
					<g transform={`translate(460, ${235 + Math.sin(frame / 10) * 6}) scale(${coinPop1})`} opacity={coinPop1}>
						<circle r="62" fill="#f7931a" stroke={INK} strokeWidth="5" />
						<text y="22" textAnchor="middle" fontSize="64" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">₿</text>
					</g>
					<g transform={`translate(930, ${195 + Math.sin(frame / 10 + 1.5) * 6}) scale(${coinPop2})`} opacity={coinPop2}>
						<circle r="62" fill="#6366f1" stroke={INK} strokeWidth="5" />
						<text y="22" textAnchor="middle" fontSize="60" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">Ξ</text>
					</g>
					<g transform={`translate(1390, ${245 + Math.sin(frame / 10 + 3.0) * 6}) scale(${coinPop3})`} opacity={coinPop3}>
						<circle r="58" fill="#10b981" stroke={INK} strokeWidth="5" />
						<text y="20" textAnchor="middle" fontSize="58" fontWeight="900" fill="#ffffff" fontFamily="Inter, Arial, sans-serif">₮</text>
					</g>
				</svg>
			</div>
		);
	}

	if (kind === 'bank_counter') {
		const slowZoom = interpolate(frame, [0, 360], [1.0, 1.045], { extrapolateRight: 'clamp' });
		return (
			<div style={{ ...wrapStyle, overflow: 'hidden', backgroundColor: '#f6efe2' }}>
				<svg
					viewBox="0 0 1920 1080"
					width="100%"
					height="100%"
					style={{ transform: `scale(${slowZoom})`, transformOrigin: 'center center' }}
				>
					{/* Bright cream/warm-beige walls + daylight windows */}
					<rect width="1920" height="710" fill="#f6efe2" />
					<rect x="0" y="710" width="1920" height="370" fill="#ebe0cd" stroke={INK} strokeWidth="4" />
					{/* Subtle floor tile lines */}
					{[240, 480, 720, 960, 1200, 1440, 1680].map((x) => (
						<line key={x} x1={x} y1="710" x2={x + (x - 960) * 0.45} y2="1080" stroke="rgba(20,20,24,0.12)" strokeWidth="3" />
					))}
					<line x1="0" y1="840" x2="1920" y2="840" stroke="rgba(20,20,24,0.10)" strokeWidth="3" />
					<line x1="0" y1="965" x2="1920" y2="965" stroke="rgba(20,20,24,0.10)" strokeWidth="3" />

					{/* Left tall daylight glass windows */}
					<rect x="70" y="75" width="380" height="515" rx="8" fill="#dbeafe" stroke={INK} strokeWidth="5" />
					<line x1="260" y1="75" x2="260" y2="590" stroke={INK} strokeWidth="5" />
					<line x1="70" y1="320" x2="450" y2="320" stroke={INK} strokeWidth="5" />
					<polygon points="105,110 215,110 155,550 85,550" fill="rgba(255,255,255,0.45)" />
					<polygon points="295,110 385,110 330,550 275,550" fill="rgba(255,255,255,0.35)" />

					{/* Back wall vertical wood paneling & recessed vault alcove on right */}
					<rect x="490" y="85" width="840" height="430" rx="10" fill="#efe4d1" stroke={INK} strokeWidth="4" />
					{[690, 910, 1130].map((x) => (
						<line key={x} x1={x} y1="85" x2={x} y2="515" stroke="rgba(20,20,24,0.18)" strokeWidth="3" />
					))}
					{/* Digital rate / queue board (blank clean lines, zero text) */}
					<rect x="545" y="135" width="360" height="175" rx="12" fill="#232c3d" stroke={INK} strokeWidth="5" />
					<line x1="580" y1="185" x2="780" y2="185" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
					<line x1="580" y1="225" x2="845" y2="225" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
					<line x1="580" y1="265" x2="730" y2="265" stroke="#facc15" strokeWidth="8" strokeLinecap="round" />

					{/* Steel circular bank vault door in back-right */}
					<rect x="1420" y="120" width="410" height="445" rx="16" fill="#cbd5e1" stroke={INK} strokeWidth="5" />
					<circle cx="1625" cy="340" r="145" fill="#94a3b8" stroke={INK} strokeWidth="6" />
					<circle cx="1625" cy="340" r="108" fill="#cbd5e1" stroke={INK} strokeWidth="4.5" />
					{[0, 60, 120, 180, 240, 300].map((deg) => {
						const rad = (deg * Math.PI) / 180;
						return (
							<line
								key={deg}
								x1={1625 + Math.cos(rad) * 28}
								y1={340 + Math.sin(rad) * 28}
								x2={1625 + Math.cos(rad) * 95}
								y2={340 + Math.sin(rad) * 95}
								stroke={INK}
								strokeWidth="7"
								strokeLinecap="round"
							/>
						);
					})}
					<circle cx="1625" cy="340" r="30" fill="#64748b" stroke={INK} strokeWidth="5" />

					{/* Potted bank plants */}
					{[505, 1365].map((px) => (
						<g key={px}>
							<path d={`M ${px - 28} 485 L ${px + 28} 485 L ${px + 20} 540 L ${px - 20} 540 Z`} fill="#d97706" stroke={INK} strokeWidth="4" />
							<ellipse cx={px} cy="455" rx="34" ry="38" fill="#22c55e" stroke={INK} strokeWidth="4" />
							<ellipse cx={px - 22} cy="468" rx="22" ry="24" fill="#16a34a" stroke={INK} strokeWidth="4" />
							<ellipse cx={px + 22} cy="468" rx="22" ry="24" fill="#4ade80" stroke={INK} strokeWidth="4" />
						</g>
					))}

					{/* Modern Teller Counter + Security Glass Partitions (mid-ground) */}
					<rect x="260" y="340" width="1360" height="190" rx="8" fill="rgba(186, 230, 253, 0.38)" stroke={INK} strokeWidth="5" />
					{[595, 940, 1285].map((vx) => (
						<g key={vx}>
							<rect x={vx - 10} y="340" width="20" height="190" fill="#94a3b8" stroke={INK} strokeWidth="4" />
							{/* Teller pass-through tray */}
							<rect x={vx - 195} y="492" width="140" height="22" rx="6" fill="#475569" stroke={INK} strokeWidth="3.5" />
						</g>
					))}
					{/* Sleek wood & marble teller desk front */}
					<rect x="230" y="525" width="1420" height="32" rx="6" fill="#f8fafc" stroke={INK} strokeWidth="5" />
					<rect x="250" y="557" width="1380" height="165" fill="#d6b48c" stroke={INK} strokeWidth="5" />
					{[480, 710, 940, 1170, 1400].map((px) => (
						<line key={px} x1={px} y1="557" x2={px} y2="722" stroke="rgba(20,20,24,0.28)" strokeWidth="4" />
					))}
					{/* Base kickboard */}
					<rect x="250" y="698" width="1380" height="24" fill="#334155" stroke={INK} strokeWidth="4" />
				</svg>
			</div>
		);
	}

	if (kind === 'office' || kind === 'living_room' || kind === 'hacker_room') {
		const bgMap: Record<string, string> = {
			office: 'comic/art/bg_office.jpg',
			living_room: 'comic/art/bg_office.jpg',
			hacker_room: 'comic/art/bg_hacker_room.jpg',
		};
		const slowZoom = interpolate(frame, [0, 360], [1.0, 1.045], { extrapolateRight: 'clamp' });
		return (
			<div style={{ ...wrapStyle, overflow: 'hidden' }}>
				<Img
					src={staticFile(bgMap[kind])}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: `scale(${slowZoom})`,
					}}
				/>
			</div>
		);
	}

	// Default: Lóng's exact Dark Grid (#1d1f23 with crisp subtle 42px grid lines)
	return (
		<div
			style={{
				...wrapStyle,
				backgroundColor: '#1d1f23',
				backgroundImage:
					'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.42) 100%), linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
				backgroundSize: '100% 100%, 42px 42px, 42px 42px',
				backgroundPosition: `0 0, ${drift}px ${drift}px, ${drift}px ${drift}px`,
			}}
		/>
	);
};
