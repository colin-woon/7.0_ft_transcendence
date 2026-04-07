type LabBackgroundProps = {
	motion: {
		x: number;
		y: number;
	};
};

export default function LabBackground({ motion }: LabBackgroundProps) {
	return (
		<>
			<div
				// Base atmosphere: a dark foundation with a soft indigo bleed from the top.
				className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_55%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]"
			/>

			<div
				// Animated blueprint grid.
				// This is purely decorative and sits behind the brighter glows.
				className="kinetic-grid absolute inset-0 z-0 opacity-25"
			/>

			<div
				// Slow sweeping light band.
				// It adds movement across the whole scene without being interactive.
				className="lab-sweep absolute left-1/2 top-1/2 z-10 h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2"
			/>

			<div
				// Top-left glow blob.
				// Moves slightly with the mouse so the page feels less static.
				className="absolute left-[18%] top-[20%] z-10 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-32 blur-[120px]"
				style={{
					background:
						'radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(79,70,229,0.12) 35%, rgba(2,6,23,0) 72%)',
					transform: `translate(calc(-50% + ${motion.x * 8}px), calc(-50% + ${motion.y * 8}px))`,
				}}
			/>

			<div
				// Bottom-right glow blob.
				// It moves in the opposite direction so the parallax feels deeper.
				className="absolute bottom-[-16%] right-[-8%] z-10 h-[52rem] w-[52rem] rounded-full opacity-28 blur-[120px]"
				style={{
					background:
						'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(79,70,229,0.14) 35%, rgba(2,6,23,0) 74%)',
					transform: `translate(${motion.x * -10}px, ${motion.y * -10}px)`,
				}}
			/>

			<div
				// Center void.
				// This darkens the middle slightly so the foreground UI stays readable.
				className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
				style={{
					background:
						'radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(67,56,202,0.18) 35%, rgba(2,6,23,0) 72%)',
					transform: `translate(calc(-50% + ${motion.x * 18}px), calc(-50% + ${motion.y * 18}px))`,
				}}
			/>

			<div
				// Static thin grid overlay.
				// It reinforces the "technical blueprint" feeling.
				className="absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20"
			/>

			<div className="pointer-events-none absolute inset-0 z-20 opacity-20">
				{/* Structural guide lines. These are simple geometric anchors. */}
				<div className="absolute left-1/4 top-0 h-full w-px bg-slate-500/25" />
				<div className="absolute top-1/3 left-0 h-px w-full bg-slate-500/20" />
			</div>

			<div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
				{/* Upper-right schematic ornament. */}
				<svg
					className="absolute top-10 right-10 h-[18rem] w-[18rem] text-indigo-300/20 transition-opacity duration-1000 hover:opacity-40"
					fill="none"
					stroke="currentColor"
					strokeWidth="0.25"
					viewBox="0 0 100 100"
				>
					<circle cx="50" cy="50" r="45"></circle>
					<circle cx="50" cy="50" r="30"></circle>
					<path d="M50 5 L50 95 M5 50 L95 50"></path>
					<rect
						height="30"
						transform="rotate(45 50 50)"
						width="30"
						x="35"
						y="35"
					></rect>
					<text
						className="uppercase tracking-widest"
						fontFamily="Space Grotesk"
						fontSize="2"
						x="52"
						y="15"
					>
						Sector_09
					</text>
					<text
						className="uppercase tracking-widest"
						fontFamily="Space Grotesk"
						fontSize="2"
						x="52"
						y="92"
					>
						Axis_Lock_Active
					</text>
				</svg>

				{/* Lower-left blueprint ornament. */}
				<svg
					className="absolute bottom-16 left-16 h-[12rem] w-[24rem] text-indigo-200/15 transition-transform duration-[2000ms] hover:translate-x-4"
					fill="none"
					stroke="currentColor"
					strokeWidth="0.2"
					viewBox="0 0 200 100"
				>
					<path d="M10 10 L190 10 L190 90 L10 90 Z"></path>
					<path d="M10 50 L190 50" strokeDasharray="2 2"></path>
					<path d="M100 10 L100 90" strokeDasharray="2 2"></path>
					<circle
						cx="100"
						cy="50"
						r="15"
						strokeDasharray="1 1"
					></circle>
					<path d="M0 0 L20 20 M180 0 L200 20 M0 80 L20 100 M180 80 L200 100"></path>
					<text
						className="uppercase"
						fontFamily="Space Grotesk"
						fontSize="3"
						x="15"
						y="25"
					>
						Ref_Point_Alpha
					</text>
				</svg>

				{/* Floating architecture shards. They drift slowly to make the scene feel alive. */}
				<div className="kinetic-shard absolute top-1/4 right-1/3 h-64 w-64 rotate-[15deg] bg-slate-700/10 [clip-path:polygon(0%_0%,100%_0%,80%_100%,20%_100%)]" />
				<div className="kinetic-shard absolute bottom-1/4 right-1/4 h-24 w-96 -rotate-[12deg] bg-slate-600/10 [animation-duration:36s]" />
			</div>

			<div
				// Cursor glow.
				// This is the most obvious interactive layer: it tracks the mouse position.
				className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/40 blur-[72px] transition-transform duration-75"
				style={{
					transform: `translate(calc(-50% + ${motion.x * 120}px), calc(-50% + ${motion.y * 120}px))`,
				}}
			/>

			<div
				// Tight inner cursor core.
				// This makes the mouse interaction visible even when the larger glow is diffused.
				className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/25 bg-indigo-300/25 blur-2xl transition-transform duration-75"
				style={{
					transform: `translate(calc(-50% + ${motion.x * 135}px), calc(-50% + ${motion.y * 135}px))`,
				}}
			/>

			<style jsx>{`
				@keyframes pulse-grid {
					0%,
					100% {
						opacity: 0.05;
					}
					50% {
						opacity: 0.15;
					}
				}

				@keyframes drift {
					0% {
						transform: translateY(0px) rotate(0deg);
					}
					50% {
						transform: translateY(-18px) rotate(0.6deg);
					}
					100% {
						transform: translateY(0px) rotate(0deg);
					}
				}

				@keyframes slow-sweep {
					from {
						transform: translateY(-20%) rotate(0deg);
					}
					to {
						transform: translateY(20%) rotate(360deg);
					}
				}

				.kinetic-grid {
					background-image:
						linear-gradient(
							to right,
							rgba(148, 163, 184, 0.2) 4px,
							transparent 1px
						),
						linear-gradient(
							to bottom,
							rgba(148, 163, 184, 0.18) 4px,
							transparent 1px
						);
					background-size: 80px 80px;
					animation: pulse-grid 12s cubic-bezier(0.4, 0, 0.2, 1)
						infinite;
				}

				.lab-sweep {
					background: linear-gradient(
						45deg,
						transparent 44%,
						rgba(129, 140, 248, 0.12) 50%,
						transparent 56%
					);
					animation: slow-sweep 22s linear infinite;
				}

				.kinetic-shard {
					animation: drift 30s ease-in-out infinite;
				}
			`}</style>
		</>
	);
}
