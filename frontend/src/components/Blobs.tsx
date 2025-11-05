import "../App.css";

export function Blobs() {
	return (
	<div className="fixed inset-0 -z-10 w-screen h-screen overflow-hidden">
		<svg xmlns="https://www.w3.org/2000/svg" className="absolute pointer-evets-none opacity-0" width="0" height="0" goo-defs="true" aria-hidden="true">
      	<defs>
        	<filter id="goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          		<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          		<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -18" result="mask" />
          		<feComposite in="SourceGraphic" in2="goo" operator="atop" />
        	</filter>
      	</defs>
    </svg>
		<div className="gradients-container absolute inset-0">
			<div className="b1 blob"></div>
			<div className="b2 blob"></div>
			<div className="b3 blob"></div>
			<div className="b4 blob"></div>
		</div>
	</div>
	);
}