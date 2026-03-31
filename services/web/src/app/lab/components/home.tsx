import React from 'react';
import LogBox from './logBox';
import UserCard from './userCard';
import RateLimitCard from './rateLimitCard';
import RouteCard from './routeCard';
import BodyBox from './bodyBox';
import ExecuteCard from './executeCard';

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

	const testdata = {
		testPost: {
			hhehee: '',
		},
		testvee: '',
	};

	return (
		<main
			// relative: background layers can use absolute positioning against this root
			// min-h-screen: page fills the viewport height
			// overflow-hidden: hide blurred shapes spilling outside the page
			// bg/text: default page colors
			className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
			onMouseMove={mouseMove}
			onMouseLeave={() => setMotion({ x: 0, y: 0 })}
		>
			<div
				// absolute inset-0: stretch across the full page
				// This is the static base atmosphere behind everything else.
				className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_55%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]"
			/>

			<div
				// This is the farther glow layer.
				// It is larger, dimmer, and moves less than the brighter foreground glow.
				className="absolute left-[22%] top-[28%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
				style={{
					background:
						'radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(79,70,229,0.12) 35%, rgba(2,6,23,0) 72%)',
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
						'radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(67,56,202,0.18) 35%, rgba(2,6,23,0) 72%)',

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
				<h3 className="mb-12 font-headline text-4xl font-black uppercase leading-none tracking-tighter text-slate-50">
					42Overflow Lab
				</h3>

				<section className="overflow-hidden rounded-md border border-slate-700/70 bg-slate-950/80 shadow-2xl ring-1 ring-inset ring-indigo-300/10 backdrop-blur-sm">
					<div className="border-b border-slate-700/70 bg-slate-900/80 px-5 py-4 flex items-center gap-3">
						<h2 className="mt-2 font-headline text-2xl font-black uppercase tracking-tight text-indigo-400">
							Lab Controller
						</h2>
						<p className="mt-4 max-w-2xl text-sm text-slate-400">
							Explore and validate 42Overflow's features with live
							tests and real-time logs.
						</p>
					</div>
					{/* <div className="divide-dashed divide-indigo-400 divide-x-3 grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 px-5 py-4 border-b border-outline/20 bg-surface-container-high"> */}
					{/* <MonoCard /> */}
					{/* <MonoCard /> */}
					{/* <MonoCard /> */}
					{/* </div> */}

					<div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
						<UserCard
							type="Auth"
							title="User Type"
							desc="Fetch and display user information based on the current session or provided credentials."
						/>
						<RateLimitCard
							type="Rate Limit"
							title="Stress Test"
							desc="Simulate high request volumes to evaluate how the system handles rate limiting and throttling under load."
						/>
						<RouteCard
							type="Route"
							title="Route Explorer"
							desc="Selection of available routes."
						/>
					</div>
					<div className="flex items-center justify-center p-6 gap-6 ">
						<BodyBox
							value={JSON.stringify(testdata, null, 4)}
							method="POST"
						/>
						<ExecuteCard />
					</div>
				</section>
				<LogBox />
			</div>
		</main>
	);
}
