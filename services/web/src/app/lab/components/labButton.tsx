type LabButtonProps = {
	label: string;
	active?: boolean;
	onClick?: () => void;
	disabled?: boolean;
};

export default function LabButton({
	label,
	active,
	onClick,
	disabled = false,
}: LabButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`my-1 w-full items-center border px-2 py-2 font-headline font-bold uppercase tracking-wide transition-all duration-200 ${
				disabled
					? 'cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-500 opacity-60'
					: active
						? 'cursor-pointer border-indigo-400/50 bg-indigo-500 text-white'
						: 'cursor-pointer border-slate-700/70 bg-slate-900/80 text-slate-100 hover:border-indigo-400/45 hover:bg-indigo-500 hover:text-white'
			}`}
		>
			{label}
		</button>
	);
}
