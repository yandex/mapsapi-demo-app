declare module '*.module.css';
declare module '*.sql';
declare module '*.svg' {
	import React from 'react';

	const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
	export default SVG;
}
declare module '*.png' {
	const url: string;
	export default url;
}
