export const labTheme = {
	page: {
		root: 'relative min-h-screen overflow-hidden bg-slate-950 text-slate-100',
		baseAtmosphere:
			'absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_55%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]',
		farGlow:
			'radial-gradient(circle, rgba(129,140,248,0.18) 0%, rgba(79,70,229,0.12) 35%, rgba(2,6,23,0) 72%)',
		centerGlow:
			'radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(67,56,202,0.18) 35%, rgba(2,6,23,0) 72%)',
		grid: 'absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30',
		content:
			'relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-16',
		title: 'mb-12 font-headline text-4xl font-black uppercase tracking-tighter leading-none text-slate-50',
	},
	section: {
		shell: 'border border-slate-700/70 bg-slate-950/80 shadow-2xl ring-1 ring-inset ring-indigo-300/10 backdrop-blur-sm rounded-md overflow-hidden',
		header: 'border-b border-slate-700/70 bg-slate-900/80 px-5 py-4',
		eyebrow:
			'font-mono text-[10px] uppercase tracking-[0.24em] text-indigo-200/75',
		title: 'mt-2 font-headline text-2xl font-black uppercase tracking-tight text-slate-50',
		description: 'mt-2 max-w-2xl text-sm text-slate-400',
	},
	card: {
		wrapper: 'flex flex-col gap-3',
		shell: 'group relative flex h-full flex-col border border-slate-700/70 bg-slate-950/70 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-slate-950',
		glow: 'absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-300/25 to-transparent opacity-70',
		content: 'relative z-10',
		header: 'flex items-center justify-between gap-3',
		badge: 'inline-flex border border-indigo-400/30 bg-indigo-400/12 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300',
		meta: 'font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500',
		title: 'mt-5 font-headline text-3xl font-black uppercase tracking-tighter leading-none text-slate-50',
		description: 'mt-3 min-h-12 text-sm leading-6 text-slate-400',
		footer: 'mt-6 border-t border-slate-800 pt-4',
	},
	button: {
		base: 'my-1 items-center w-full border px-2 py-2 font-headline font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer',
		active: 'border-indigo-400/50 bg-indigo-500 text-white',
		inactive:
			'border-slate-700/70 bg-slate-900/80 text-slate-100 hover:border-indigo-400/45 hover:bg-indigo-500 hover:text-white',
	},
	form: {
		label: 'font-mono text-[12px] uppercase tracking-[0.22em] text-slate-400',
		fieldShell: 'border border-slate-700/70 bg-slate-950/80',
		fieldLabel:
			'border-b border-slate-800 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400',
		selectWrap:
			'relative focus-within:ring-1 focus-within:ring-indigo-400/30',
		select: 'w-full appearance-none bg-slate-950/80 px-3 py-3 pr-10 font-headline text-sm font-bold uppercase tracking-wide text-slate-100 outline-none',
		option: 'bg-slate-950 text-slate-100',
		chevron:
			'pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-slate-500',
		valueBadge:
			'inline-flex min-w-16 justify-center border border-indigo-400/30 bg-indigo-400/12 px-3 py-1 font-mono text-sm font-bold text-indigo-300',
		slider: 'h-2 w-full cursor-pointer appearance-auto rounded-full bg-slate-800 accent-indigo-400',
		scale: 'mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400',
	},
	log: {
		wrapper: 'relative bottom-0 left-0 z-40 w-full',
		header: 'flex items-center justify-between border-t border-slate-700/70 bg-slate-900/85 px-6 py-2',
		headerTitle:
			'font-headline text-xs font-bold uppercase tracking-wider text-slate-100',
		headerMeta: 'font-mono text-[10px] text-slate-500',
		headerIcon: 'material-symbols-outlined text-sm text-indigo-300',
		headerDivider: 'h-4 w-px bg-slate-700/70',
		headerAction:
			'material-symbols-outlined text-slate-500 text-sm hover:text-slate-200',
		body: 'h-40 overflow-y-auto bg-slate-950/90 p-4 font-mono text-[11px] leading-relaxed text-slate-200 console-scrollbar md:h-56',
		row: 'flex gap-4 border-b border-slate-800 py-1',
		rowActive: 'flex gap-4 border-b border-slate-800 bg-indigo-500/8 py-1',
		time: 'shrink-0 text-slate-500',
		debug: 'w-12 shrink-0 font-bold text-indigo-300',
		text: 'text-slate-200',
		mutedText: 'text-slate-400',
		statusInfo: 'text-emerald-500 font-bold w-12 shrink-0',
		statusWarn: 'text-error font-bold w-12 shrink-0',
		statusSystem: 'w-12 shrink-0 font-bold text-slate-300',
		statusInline: 'rounded-sm bg-indigo-400/20 px-1 text-indigo-300',
		activeText: 'text-indigo-300',
	},
} as const;
