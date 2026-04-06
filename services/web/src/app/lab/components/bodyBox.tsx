'use client';

import { useEffect, useState } from 'react';

type BodyBoxProps = {
	value: string;
	method: string;
};

export default function BodyBox({ value, method }: BodyBoxProps) {
	const [content, setContent] = useState(value);

	const isEditable =
		method === 'POST' || method === 'PUT' || method === 'PATCH';

	useEffect(() => {
		setContent(value);
	}, [value]);

	return (
		<div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-md border border-slate-700/70 bg-slate-950/80 shadow-2xl ring-1 ring-inset ring-indigo-300/10 backdrop-blur-sm">
			<div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
				<div>
					<p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
						Request Body
					</p>
					<p className="mt-1 text-xs text-slate-500">
						{isEditable
							? 'Editable JSON payload for write methods.'
							: 'No request body required for this method.'}
					</p>
				</div>
				<span
					className={`inline-flex min-w-14 justify-center border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
						isEditable
							? 'border-indigo-400/30 bg-indigo-400/12 text-indigo-300'
							: 'border-slate-700/70 bg-slate-900/80 text-slate-500'
					}`}
				>
					{method}
				</span>
			</div>
			<textarea
				disabled={!isEditable}
				value={isEditable ? content : '{}'}
				onChange={(e) => setContent(e.target.value)}
				spellCheck={false}
				className={`min-h-56 w-full resize-none px-4 py-4 font-mono text-sm leading-6 console-scrollbar focus:outline-none ${
					isEditable
						? 'bg-slate-950/70 text-slate-300 placeholder:text-slate-500 focus:bg-slate-950 focus:ring-2 focus:ring-inset focus:ring-indigo-400/25'
						: 'cursor-not-allowed bg-slate-950/35 text-slate-600'
				}`}
			/>
		</div>
	);
}
