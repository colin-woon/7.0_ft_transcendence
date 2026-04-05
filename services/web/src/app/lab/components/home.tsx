import React from 'react';
import LogBox from './logBox';
import UserCard from './userCard';
import RateLimitCard from './rateLimitCard';
import RouteCard from './routeCard';
import BodyBox from './bodyBox';
import ExecuteCard from './executeCard';
import LabBackground from './labBackground';

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
			<LabBackground motion={motion} />

			<div
				// relative z-10: content sits above all background layers
				// mx-auto max-w-6xl: center the content and keep line lengths reasonable
				// flex flex-col: vertical page stacking
				// px/py: page padding
				className="relative z-40 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16 gap-4"
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
