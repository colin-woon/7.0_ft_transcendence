import React from 'react';
import SectionCard from './section-card';

export default function LabHome() {
	const [motion, setMotion] = React.useState({ x: 0, y: 0 });

	function mouseMove(e: React.MouseEvent<HTMLElement>) {
		const rect = e.currentTarget.getBoundingClientRect();

		// Convert mouse position into percentages inside this element.
		const px = (e.clientX - rect.left) / rect.width;
		const py = (e.clientY - rect.top) / rect.height;

		// Remap 0..1 to -1..1 so center becomes 0,0.
		setMotion({
			x: px * 2 - 1,
			y: py * 2 - 1,
		});
	}

	return (
		<main
			// relative: background layers can use absolute positioning against this root
			// min-h-screen: page fills the viewport height
			// overflow-hidden: hide blurred shapes spilling outside the page
			// bg/text: default page colors
			className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100"
			onMouseMove={mouseMove}
			onMouseLeave={() => setMotion({ x: 0, y: 0 })}
		>
			<div
				// absolute inset-0: stretch across the full page
				// This is the static base atmosphere behind everything else.
				className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,113,108,0.22),transparent_55%),linear-gradient(180deg,#1c1917_0%,#0c0a09_100%)]"
			/>

			<div
				// This is the farther glow layer.
				// It is larger, dimmer, and moves less than the brighter foreground glow.
				className="absolute left-[22%] top-[28%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
				style={{
					background:
						'radial-gradient(circle, rgba(148,163,184,0.18) 0%, rgba(71,85,105,0.12) 35%, rgba(12,10,9,0) 72%)',
					transform: `translate(calc(-50% + ${motion.x * 8}px), calc(-50% + ${motion.y * 8}px))`,
				}}
			/>

			<div
				// absolute: layer floats independently of normal document flow
				// left-1/2 top-1/2: place the layer's anchor point at page center
				// h/w: custom size for the glow circle
				// -translate-x/y-1/2: shift it back by half its own size so it is truly centered
				// rounded-full: make the box circular
				// opacity-60: soften the layer
				// blur-3xl: turn the circle into a glow rather than a hard shape
				className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
				style={{
					// Radial gradient gives the layer a bright center and faded edge.
					background:
						'radial-gradient(circle, rgba(251,191,36,0.34) 0%, rgba(249,115,22,0.18) 35%, rgba(12,10,9,0) 72%)',

					// Move this layer based on mouse position.
					// motion.x/y are in -1..1, so multiply them by a small pixel value.
					transform: `translate(calc(-50% + ${motion.x * 18}px), calc(-50% + ${motion.y * 18}px))`,
				}}
			/>

			<div
				// Another full-page layer.
				// This uses two thin linear gradients to fake a subtle grid.
				// bg-[size:72px_72px]: sets the spacing between the grid lines.
				// opacity-30: keeps the pattern quiet so it does not overpower the content.
				className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30"
			/>

			<div
				// relative z-10: content sits above all background layers
				// mx-auto max-w-6xl: center the content and keep line lengths reasonable
				// flex flex-col: vertical page stacking
				// px/py: page padding
				className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16"
			>
				<h1
					// text-5xl: large heading
					// font-semibold: slightly strong emphasis
					// tracking-tight: tighter letter spacing for a sharper display feel
					className="text-5xl font-semibold tracking-tight"
				>
					Gateway Lab
				</h1>

				<p
					// mt-4: space below the title
					// max-w-2xl: keep paragraph width readable
					// text-sm: small supporting copy
					// text-stone-300: lighter muted text color
					className="mt-4 max-w-2xl text-sm text-stone-300"
				>
					Interactive traffic console for HTTP, SSE, and WebSocket
					gateway testing.
				</p>

				<div className="mt-12 grid gap-6 lg:grid-cols-2">
					<SectionCard
						title="API Traffic"
						description="Simulate healthy requests, bursts, and controlled failures against the gateway."
					>
						<div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
							API controls will go here.
						</div>
					</SectionCard>

					<SectionCard
						title="SSE Traffic"
						description="Open valid event streams and trigger invalid stream requests for observability testing."
					>
						<div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
							SSE controls will go here.
						</div>
					</SectionCard>

					<SectionCard
						title="WebSocket Traffic"
						description="Create socket sessions, send messages, and trigger throttling scenarios."
					>
						<div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
							WebSocket controls will go here.
						</div>
					</SectionCard>

					<SectionCard
						title="Activity Log"
						description="Surface request outcomes, connection changes, and test feedback from this lab."
					>
						<div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
							Runtime activity will go here.
						</div>
					</SectionCard>
				</div>
			</div>
		</main>
	);
}
