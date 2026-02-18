// Execution Timeline Visualizer Component
import { useState, useEffect } from 'react';
import styles from '../styles/neo-glow.css';

export default function ExecutionTimeline({ executionData }) {
  const [timeline, setTimeline] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  
  useEffect(() => {
    if (executionData?.timeline) {
      setTimeline(executionData.timeline);
      calculateDuration(executionData.timeline);
    }
  }, [executionData]);
  
  const calculateDuration = (timelineData) => {
    if (timelineData.length < 2) return;
    const start = timelineData[0].timestamp;
    const end = timelineData[timelineData.length - 1].timestamp;
    setTotalDuration(end - start);
  };
  
  const getStageColor = (stage, status) => {
    if (status === 'failed' || status === 'error') return '#ff4444';
    if (status === 'started') return '#ffaa00';
    if (status === 'completed') return '#00ff88';
    return '#888';
  };
  
  const getStageIcon = (stage) => {
    const icons = {
      init: '🚀',
      fee_optimization: '⚡',
      build_transaction: '🔨',
      jito_submission: '🎯',
      standard_submission: '📤',
      profit_calculation: '💰',
      error: '❌',
    };
    return icons[stage] || '•';
  };
  
  const getRelativeTime = (timestamp) => {
    if (timeline.length === 0) return 0;
    const start = timeline[0].timestamp;
    return timestamp - start;
  };
  
  const getStageWidth = (index) => {
    if (index >= timeline.length - 1) return 0;
    const duration = timeline[index + 1].timestamp - timeline[index].timestamp;
    return totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
  };
  
  return (
    <div className="timeline-container">
      <style jsx>{`
        .timeline-container {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 15px;
          padding: 25px;
          margin: 20px 0;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .timeline-title {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00f0ff 0%, #bf00ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .timeline-duration {
          font-size: 0.9rem;
          color: #00ff88;
        }
        
        .timeline-track {
          position: relative;
          height: 80px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          overflow: hidden;
          margin: 20px 0;
        }
        
        .timeline-segments {
          display: flex;
          height: 100%;
        }
        
        .timeline-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          transition: all 0.3s ease;
        }
        
        .timeline-segment:hover {
          transform: scaleY(1.1);
          z-index: 10;
        }
        
        .timeline-stages {
          margin-top: 20px;
        }
        
        .timeline-stage {
          display: flex;
          align-items: center;
          padding: 12px;
          margin: 8px 0;
          background: rgba(0, 0, 0, 0.3);
          border-left: 3px solid;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .timeline-stage:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: translateX(5px);
        }
        
        .stage-icon {
          font-size: 1.5rem;
          margin-right: 15px;
        }
        
        .stage-info {
          flex: 1;
        }
        
        .stage-name {
          font-weight: bold;
          text-transform: capitalize;
          margin-bottom: 4px;
        }
        
        .stage-time {
          font-size: 0.85rem;
          color: #888;
        }
        
        .stage-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-started {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
        }
        
        .status-completed {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }
        
        .status-failed {
          background: rgba(255, 68, 68, 0.2);
          color: #ff4444;
        }
      `}</style>
      
      <div className="timeline-header">
        <h3 className="timeline-title">⏱️ Execution Timeline</h3>
        <div className="timeline-duration">
          Total Duration: <strong>{totalDuration}ms</strong>
        </div>
      </div>
      
      {timeline.length > 0 && (
        <>
          <div className="timeline-track">
            <div className="timeline-segments">
              {timeline.map((stage, index) => (
                <div
                  key={index}
                  className="timeline-segment"
                  style={{
                    width: `${getStageWidth(index)}%`,
                    background: `linear-gradient(135deg, ${getStageColor(stage.stage, stage.status)} 0%, ${getStageColor(stage.stage, stage.status)}88 100%)`,
                  }}
                  title={`${stage.stage} - ${stage.status} - ${getRelativeTime(stage.timestamp)}ms`}
                >
                  {getStageIcon(stage.stage)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="timeline-stages">
            {timeline.map((stage, index) => (
              <div
                key={index}
                className="timeline-stage"
                style={{ borderLeftColor: getStageColor(stage.stage, stage.status) }}
              >
                <div className="stage-icon">{getStageIcon(stage.stage)}</div>
                <div className="stage-info">
                  <div className="stage-name">{stage.stage.replace(/_/g, ' ')}</div>
                  <div className="stage-time">
                    +{getRelativeTime(stage.timestamp)}ms
                    {stage.priorityFee && ` • Fee: ${stage.priorityFee} lamports`}
                    {stage.signature && ` • Sig: ${stage.signature.substring(0, 8)}...`}
                    {stage.bundleId && ` • Bundle: ${stage.bundleId.substring(0, 12)}...`}
                    {stage.error && ` • Error: ${stage.error}`}
                  </div>
                </div>
                <div className={`stage-status status-${stage.status}`}>
                  {stage.status}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {timeline.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
          No execution timeline data available
        </div>
      )}
    </div>
  );
}
