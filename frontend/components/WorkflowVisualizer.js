// Workflow Visualizer Component - Shows arbitrage execution flow
import { useState, useEffect } from 'react';

export default function WorkflowVisualizer({ workflowState }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState({});
  
  const workflowSteps = [
    { id: 'detect', name: 'Detect Opportunity', icon: '🔍', description: 'Scanning liquidity pools' },
    { id: 'calculate', name: 'Calculate Profit', icon: '📊', description: 'Analyzing arbitrage routes' },
    { id: 'optimize', name: 'Optimize Fees', icon: '⚡', description: 'Dynamic fee optimization' },
    { id: 'build', name: 'Build Transaction', icon: '🔨', description: 'Creating flashloan tx' },
    { id: 'sign', name: 'Sign Transaction', icon: '✍️', description: 'Wallet signature' },
    { id: 'submit', name: 'Submit to Network', icon: '📡', description: 'Broadcasting transaction' },
    { id: 'confirm', name: 'Confirm Execution', icon: '✅', description: 'Awaiting confirmation' },
    { id: 'profit', name: 'Realize Profit', icon: '💰', description: 'Profit credited' },
  ];
  
  useEffect(() => {
    if (workflowState) {
      setCurrentStep(workflowState.currentStep || 0);
      setStepStatuses(workflowState.statuses || {});
    }
  }, [workflowState]);
  
  const getStepStatus = (stepId) => {
    return stepStatuses[stepId] || 'pending';
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#00ff88';
      case 'active': return '#00f0ff';
      case 'error': return '#ff4444';
      case 'pending': return '#888';
      default: return '#888';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'active': return '⟳';
      case 'error': return '✗';
      case 'pending': return '○';
      default: return '○';
    }
  };
  
  return (
    <div className="workflow-container">
      <style jsx>{`
        .workflow-container {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 15px;
          padding: 25px;
          margin: 20px 0;
        }
        
        .workflow-header {
          margin-bottom: 30px;
        }
        
        .workflow-title {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00f0ff 0%, #bf00ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .workflow-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f0ff 0%, #00ff88 100%);
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        
        .progress-text {
          font-size: 0.9rem;
          color: #00ff88;
          min-width: 60px;
          text-align: right;
        }
        
        .workflow-steps {
          position: relative;
        }
        
        .workflow-connector {
          position: absolute;
          left: 30px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, 
            rgba(0, 240, 255, 0.5) 0%,
            rgba(0, 240, 255, 0.2) 100%
          );
        }
        
        .workflow-step {
          position: relative;
          display: flex;
          align-items: center;
          padding: 20px 0;
          transition: all 0.3s ease;
        }
        
        .workflow-step:hover {
          transform: translateX(5px);
        }
        
        .step-marker {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
        }
        
        .step-status-badge {
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
          border: 2px solid rgba(0, 0, 0, 0.5);
        }
        
        .step-content {
          flex: 1;
          margin-left: 20px;
        }
        
        .step-name {
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .step-description {
          font-size: 0.85rem;
          color: #888;
        }
        
        .step-time {
          font-size: 0.75rem;
          color: #00f0ff;
          margin-top: 5px;
        }
        
        .status-completed .step-marker {
          background: rgba(0, 255, 136, 0.2);
          border: 2px solid #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        
        .status-active .step-marker {
          background: rgba(0, 240, 255, 0.2);
          border: 2px solid #00f0ff;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
          animation: pulse 2s ease-in-out infinite;
        }
        
        .status-error .step-marker {
          background: rgba(255, 68, 68, 0.2);
          border: 2px solid #ff4444;
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
        }
        
        .status-pending .step-marker {
          background: rgba(136, 136, 136, 0.1);
          border: 2px solid #888;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .workflow-summary {
          margin-top: 30px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          display: flex;
          justify-content: space-around;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00f0ff 0%, #00ff88 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .summary-label {
          font-size: 0.85rem;
          color: #888;
          margin-top: 5px;
        }
      `}</style>
      
      <div className="workflow-header">
        <h3 className="workflow-title">🔄 Arbitrage Workflow</h3>
        <div className="workflow-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / workflowSteps.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            {Math.round((currentStep / workflowSteps.length) * 100)}%
          </div>
        </div>
      </div>
      
      <div className="workflow-steps">
        <div className="workflow-connector" />
        
        {workflowSteps.map((step, index) => {
          const status = index < currentStep ? 'completed' :
                        index === currentStep ? 'active' :
                        getStepStatus(step.id);
          
          return (
            <div key={step.id} className={`workflow-step status-${status}`}>
              <div className="step-marker">
                {step.icon}
                <div
                  className="step-status-badge"
                  style={{ background: getStatusColor(status) }}
                >
                  {getStatusIcon(status)}
                </div>
              </div>
              <div className="step-content">
                <div className="step-name" style={{ color: getStatusColor(status) }}>
                  {step.name}
                </div>
                <div className="step-description">{step.description}</div>
                {status === 'completed' && (
                  <div className="step-time">✓ Completed</div>
                )}
                {status === 'active' && (
                  <div className="step-time">⟳ In Progress...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {workflowState?.summary && (
        <div className="workflow-summary">
          <div className="summary-item">
            <div className="summary-value">{workflowState.summary.totalSteps || 0}</div>
            <div className="summary-label">Total Steps</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{workflowState.summary.completed || 0}</div>
            <div className="summary-label">Completed</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{workflowState.summary.duration || 0}ms</div>
            <div className="summary-label">Duration</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">
              {workflowState.summary.profit ? workflowState.summary.profit.toFixed(4) : '0.0000'}
            </div>
            <div className="summary-label">Profit (SOL)</div>
          </div>
        </div>
      )}
    </div>
  );
}
