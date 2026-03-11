export default function Home() {
	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
			<div className="container mx-auto px-8 py-16">
				<div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
					<h1 className="text-4xl font-bold text-white mb-6 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text">
						Test Frontend - SSR with mTLS
					</h1>

					<p className="text-lg text-gray-300 mb-6">
						This is a test Next.js container running with:
					</p>

					<ul className="space-y-3 mb-8">
						<li className="flex items-center text-gray-200">
							<span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
							Server-Side Rendering (SSR)
						</li>
						<li className="flex items-center text-gray-200">
							<span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
							HTTPS with mTLS
						</li>
						<li className="flex items-center text-gray-200">
							<span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
							Node.js {process.version}
						</li>
						<li className="flex items-center text-gray-200">
							<span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
							Environment: {process.env.NODE_ENV}
						</li>
						<li className="flex items-center text-gray-200">
							<span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
							Tailwind CSS v4
						</li>
					</ul>

					<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
						<p className="text-sm text-gray-400 font-mono">
							Server Time:{' '}
							<span className="text-green-400">
								{new Date().toISOString()}
							</span>
						</p>
					</div>
				</div>
				<div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
					<h2 className="text-2xl font-bold text-blue-300 mb-4">
						<a
							href="/test"
							className="underline hover:text-emerald-300 transition"
						>
							Go to Test Page
						</a>
					</h2>
				</div>
			</div>
		</div>
	);
}
