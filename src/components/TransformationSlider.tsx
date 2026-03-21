import React, { useState, useRef, useEffect } from 'react';

interface TransformationSliderProps {
  beforeImage: string;
  afterImage: string;
}

const TransformationSlider: React.FC<TransformationSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    // Support both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    
    setSliderPosition(percent);
  };

  return (
    <div className="glass-card glow-primary" style={{ padding: '1rem', marginBottom: '2rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>DAY 1 VS NOW</h3>
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '3/4', // Assuming portrait photos are standard
          overflow: 'hidden', 
          borderRadius: '12px',
          cursor: 'ew-resize',
          userSelect: 'none'
        }}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleDrag(e);
        }}
        onTouchMove={handleDrag}
      >
        {/* After Image (Background) */}
        <img 
          src={afterImage} 
          alt="After" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
          draggable={false}
        />

        {/* Before Image (Foreground overlay clipped) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}>
          <img 
            src={beforeImage} 
            alt="Before" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            draggable={false}
          />
        </div>

        {/* Slider Handle Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '4px',
          background: 'var(--primary)',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--background)',
            border: '3px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>&lt;&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationSlider;
