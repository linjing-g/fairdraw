
import React, { useMemo, useRef, useEffect } from 'react';
import { Token } from '../types';
import { audioService } from '../services/audioService';

interface WheelSpinnerProps {
  isSpinning: boolean;
  rotation: number;
  tokens: Token[];
}

const WheelSpinner: React.FC<WheelSpinnerProps> = ({ isSpinning, rotation, tokens }) => {
  const wheelRef = useRef<SVGSVGElement>(null);
  const totalTokens = tokens.length;
  const sliceAngle = totalTokens > 0 ? 360 / totalTokens : 360;

  const lastTickAngle = useRef(0);
  useEffect(() => {
    if (isSpinning) {
        const checkTick = () => {
            if (!wheelRef.current) return;
            const style = window.getComputedStyle(wheelRef.current);
            const matrix = new DOMMatrixReadOnly(style.transform);
            const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            const normalizedAngle = (angle + 360) % 360;
            
            if (Math.abs(normalizedAngle - lastTickAngle.current) > sliceAngle) {
                audioService.playTick();
                lastTickAngle.current = normalizedAngle;
            }
            if (isSpinning) requestAnimationFrame(checkTick);
        };
        requestAnimationFrame(checkTick);
    }
  }, [isSpinning, sliceAngle]);

  const slices = useMemo(() => {
    return tokens.map((token, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;
      
      const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
      const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
      const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
      const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

      // Use the large-arc flag whenever a single slice spans more than 180deg
      // (e.g. when there's only 1 slice on the wheel).
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = totalTokens === 1
        ? `M 50 50 m -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0 Z`
        : `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const midAngle = startAngle + sliceAngle / 2;
      const textX = 50 + 30 * Math.cos((Math.PI * midAngle) / 180);
      const textY = 50 + 30 * Math.sin((Math.PI * midAngle) / 180);

      // Shrink text a little as more slices are added so labels keep fitting.
      const fontSize = totalTokens <= 6 ? 3.8 : totalTokens <= 10 ? 3.0 : 2.4;

      return (
        <g key={token.id}>
          <path d={pathData} fill={token.color} stroke="#ffffff" strokeWidth="0.8" />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize={fontSize}
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {token.label.split(' ').map((word, idx) => (
                <tspan key={idx} x={textX} dy={idx === 0 ? 0 : fontSize + 0.2}>{word}</tspan>
            ))}
          </text>
        </g>
      );
    });
  }, [tokens, sliceAngle, totalTokens]);

  return (
    <div className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] wheel-container mx-auto">
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30">
        <svg width="40" height="40" viewBox="0 0 40 40">
            <path d="M 20 40 L 0 0 L 40 0 Z" fill="#1e293b" />
            <circle cx="20" cy="10" r="4" fill="white" />
        </svg>
      </div>

      <svg
        ref={wheelRef}
        viewBox="0 0 100 100"
        className="w-full h-full rounded-full spin-transition drop-shadow-2xl"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle cx="50" cy="50" r="50" fill="white" />
        {slices}
        <circle cx="50" cy="50" r="10" fill="#1e293b" stroke="white" strokeWidth="1" />
        <text 
            x="50" y="50" 
            textAnchor="middle" 
            alignmentBaseline="middle" 
            fill="white" 
            fontSize="3" 
            fontWeight="bold" 
            transform="rotate(90, 50, 50)"
            className="tracking-tighter"
        >PICK</text>
      </svg>
      
      <div className="absolute inset-[-20px] border-[20px] border-white/50 rounded-full -z-10 pointer-events-none" />
    </div>
  );
};

export default WheelSpinner;
