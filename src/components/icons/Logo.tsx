import React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="150" height="30" viewBox="0 0 150 30" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Literata, serif"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--primary))"
      >
        SrishFlow
      </text>
    </svg>
  );
}
