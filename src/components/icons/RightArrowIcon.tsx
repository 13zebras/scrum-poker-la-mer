import type { SVGProps } from 'react'

export default function RightArrowIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			viewBox='0 0 100 100'
			role='graphics-symbol'
			{...props}
		>
			<path
				fill='currentColor'
				d='m50.868 78.016l36.418-26.055a2.52 2.52 0 0 0 1.051-2.043v-.006a2.52 2.52 0 0 0-1.059-2.048L50.86 21.977a2.51 2.51 0 0 0-2.612-.183a2.51 2.51 0 0 0-1.361 2.236v12.183l-32.709-.001a2.514 2.514 0 0 0-2.515 2.516l.001 22.541a2.515 2.515 0 0 0 2.516 2.516h32.706v12.187c0 .94.53 1.803 1.366 2.237a2.51 2.51 0 0 0 2.616-.193'
			/>
		</svg>
	)
}
