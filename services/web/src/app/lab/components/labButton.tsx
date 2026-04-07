type LabButtonProps = {
	label: string;
	active?: boolean;
	onClick?: () => void;
};

export default function LabButton({ label, active, onClick }: LabButtonProps) {
	return (
		<button
			onClick={onClick}
			className={`my-1 w-full items-center border px-2 py-2 font-headline font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
				active
					? 'border-indigo-400/50 bg-indigo-500 text-white'
					: 'border-slate-700/70 bg-slate-900/80 text-slate-100 hover:border-indigo-400/45 hover:bg-indigo-500 hover:text-white'
			}`}
		>
			{label}
		</button>
	);
}
