# Workflow Visualizer

## Screenshot Placeholder

![WorkflowVisualizer Component](https://via.placeholder.com/800x600/0a0f1e/00f0ff?text=Workflow+Visualizer)

## Features

- **8-stage workflow** visualization
- **Real-time progress tracking** with animated pulse for active stages
- **Status indicators**: pending, active, completed, error
- **Connector lines** showing execution flow
- **Workflow summary panel** with key metrics:
  - Total steps
  - Completed steps
  - Total duration
  - Total profit
- **Icon representation** for each stage
- **Neo Glow design** with glassmorphism

## 8 Workflow Stages

1. **Initialize** 🚀 - Setup and validation
2. **Fetch Prices** 📊 - Query DEX prices
3. **Calculate Arbitrage** 🧮 - Identify opportunities
4. **Optimize Fees** ⚡ - Dynamic fee calculation
5. **Build Transaction** 🔨 - Construct transaction
6. **Submit via Jito** 🎯 - MEV-protected submission
7. **Monitor Status** 👁️ - Track confirmation
8. **Calculate Profit** 💰 - Final profit calculation

## Component Location

`frontend/components/WorkflowVisualizer.js`

## Usage

```javascript
import WorkflowVisualizer from '../components/WorkflowVisualizer';

<WorkflowVisualizer workflow={workflowState} />
```

## Example Data

```javascript
{
  workflow: {
    currentStep: 5,
    steps: [
      { id: 1, name: 'Initialize', status: 'completed', duration: 50 },
      { id: 2, name: 'Fetch Prices', status: 'completed', duration: 120 },
      { id: 3, name: 'Calculate Arbitrage', status: 'completed', duration: 80 },
      { id: 4, name: 'Optimize Fees', status: 'completed', duration: 60 },
      { id: 5, name: 'Build Transaction', status: 'active', duration: null },
      { id: 6, name: 'Submit via Jito', status: 'pending', duration: null },
      { id: 7, name: 'Monitor Status', status: 'pending', duration: null },
      { id: 8, name: 'Calculate Profit', status: 'pending', duration: null }
    ],
    totalDuration: 310,
    estimatedProfit: 0.0045
  }
}
```

---

*To add actual screenshot: Replace this file with a PNG/JPG image*
