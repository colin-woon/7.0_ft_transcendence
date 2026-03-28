import React from 'react';

type SectionCardProps = {
	title: string;
	description?: string;
	children: React.ReactNode;
};

export default function SectionCard({
	title,
	description,
	children,
}: SectionCardProps) {
	return (
		<section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold tracking-tight text-stone-100">
					{title}
				</h2>

				{description ? (
					<p className="max-w-xl text-sm leading-6 text-stone-300">
						{description}
					</p>
				) : null}
			</div>

			<div className="mt-6">{children}</div>
		</section>
	);
}
