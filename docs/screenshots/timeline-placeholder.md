# Execution Timeline Visualizer

## Screenshot Placeholder

![ExecutionTimeline Component](https://via.placeholder.com/800x400/0a0f1e/00f0ff?text=Execution+Timeline+Visualizer)

## Features

- **Real-time stage tracking** with color-coded progress
- **8 execution stages**: init → fee optimization → build transaction → jito submission → standard submission → profit calculation
- **Duration display** for each stage in milliseconds
- **Status indicators**: 🟢 completed, 🟡 in progress, 🔴 error
- **Hover tooltips** with detailed stage information and timestamps
- **Neo Glow design** with glassmorphism effects

## Component Location

`frontend/components/ExecutionTimeline.js`

## Usage

```javascript
import ExecutionTimeline from '../components/ExecutionTimeline';

<ExecutionTimeline timeline={executionData.timeline} />
```

## Example Data

```javascript
{
  timeline: [
    { stage: 'init', status: 'completed', timestamp: 1234567890, duration: 5 },
    { stage: 'fee_optimization', status: 'completed', timestamp: 1234567895, duration: 120 },
    { stage: 'build_transaction', status: 'completed', timestamp: 1234568015, duration: 250 },
    { stage: 'jito_submission', status: 'in_progress', timestamp: 1234568265 }
  ]
}
```

---

*To add actual screenshot: Replace this file with a PNG/JPG image*
