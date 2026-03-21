import React from 'react';

// For the 100 day challenge, we render a 10x10 grid.
// 0 = upcoming (grey)
// 1 = clean day (green/primary)
// 2 = slip day (red)

interface HeatmapProps {
  habitName: string;
  streakData: number[]; // Array up to 100 days
}

const Heatmap: React.FC<HeatmapProps> = ({ habitName, streakData }) => {
  // Only take the last 7 days
  const fullGrid = [...streakData].slice(-7);
  
  // Pad the array to exactly 7 days if they haven't been in for 7 days
  while (fullGrid.length < 7) {
    fullGrid.push(0); // Fill future days with 0
  }

  const getColor = (status: number) => {
    switch(status) {
      case 1: return 'var(--tertiary)'; // Green for success
      case 2: return 'var(--error)';    // Red for slip
      default: return 'var(--surface-container-high)'; // Empty grey for future
    }
  };

  const getStatusText = (status: number) => {
    switch(status) {
      case 1: return 'Clean';
      case 2: return 'Slipped';
      default: return 'Upcoming';
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
        {habitName.toUpperCase()}
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '4px',
        background: 'var(--surface-container-low)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--outline-variant)'
      }}>
        {fullGrid.map((status, index) => (
          <div 
            key={index} 
            title={`Day ${index + 1}: ${getStatusText(status)}`}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '4px',
              backgroundColor: getColor(status),
              opacity: status === 0 ? 0.3 : 1,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = `0 0 8px ${getColor(status)}`;
              e.currentTarget.style.zIndex = '10';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.zIndex = '1';
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
