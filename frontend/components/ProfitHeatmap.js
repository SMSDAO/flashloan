// Profit Heatmap Visualizer Component
import { useState, useEffect } from 'react';

export default function ProfitHeatmap({ profitData }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [maxProfit, setMaxProfit] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  useEffect(() => {
    if (profitData && profitData.length > 0) {
      processHeatmapData(profitData);
    }
  }, [profitData]);
  
  const processHeatmapData = (data) => {
    // Group by hour and provider
    const grouped = {};
    let max = 0;
    
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      const provider = item.providers?.[0] || 'Unknown';
      const key = `${hour}-${provider}`;
      
      if (!grouped[key]) {
        grouped[key] = { hour, provider, profit: 0, count: 0 };
      }
      
      grouped[key].profit += item.profit || 0;
      grouped[key].count += 1;
      
      if (grouped[key].profit > max) {
        max = grouped[key].profit;
      }
    });
    
    setMaxProfit(max);
    setHeatmapData(Object.values(grouped));
  };
  
  const getHeatColor = (profit) => {
    if (maxProfit === 0) return 'rgba(0, 240, 255, 0.1)';
    const intensity = Math.min(profit / maxProfit, 1);
    
    if (intensity < 0.2) return `rgba(0, 240, 255, ${0.1 + intensity * 0.3})`;
    if (intensity < 0.5) return `rgba(0, 255, 136, ${0.2 + intensity * 0.3})`;
    if (intensity < 0.8) return `rgba(255, 170, 0, ${0.3 + intensity * 0.3})`;
    return `rgba(255, 68, 68, ${0.4 + intensity * 0.4})`;
  };
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const providers = ['Raydium', 'Orca', 'Jupiter', 'Meteora'];
  
  const getCellData = (hour, provider) => {
    return heatmapData.find(d => d.hour === hour && d.provider === provider);
  };
  
  return (
    <div className="heatmap-container">
      <style jsx>{`
        .heatmap-container {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 15px;
          padding: 25px;
          margin: 20px 0;
        }
        
        .heatmap-header {
          margin-bottom: 25px;
        }
        
        .heatmap-title {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00f0ff 0%, #bf00ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: #888;
        }
        
        .legend-gradient {
          width: 200px;
          height: 20px;
          background: linear-gradient(90deg, 
            rgba(0, 240, 255, 0.2) 0%,
            rgba(0, 255, 136, 0.4) 33%,
            rgba(255, 170, 0, 0.6) 66%,
            rgba(255, 68, 68, 0.8) 100%
          );
          border-radius: 5px;
        }
        
        .heatmap-grid {
          overflow-x: auto;
        }
        
        .heatmap-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
        }
        
        .heatmap-cell {
          width: 35px;
          height: 35px;
          text-align: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .heatmap-cell:hover {
          transform: scale(1.2);
          z-index: 10;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
        }
        
        .hour-label {
          font-size: 0.8rem;
          color: #888;
          text-align: center;
          padding: 5px;
        }
        
        .provider-label {
          font-size: 0.9rem;
          color: #00f0ff;
          padding: 8px;
          text-align: right;
          font-weight: bold;
        }
        
        .tooltip {
          position: fixed;
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid #00f0ff;
          border-radius: 8px;
          padding: 12px;
          font-size: 0.85rem;
          z-index: 1000;
          pointer-events: none;
          min-width: 200px;
        }
        
        .tooltip-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        
        .tooltip-label {
          color: #888;
        }
        
        .tooltip-value {
          color: #00ff88;
          font-weight: bold;
        }
        
        .no-data {
          text-align: center;
          color: #888;
          padding: 40px;
        }
      `}</style>
      
      <div className="heatmap-header">
        <h3 className="heatmap-title">🔥 Profit Heatmap</h3>
        <div className="heatmap-legend">
          <span>Low</span>
          <div className="legend-gradient"></div>
          <span>High</span>
          <span style={{ marginLeft: '10px', color: '#00ff88' }}>
            Max: {maxProfit.toFixed(4)} SOL
          </span>
        </div>
      </div>
      
      {heatmapData.length > 0 ? (
        <div className="heatmap-grid">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th></th>
                {hours.map(hour => (
                  <th key={hour} className="hour-label">
                    {hour}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map(provider => (
                <tr key={provider}>
                  <td className="provider-label">{provider}</td>
                  {hours.map(hour => {
                    const cellData = getCellData(hour, provider);
                    return (
                      <td key={`${hour}-${provider}`}>
                        <div
                          className="heatmap-cell"
                          style={{
                            background: cellData ? getHeatColor(cellData.profit) : 'rgba(0, 0, 0, 0.2)',
                          }}
                          onMouseEnter={(e) => setHoveredCell({ data: cellData, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {cellData ? cellData.count : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          No profit data available for heatmap
        </div>
      )}
      
      {hoveredCell && hoveredCell.data && (
        <div
          className="tooltip"
          style={{
            left: hoveredCell.x + 15,
            top: hoveredCell.y - 80,
          }}
        >
          <div className="tooltip-row">
            <span className="tooltip-label">Hour:</span>
            <span className="tooltip-value">{hoveredCell.data.hour}:00</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Provider:</span>
            <span className="tooltip-value">{hoveredCell.data.provider}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Executions:</span>
            <span className="tooltip-value">{hoveredCell.data.count}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Total Profit:</span>
            <span className="tooltip-value">{hoveredCell.data.profit.toFixed(6)} SOL</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Avg Profit:</span>
            <span className="tooltip-value">
              {(hoveredCell.data.profit / hoveredCell.data.count).toFixed(6)} SOL
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
