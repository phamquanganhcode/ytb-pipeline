import React, { useContext } from 'react';
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
 * Animated 2D SVG Puppet Investigator Host (Lóng-style cutout rigging):
 * - Independent breathing torso (charcoal turtleneck + camel trench coat)
 * - Pivoting head with talking nod + natural eye blinking + expressive eyebrows
 * - Audio-driven 4-shape lip-sync mouth synced to WAV narration
 * - Independent animated arms/hands per pose (explaining, pointing, shocked, deadpan, skeptical, shades)
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
	const ctxMouth = useContext(MouthLevelContext);

	const pop = talking ? spring({ frame, fps, config: { damping: 16, stiffness: 140 } }) : 1;
	const mouthLevel = talking ? ctxMouth : pose === 'shocked' ? 3 : 0;

	// Calm, Lóng-style restrained animation: held poses, slow subtle tilt, zero hyperactive bobbing
	const breatheY = talking ? Math.sin(frame / 36) * 0.8 : 0;
	const headTilt = talking ? Math.sin(frame / 42) * 1.1 : pose === 'shocked' ? -1.5 : 1;
	const headBobY = 0;

	const blink = talking && pose !== 'shocked' && pose !== 'shades' && useBlink(frame, 17, 118);
	// Brief 0.45s shock jolt on entrance only, then hold steady
	const shockShake = talking && pose === 'shocked' && frame < 14 ? Math.sin(frame * 1.4) * (2.2 * (1 - frame / 14)) : 0;
	const gestureSwing = talking ? Math.sin(frame / 34) * 1.8 : 0;
	const pointPulse = talking ? Math.sin(frame / 32) * 1.4 : 0;
	const sweatY = talking ? ((frame * 0.45) % 24) : 8;
	const shineX = talking ? interpolate((frame % 110), [0, 18, 110], [-36, 46, 46], { extrapolateRight: 'clamp' }) : 6;

	const renderMouth = () => {
		if (pose === 'shocked' && (!talking || mouthLevel >= 2)) {
			return (
				<g>
					<path
						d="M 142 154 Q 160 144 178 154 Q 182 174 160 176 Q 138 174 142 154 Z"
						fill="#5c1622"
						stroke={INK}
						strokeWidth="3.8"
						strokeLinejoin="round"
					/>
					<path d="M 146 153 Q 160 148 174 153 L 172 158 Q 160 155 148 158 Z" fill="#ffffff" />
					<ellipse cx="160" cy="171" rx="11" ry="4.5" fill="#e06377" />
				</g>
			);
		}
		if (mouthLevel === 0) {
			if (pose === 'deadpan' || pose === 'skeptical') {
				return <path d="M 147 161 Q 160 159 173 161" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
			}
			return <path d="M 146 159 Q 160 167 175 158" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
		}
		if (mouthLevel === 1) {
			return (
				<path
					d="M 147 158 Q 160 155 173 158 Q 172 165 160 166 Q 148 165 147 158 Z"
					fill="#691c28"
					stroke={INK}
					strokeWidth="3.5"
					strokeLinejoin="round"
				/>
			);
		}
		if (mouthLevel === 2) {
			return (
				<g>
					<path
						d="M 145 156 Q 160 153 175 156 Q 176 169 160 171 Q 144 169 145 156 Z"
						fill="#691c28"
						stroke={INK}
						strokeWidth="3.6"
						strokeLinejoin="round"
					/>
					<path d="M 148 156 L 172 156 L 170 160 L 150 160 Z" fill="#ffffff" />
					<ellipse cx="160" cy="168" rx="9" ry="3.5" fill="#e06377" />
				</g>
			);
		}
		return (
			<g>
				<path
					d="M 143 154 Q 160 150 177 154 Q 179 173 160 175 Q 141 173 143 154 Z"
					fill="#5c1622"
					stroke={INK}
					strokeWidth="3.8"
					strokeLinejoin="round"
				/>
				<path d="M 147 154 L 173 154 L 171 160 L 149 160 Z" fill="#ffffff" />
				<ellipse cx="160" cy="171" rx="11" ry="4.5" fill="#e06377" />
			</g>
		);
	};

	const renderEyes = () => {
		if (pose === 'shades') {
			return (
				<g>
					{/* Cool dark round sunglasses + animated gleam */}
					<defs>
						<clipPath id="hostShadesClip">
							<circle cx="136" cy="123" r="19" />
							<circle cx="184" cy="123" r="19" />
						</clipPath>
					</defs>
					<line x1="155" y1="122" x2="165" y2="122" stroke={INK} strokeWidth="4.5" />
					<circle cx="136" cy="123" r="19" fill="#18181f" stroke={INK} strokeWidth="4.5" />
					<circle cx="184" cy="123" r="19" fill="#18181f" stroke={INK} strokeWidth="4.5" />
					<g clipPath="url(#hostShadesClip)">
						<polygon
							points={`${120 + shineX},98 ${134 + shineX},98 ${116 + shineX},148 ${102 + shineX},148`}
							fill="rgba(255,255,255,0.42)"
						/>
						<polygon
							points={`${168 + shineX},98 ${182 + shineX},98 ${164 + shineX},148 ${150 + shineX},148`}
							fill="rgba(255,255,255,0.42)"
						/>
					</g>
					<path d="M 120 98 Q 136 93 150 97" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
					<path d="M 170 97 Q 184 93 200 98" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
				</g>
			);
		}

		const pupilR = pose === 'shocked' ? 3.2 : 5;
		const eyeRy = blink ? 1 : pose === 'shocked' ? 12.5 : pose === 'deadpan' ? 7 : 9.5;
		const lookX = pose === 'pointing' ? 3.5 : pose === 'skeptical' ? -2 : 0;

		return (
			<g>
				{/* Eyebrows */}
				{pose === 'shocked' ? (
					<>
						<path d="M 120 94 Q 136 84 150 93" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
						<path d="M 170 93 Q 184 84 200 94" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
					</>
				) : pose === 'skeptical' ? (
					<>
						<path d="M 120 100 Q 136 96 151 101" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
						<path d="M 169 94 Q 184 85 200 93" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
					</>
				) : (
					<>
						<path d="M 120 99 Q 136 94 151 99" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
						<path d="M 169 99 Q 184 94 200 99" fill="none" stroke="#2c1d16" strokeWidth="5.5" strokeLinecap="round" />
					</>
				)}

				{/* Eyes */}
				{blink ? (
					<>
						<path d="M 124 123 Q 136 128 148 123" fill="none" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
						<path d="M 172 123 Q 184 128 196 123" fill="none" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
					</>
				) : (
					<>
						<ellipse cx="136" cy="123" rx="11.5" ry={eyeRy} fill="#ffffff" stroke={INK} strokeWidth="3.2" />
						<ellipse cx="184" cy="123" rx="11.5" ry={eyeRy} fill="#ffffff" stroke={INK} strokeWidth="3.2" />
						<circle cx={136 + lookX} cy="123" r={pupilR} fill={INK} />
						<circle cx={184 + lookX} cy="123" r={pupilR} fill={INK} />
						<circle cx={138 + lookX} cy="120.5" r="1.8" fill="#ffffff" />
						<circle cx={186 + lookX} cy="120.5" r="1.8" fill="#ffffff" />
						{(pose === 'deadpan' || pose === 'skeptical') && (
							<>
								<path d="M 124 117 L 148 117" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
								{pose === 'deadpan' && <path d="M 172 117 L 196 117" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />}
							</>
						)}
					</>
				)}

				{/* Round Signature Glasses */}
				<circle cx="136" cy="123" r="19" fill="rgba(255,255,255,0.08)" stroke={INK} strokeWidth="3.8" />
				<circle cx="184" cy="123" r="19" fill="rgba(255,255,255,0.08)" stroke={INK} strokeWidth="3.8" />
				<line x1="155" y1="122" x2="165" y2="122" stroke={INK} strokeWidth="3.8" />
				<line x1="117" y1="121" x2="108" y2="119" stroke={INK} strokeWidth="3.5" />
				<line x1="203" y1="121" x2="212" y2="119" stroke={INK} strokeWidth="3.5" />
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
				filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.45))',
				pointerEvents: 'none',
				...style,
			}}
		>
			<svg viewBox="0 0 320 340" width="100%" height="100%" style={{ overflow: 'visible' }}>
				{/* Torso Group (breathing) */}
				<g transform={`translate(0, ${breatheY})`}>
					{/* Back coat / shoulders */}
					<path
						d="M 78 228 Q 92 200 132 196 L 188 196 Q 228 200 242 228 L 258 340 L 62 340 Z"
						fill="#c99352"
						stroke={INK}
						strokeWidth="5"
						strokeLinejoin="round"
					/>
					{/* Coat side shading */}
					<path d="M 86 232 L 72 340 L 104 340 L 114 236 Z" fill="#b37f40" />
					<path d="M 234 232 L 248 340 L 216 340 L 206 236 Z" fill="#b37f40" />

					{/* Charcoal turtleneck */}
					<path
						d="M 122 198 L 198 198 L 190 340 L 130 340 Z"
						fill="#3c464f"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>
					{/* Turtleneck collar */}
					<path
						d="M 134 180 Q 160 190 186 180 L 190 212 Q 160 222 130 212 Z"
						fill="#47535e"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>
					<path d="M 136 196 Q 160 205 184 196" fill="none" stroke="#2a323a" strokeWidth="3" />

					{/* Trench coat lapels */}
					<path
						d="M 132 196 L 106 226 L 122 246 L 104 268 L 132 340 L 140 340 L 132 206 Z"
						fill="#d8a566"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>
					<path
						d="M 188 196 L 214 226 L 198 246 L 216 268 L 188 340 L 180 340 L 188 206 Z"
						fill="#d8a566"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>

					{/* Left Arm (viewer's left) */}
					{pose === 'shocked' ? (
						<g transform={`rotate(${-14 + shockShake}, 88, 232)`}>
							<path
								d="M 88 232 L 42 268 L 32 192"
								fill="none"
								stroke="#c99352"
								strokeWidth="30"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M 88 232 L 42 268 L 32 192"
								fill="none"
								stroke={INK}
								strokeWidth="39"
								strokeLinecap="round"
								strokeLinejoin="round"
								opacity="0"
							/>
							<path
								d="M 76 224 L 30 264 Q 20 272 24 256 L 20 188 L 46 188 L 52 246 L 94 218 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
							{/* Raised shocked left hand */}
							<path
								d="M 16 192 L 10 162 Q 13 155 18 162 L 24 176 L 24 152 Q 29 146 33 153 L 34 174 L 39 156 Q 44 151 47 158 L 44 180 L 52 172 Q 57 174 52 184 L 44 196 Z"
								fill="#f2c6a0"
								stroke={INK}
								strokeWidth="4"
								strokeLinejoin="round"
							/>
						</g>
					) : (
						<g transform={`rotate(${-gestureSwing * 0.35}, 88, 236)`}>
							<path
								d="M 76 226 L 56 338 L 96 338 L 106 244 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
						</g>
					)}

					{/* Right Arm (viewer's right — primary expressive gesture arm!) */}
					{pose === 'shocked' ? (
						<g transform={`rotate(${14 - shockShake}, 232, 232)`}>
							<path
								d="M 244 224 L 290 264 Q 300 272 296 256 L 300 188 L 274 188 L 268 246 L 226 218 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
							<path
								d="M 304 192 L 310 162 Q 307 155 302 162 L 296 176 L 296 152 Q 291 146 287 153 L 286 174 L 281 156 Q 276 151 273 158 L 276 180 L 268 172 Q 263 174 268 184 L 276 196 Z"
								fill="#f2c6a0"
								stroke={INK}
								strokeWidth="4"
								strokeLinejoin="round"
							/>
						</g>
					) : pose === 'pointing' ? (
						<g transform={`rotate(${-6 + pointPulse}, 232, 234)`}>
							<path
								d="M 226 224 L 278 242 L 298 168 L 270 162 L 258 216 L 216 208 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
							{/* Pointing hand with index finger up */}
							<path
								d="M 272 164 L 276 144 L 284 114 Q 290 107 296 115 L 292 145 L 304 148 Q 310 154 304 162 L 296 172 L 272 170 Z"
								fill="#f2c6a0"
								stroke={INK}
								strokeWidth="4"
								strokeLinejoin="round"
							/>
						</g>
					) : pose === 'shades' ? (
						<g transform={`rotate(${Math.sin(frame / 36) * 1.2}, 230, 232)`}>
							<path
								d="M 226 226 L 274 248 L 236 144 L 214 152 L 244 226 L 214 214 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
							{/* Hand adjusting glasses */}
							<path
								d="M 212 146 L 200 124 Q 204 118 212 124 L 222 136 L 232 132 Q 238 136 234 146 L 220 156 Z"
								fill="#f2c6a0"
								stroke={INK}
								strokeWidth="4"
								strokeLinejoin="round"
							/>
						</g>
					) : (
						/* Default explaining / deadpan / skeptical open-palm gesturing arm */
						<g transform={`rotate(${gestureSwing}, 232, 238)`}>
							<path
								d="M 228 228 L 274 268 L 296 206 L 270 198 L 256 244 L 216 218 Z"
								fill="#c99352"
								stroke={INK}
								strokeWidth="4.8"
								strokeLinejoin="round"
							/>
							{/* Expressive open explaining palm */}
							<path
								d="M 270 202 L 268 184 Q 272 177 278 184 L 282 192 L 298 176 Q 305 174 304 182 L 294 196 L 308 188 Q 314 191 308 198 L 294 212 L 274 212 Z"
								fill="#f2c6a0"
								stroke={INK}
								strokeWidth="4"
								strokeLinejoin="round"
							/>
						</g>
					)}
				</g>

				{/* Head Group (pivots from neck with speaking nod & tilt) */}
				<g transform={`translate(0, ${headBobY}) rotate(${headTilt}, 160, 188)`}>
					{/* Neck */}
					<rect x="144" y="166" width="32" height="30" rx="10" fill="#e6b38a" stroke={INK} strokeWidth="4.5" />
					<path d="M 146 174 Q 160 184 174 174 L 174 184 Q 160 192 146 184 Z" fill="#cf9970" />

					{/* Ears */}
					<ellipse cx="108" cy="128" rx="11" ry="15" fill="#f2c6a0" stroke={INK} strokeWidth="4.5" />
					<ellipse cx="212" cy="128" rx="11" ry="15" fill="#f2c6a0" stroke={INK} strokeWidth="4.5" />

					{/* Face Shape */}
					<path
						d="M 110 108 Q 110 62 160 62 Q 210 62 210 108 L 207 142 Q 204 180 160 184 Q 116 180 113 142 Z"
						fill="#f5cba7"
						stroke={INK}
						strokeWidth="4.8"
						strokeLinejoin="round"
					/>
					{/* Cheek / Jaw subtle shadow */}
					<path d="M 118 158 Q 160 182 202 158 Q 196 179 160 182 Q 124 179 118 158 Z" fill="#e6b68e" />

					{/* Nose */}
					<path d="M 161 124 L 165 140 Q 160 144 155 141" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

					{/* Eyes + Brows + Glasses */}
					{renderEyes()}

					{/* Lip-Sync Mouth */}
					{renderMouth()}

					{/* Messy Dark Brown Hair */}
					<path
						d="M 105 118 Q 96 84 114 60 Q 126 44 152 44 Q 164 34 180 44 Q 204 44 214 66 Q 224 88 214 118 Q 208 98 198 86 Q 186 78 172 86 Q 160 72 142 84 Q 124 76 114 96 Z"
						fill="#4a2e20"
						stroke={INK}
						strokeWidth="4.8"
						strokeLinejoin="round"
					/>
					{/* Hair highlight */}
					<path d="M 134 58 Q 158 50 184 58" fill="none" stroke="#6c4532" strokeWidth="4" strokeLinecap="round" />

					{/* Comic FX: Shocked Sweat Drop + Alert Lines */}
					{pose === 'shocked' && (
						<g>
							<path
								d={`M 224 ${76 + sweatY * 0.5} Q 232 ${88 + sweatY * 0.5} 224 ${94 + sweatY * 0.5} Q 216 ${88 + sweatY * 0.5} 224 ${76 + sweatY * 0.5} Z`}
								fill="#38bdf8"
								stroke={INK}
								strokeWidth="3"
							/>
							<line x1="92" y1="54" x2="76" y2="38" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
							<line x1="84" y1="74" x2="64" y2="68" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
							<line x1="228" y1="54" x2="244" y2="38" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
						</g>
					)}
				</g>
			</svg>
		</div>
	);
};

/**
 * Animated 2D Puppet Chibi Cast (trader, victim, hacker, engineer):
 * Real per-part animation: blinking eyes, typing hands on laptop, panic head-grab shaking,
 * sweat drops, breathing, and talking mouth bounce!
 */
export const ChibiCharacter: React.FC<{
	role: ChibiRole;
	mood?: ChibiMood;
	label?: string;
	size?: number;
	delay?: number;
	flipX?: boolean;
	speaking?: boolean;
}> = ({ role, mood = 'neutral', size = 390, delay = 0, flipX = false, speaking = false }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const localAge = Math.max(0, frame - delay);
	const pop = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 145 } });
	const blink = mood !== 'panic' && useBlink(frame, role.length * 13, 114);

	// Calm, held-pose chibi motion: brief entrance reaction, then natural stillness + blinking
	const breatheY = Math.sin((frame + delay * 2) / 36) * 0.8;
	const panicShakeX = mood === 'panic' && localAge < 16 ? Math.sin(localAge * 1.6) * (3 * (1 - localAge / 16)) : 0;
	const panicShakeRot = mood === 'panic' && localAge < 16 ? Math.sin(localAge * 1.4) * (2.2 * (1 - localAge / 16)) : Math.sin(frame / 45) * 0.9;
	// Gentle intermittent typing burst (types 25 frames, rests 35 frames) instead of constant piston motion
	const typingActive = (frame % 60) < 24;
	const typeLeftY = typingActive ? Math.sin(frame * 0.85) * 2.2 : 0;
	const typeRightY = typingActive ? Math.cos(frame * 0.85) * 2.2 : 0;
	const sweatY = (frame * 0.45) % 24;
	const talkOpen = speaking && Math.floor(frame / 4) % 2 === 0;

	const kind =
		role === 'hacker' || role === 'fbi'
			? 'hacker'
			: role === 'victim'
				? 'victim'
				: role === 'engineer' || role === 'boss' || role === 'support'
					? 'engineer'
					: 'trader';

	const shirtColor =
		kind === 'hacker'
			? '#263147'
			: kind === 'victim'
				? '#dc2626'
				: kind === 'engineer'
					? '#93c5fd'
					: '#166534';

	const hairColor =
		kind === 'victim'
			? '#16a34a'
			: kind === 'engineer'
				? '#1e293b'
				: '#5c3824';

	const renderChibiFace = () => {
		if (kind === 'hacker') {
			return (
				<g>
					{/* Fierce narrow hacker eyes */}
					<path d="M 102 120 L 130 127" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					<path d="M 178 120 L 150 127" stroke={INK} strokeWidth="6" strokeLinecap="round" />
					{blink ? (
						<>
							<line x1="106" y1="136" x2="128" y2="136" stroke={INK} strokeWidth="4" strokeLinecap="round" />
							<line x1="152" y1="136" x2="174" y2="136" stroke={INK} strokeWidth="4" strokeLinecap="round" />
						</>
					) : (
						<>
							<path d="M 105 132 Q 118 144 130 135 Q 118 128 105 132 Z" fill="#ffffff" stroke={INK} strokeWidth="3.5" />
							<path d="M 175 132 Q 162 144 150 135 Q 162 128 175 132 Z" fill="#ffffff" stroke={INK} strokeWidth="3.5" />
						</>
					)}
					{/* Black face mask */}
					<path
						d="M 88 148 Q 140 138 192 148 Q 190 186 140 190 Q 90 186 88 148 Z"
						fill="#1f2430"
						stroke={INK}
						strokeWidth="4.5"
						strokeLinejoin="round"
					/>
					<path d="M 114 166 Q 140 172 166 166" fill="none" stroke="#363f52" strokeWidth="3" strokeLinecap="round" />
				</g>
			);
		}

		const eyeR = mood === 'panic' ? 11.5 : 8.5;
		const pupilR = mood === 'panic' ? 3.5 : 4.5;

		return (
			<g>
				{/* Eyebrows */}
				{mood === 'sad' || mood === 'panic' ? (
					<>
						<path d="M 102 120 Q 116 112 128 117" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
						<path d="M 178 120 Q 164 112 152 117" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
					</>
				) : (
					<>
						<path d="M 104 118 Q 116 114 128 118" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
						<path d="M 152 118 Q 164 114 176 118" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
					</>
				)}

				{/* Eyes */}
				{blink ? (
					<>
						<path d="M 106 136 Q 117 141 128 136" fill="none" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
						<path d="M 152 136 Q 163 141 174 136" fill="none" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
					</>
				) : (
					<>
						<circle cx="117" cy="136" r={eyeR} fill="#ffffff" stroke={INK} strokeWidth="3.5" />
						<circle cx="163" cy="136" r={eyeR} fill="#ffffff" stroke={INK} strokeWidth="3.5" />
						<circle cx="117" cy="136" r={pupilR} fill={INK} />
						<circle cx="163" cy="136" r={pupilR} fill={INK} />
						<circle cx="119" cy="133.5" r="2" fill="#ffffff" />
						<circle cx="165" cy="133.5" r="2" fill="#ffffff" />
					</>
				)}

				{/* Engineer Glasses */}
				{kind === 'engineer' && (
					<g>
						<circle cx="117" cy="136" r="16" fill="none" stroke={INK} strokeWidth="3.8" />
						<circle cx="163" cy="136" r="16" fill="none" stroke={INK} strokeWidth="3.8" />
						<line x1="133" y1="136" x2="147" y2="136" stroke={INK} strokeWidth="3.8" />
					</g>
				)}

				{/* Mouth */}
				{mood === 'panic' ? (
					<g>
						<path
							d="M 122 162 Q 140 150 158 162 Q 162 178 140 179 Q 118 178 122 162 Z"
							fill="#7f1d1d"
							stroke={INK}
							strokeWidth="3.8"
						/>
						<path d="M 126 161 L 154 161 L 152 166 L 128 166 Z" fill="#ffffff" />
						<ellipse cx="140" cy="175" rx="9" ry="4" fill="#f87171" />
					</g>
				) : mood === 'sad' ? (
					<path d="M 128 168 Q 140 158 152 168" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
				) : mood === 'happy' ? (
					<path
						d="M 126 160 Q 140 174 154 160 Z"
						fill={talkOpen ? '#7f1d1d' : '#ffffff'}
						stroke={INK}
						strokeWidth="3.8"
						strokeLinejoin="round"
					/>
				) : talkOpen ? (
					<ellipse cx="140" cy="164" rx="9" ry="6" fill="#7f1d1d" stroke={INK} strokeWidth="3.5" />
				) : (
					<path d="M 129 164 Q 140 166 151 164" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
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
				transform: `scale(${0.92 + 0.08 * pop}) translateX(${panicShakeX}px)`,
				opacity: pop,
			}}
		>
			<div
				style={{
					width: size,
					height: size,
					transform: `scaleX(${flipX ? -1 : 1})`,
					filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.28))',
				}}
			>
				<svg viewBox="0 0 280 300" width="100%" height="100%" style={{ overflow: 'visible' }}>
					{/* Chibi Body */}
					<g transform={`translate(0, ${breatheY})`}>
						<path
							d="M 88 214 Q 94 190 140 190 Q 186 190 192 214 L 204 298 L 76 298 Z"
							fill={shirtColor}
							stroke={INK}
							strokeWidth="5"
							strokeLinejoin="round"
						/>
						{/* Outfit details */}
						{kind === 'trader' && (
							<>
								<rect x="85" y="232" width="110" height="16" fill="#f8fafc" stroke={INK} strokeWidth="3.5" />
								<path d="M 124 192 L 140 214 L 156 192" fill="#f8fafc" stroke={INK} strokeWidth="3.8" strokeLinejoin="round" />
							</>
						)}
						{kind === 'victim' && (
							<>
								<line x1="126" y1="202" x2="124" y2="244" stroke="#f8fafc" strokeWidth="4.5" strokeLinecap="round" />
								<line x1="154" y1="202" x2="156" y2="244" stroke="#f8fafc" strokeWidth="4.5" strokeLinecap="round" />
							</>
						)}
						{kind === 'engineer' && (
							<>
								<path d="M 122 192 L 140 214 L 158 192" fill="#ffffff" stroke={INK} strokeWidth="3.8" strokeLinejoin="round" />
								<polygon points="140,210 133,262 140,274 147,262" fill="#1d4ed8" stroke={INK} strokeWidth="3.5" />
							</>
						)}
						{kind === 'hacker' && (
							<>
								<line x1="126" y1="202" x2="124" y2="242" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
								<line x1="154" y1="202" x2="156" y2="242" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
							</>
						)}
					</g>

					{/* Chibi Head */}
					<g transform={`rotate(${panicShakeRot}, 140, 190)`}>
						{/* Hacker Hoodie Back */}
						{kind === 'hacker' && (
							<path
								d="M 62 150 Q 58 58 140 50 Q 222 58 218 150 Q 214 202 140 206 Q 66 202 62 150 Z"
								fill="#263147"
								stroke={INK}
								strokeWidth="5.5"
							/>
						)}

						{/* Ears */}
						{kind !== 'hacker' && (
							<>
								<circle cx="80" cy="138" r="12" fill="#f5cba7" stroke={INK} strokeWidth="4.5" />
								<circle cx="200" cy="138" r="12" fill="#f5cba7" stroke={INK} strokeWidth="4.5" />
							</>
						)}

						{/* Round Chibi Head */}
						<ellipse cx="140" cy="132" rx="60" ry="58" fill="#f5cba7" stroke={INK} strokeWidth="5" />

						{/* Hair */}
						<path
							d={
								kind === 'hacker'
									? 'M 86 116 Q 100 84 140 82 Q 180 84 194 116 Q 174 102 156 110 Q 140 96 122 110 Q 104 100 86 116 Z'
									: 'M 74 126 Q 70 72 112 58 Q 142 46 174 62 Q 212 74 204 128 Q 194 104 176 96 Q 158 106 142 90 Q 120 106 102 96 Q 86 106 74 126 Z'
							}
							fill={hairColor}
							stroke={INK}
							strokeWidth="4.8"
							strokeLinejoin="round"
						/>

						{/* Face */}
						{renderChibiFace()}

						{/* Panic / Sad Sweat Drop */}
						{(mood === 'panic' || mood === 'sad') && (
							<path
								d={`M 206 ${92 + sweatY * 0.6} Q 214 ${104 + sweatY * 0.6} 206 ${110 + sweatY * 0.6} Q 198 ${104 + sweatY * 0.6} 206 ${92 + sweatY * 0.6} Z`}
								fill="#38bdf8"
								stroke={INK}
								strokeWidth="3"
							/>
						)}
					</g>

					{/* Animated Arms / Props */}
					{mood === 'panic' ? (
						/* Victim grabbing head with both hands shaking! */
						<g transform={`rotate(${panicShakeRot * 1.4}, 140, 190)`}>
							<path d="M 84 218 Q 52 184 74 134" fill="none" stroke={shirtColor} strokeWidth="22" strokeLinecap="round" />
							<path d="M 84 218 Q 52 184 74 134" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
							<circle cx="76" cy="130" r="15" fill="#f5cba7" stroke={INK} strokeWidth="4.5" />
							<path d="M 196 218 Q 228 184 206 134" fill="none" stroke={shirtColor} strokeWidth="22" strokeLinecap="round" />
							<path d="M 196 218 Q 228 184 206 134" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
							<circle cx="204" cy="130" r="15" fill="#f5cba7" stroke={INK} strokeWidth="4.5" />
						</g>
					) : kind === 'hacker' || (kind === 'engineer' && mood !== 'happy') ? (
						/* Animated Typing on Laptop */
						<g>
							{/* Laptop Base & Screen */}
							<polygon
								points="116,254 222,254 236,204 130,204"
								fill={kind === 'hacker' ? '#334155' : '#cbd5e1'}
								stroke={INK}
								strokeWidth="4.5"
								strokeLinejoin="round"
							/>
							<polygon points="134,209 230,209 218,249 122,249" fill={kind === 'hacker' ? '#0f172a' : '#e2e8f0'} />
							{/* Glowing screen indicator */}
							<circle cx="177" cy="229" r="7" fill={kind === 'hacker' ? '#22d3ee' : '#64748b'} opacity={0.7 + Math.sin(frame / 4) * 0.25} />
							{/* Animated Left & Right Typing Hands */}
							<circle cx="118" cy={254 + typeLeftY} r="13" fill="#f5cba7" stroke={INK} strokeWidth="4.2" />
							<circle cx="152" cy={254 + typeRightY} r="13" fill="#f5cba7" stroke={INK} strokeWidth="4.2" />
						</g>
					) : mood === 'happy' ? (
						/* Happy counter clerk hand (calm held pose) */
						<g transform={`rotate(${Math.sin(frame / 28) * 2.5}, 196, 224)`}>
							<path d="M 190 226 L 228 192" stroke={shirtColor} strokeWidth="22" strokeLinecap="round" />
							<circle cx="232" cy="186" r="14" fill="#f5cba7" stroke={INK} strokeWidth="4.2" />
						</g>
					) : (
						/* Resting sad arms */
						<g transform={`translate(0, ${breatheY})`}>
							<ellipse cx="82" cy="252" rx="14" ry="26" fill={shirtColor} stroke={INK} strokeWidth="4.5" />
							<ellipse cx="198" cy="252" rx="14" ry="26" fill={shirtColor} stroke={INK} strokeWidth="4.5" />
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
			default:
				return (
					<g>
						<circle cx="64" cy="64" r="50" fill="#38bdf8" stroke={INK} strokeWidth="6" />
						<text x="64" y="76" textAnchor="middle" fontSize="42" fontWeight="900" fill="#ffffff">
							★
						</text>
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

	if (kind === 'office' || kind === 'living_room' || kind === 'bank_counter' || kind === 'hacker_room') {
		const bgMap: Record<string, string> = {
			office: 'comic/art/bg_office.jpg',
			living_room: 'comic/art/bg_office.jpg',
			bank_counter: 'comic/art/bg_bank_counter.jpg',
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
