import LabButton from './labButton';

type GroupLabButtonProps = {
	labels: string[];
	active: string;
	onClick: (option: string) => void;
	className?: string;
};

export default function GroupLabButton({
	labels,
	active,
	onClick,
	className,
}: GroupLabButtonProps) {
	return (
		<div
			className={`flex justify-between gap-2 items-center ${className ?? ''}`}
		>
			{labels.map((label) => (
				<LabButton
					key={label}
					label={label}
					active={active === label}
					onClick={() => onClick(label)}
				/>
			))}
		</div>
	);
}
