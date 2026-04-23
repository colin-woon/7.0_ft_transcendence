import { useLabContext } from '../context/labContext';
import { labRoutes } from '../model/routes';
import { LabService } from '../types';
import GroupLabButton from './groupLabButton';

type RouteCardProps = {
	type: string;
	title: string;
	desc?: string;
};

export default function RouteCard({ type, title, desc }: RouteCardProps) {
	const { labState, setService, setEndpoint, setMethod } = useLabContext();

	// const [service, setService] = useState<Service>('Auth');
	//
	// const [endpoint, setEndpoint] = useState('me');
	//
	const baseService = Object.keys(labRoutes) as LabService[];

	const baseEndpoint = labRoutes[labState.service].endpoints;

	// const baseEndpoint: Record<Service, string[]> = {
	// 	Auth: ['ping', 'login', 'me'],
	// 	Forum: ['ping', 'health', 'me'],
	// 	Chat: ['ping', 'health', 'me'],
	// 	Invalid: ['ping', 'health', 'me'],
	// };

	return (
		<div className="flex flex-col gap-3">
			<div className="group relative flex h-full flex-col border border-slate-700/70 bg-slate-950/70 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950">
				<div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-300/25 to-transparent opacity-70"></div>
				<div className="relative z-10">
					<div className="flex items-center justify-between gap-3">
						<span className="inline-flex border border-indigo-400/30 bg-indigo-400/12 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
							{type || 'Component / Dynamic_Hover'}
						</span>
						<span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
							PutIcon
						</span>
					</div>
					<h3 className="mt-5 font-headline text-3xl font-black leading-none tracking-tighter text-slate-50">
						{title || 'Dynamic Hover Card'}
					</h3>
					<p className="mt-3 text-sm leading-6 text-slate-400">
						{desc ||
							'An interactive card component that responds to hover with dynamic content and layered visuals.'}
					</p>
					<div className="mt-6 border-t border-slate-800 pt-4">
						<div className="space-y-4">
							<div className="mb-3 flex items-center justify-between gap-4">
								<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
									Method mode
								</p>
							</div>
							<div className="flex items-center justify-evenly gap-4">
								<GroupLabButton
									labels={['GET', 'POST', 'DELETE']}
									active={labState.method}
									onClick={(e) =>
										setMethod(e as typeof labState.method)
									}
								/>
							</div>
							<div className="mb-3 flex items-center justify-between gap-4">
								<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
									Route mode
								</p>
							</div>
							<div className="grid grid-cols-1 gap-3 md:grid-cols-[0.95fr_1.25fr]">
								<div className="border border-slate-700/70 bg-slate-950/80">
									<div className="border-b border-slate-800 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
										Service
									</div>
									<div className="relative focus-within:ring-1 focus-within:ring-indigo-400/30">
										<select
											value={labState.service}
											onChange={(e) =>
												setService(
													e.target
														.value as typeof labState.service
												)
											}
											className="w-full appearance-none bg-slate-950/80 px-3 py-3 pr-10 font-headline text-sm font-bold uppercase tracking-wide text-slate-100 outline-none"
										>
											{baseService.map((svc) => (
												<option
													key={svc}
													value={svc}
													className="bg-slate-950 text-slate-100"
												>
													{svc}
												</option>
											))}
										</select>
										<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-slate-500">
											▾
										</span>
									</div>
								</div>
								<div className="border border-slate-700/70 bg-slate-950/80">
									<div className="border-b border-slate-800 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
										Endpoint
									</div>
									<div className="relative focus-within:ring-1 focus-within:ring-indigo-400/30">
										<select
											value={labState.endpoint}
											onChange={(e) =>
												setEndpoint(
													e.target
														.value as typeof labState.endpoint
												)
											}
											className="w-full appearance-none bg-slate-950/80 px-3 py-3 pr-10 font-headline text-sm font-bold uppercase tracking-wide text-slate-100 outline-none"
										>
											{baseEndpoint.map((ep) => (
												<option
													key={ep}
													value={ep}
													className="bg-slate-950 text-slate-100"
												>
													{ep}
												</option>
											))}
										</select>
										<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-slate-500">
											▾
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
