# Profit Heatmap (24-hour)

## Screenshot Placeholder

![ProfitHeatmap Component](https://via.placeholder.com/800x400/0a0f1e/bf00ff?text=Profit+Heatmap+(24h))

## Features

- **24×4 grid**: 24 hours × 4 providers (Raydium, Orca, Jupiter, Meteora)
- **Color gradient**: Cyan (low profits) → Red (high profits)
- **Interactive tooltips** showing:
  - Hour and provider
  - Number of executions
  - Total and average profit
- **Legend** with min/max profit display
- **Real-time updates** via WebSocket
- **Neo Glow glassmorphism** styling

## Component Location

`frontend/components/ProfitHeatmap.js`

## Usage

```javascript
import ProfitHeatmap from '../components/ProfitHeatmap';

<ProfitHeatmap data={profitData} />
```

## Example Data

```javascript
{
  heatmapData: [
    { hour: 0, provider: 'Raydium', executions: 12, totalProfit: 0.045, avgProfit: 0.00375 },
    { hour: 0, provider: 'Orca', executions: 8, totalProfit: 0.032, avgProfit: 0.004 },
    { hour: 1, provider: 'Raydium', executions: 15, totalProfit: 0.068, avgProfit: 0.00453 }
    // ... 96 total data points (24 hours × 4 providers)
  ]
}
```

---

*To add actual screenshot: Replace this file with a PNG/JPG image*
