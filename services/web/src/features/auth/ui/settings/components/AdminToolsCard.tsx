import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Link as LinkIcon } from 'lucide-react';

type AdminToolsCardProps = {
	type: string;
	title: string;
	desc: string;
	icon: LucideIcon;
	link: string;
};

export default function AdminToolsCard({
	type,
	title,
	desc,
	icon: Icon,
	link,
}: AdminToolsCardProps) {
	return (
		<div className="flex flex-col gap-3">
			<div className="group relative flex h-full flex-col rounded-xl border border-base-200 bg-base-100 px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-base-300 hover:bg-base-100">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-base-content/15 to-transparent opacity-70" />

				<div className="relative z-10">
					<div className="flex items-center justify-between gap-3">
						<span className="inline-flex rounded-md border border-base-300 bg-base-200/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-base-content/70">
							{type}
						</span>
						<span className="text-sm text-base-content/50">
							<Icon size={16} />
						</span>
					</div>

					<h3 className="mt-4 text-xl font-bold leading-none tracking-tight text-base-content">
						{title}
					</h3>

					<p className="mt-2 text-sm leading-5 text-base-content/60">
						{desc}
					</p>

					<div className="mt-4 border-t border-base-200 pt-3" />
				</div>

				<Link
					href={link}
					className="btn btn-neutral btn-sm mt-3 flex w-full items-center justify-between px-3 py-2 normal-case"
				>
					<span className="font-medium">Open {title}</span>
					<LinkIcon size={14} />
				</Link>
			</div>
		</div>
	);
}
