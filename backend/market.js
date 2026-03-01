const express = require('express');
const router = express.Router();
const axios = require('axios');
const app = express();
const port = process.env.PORT || 4002;

app.use('/market', router);

app.listen(port, () => {
  console.log(`Market service listening on port ${port}`);
});

// Live price endpoint
router.get('/prices', async (req, res) => {
  try {
    // Example: fetch SOL/USDC price from CoinGecko
    const resp = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd');
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Gas/slippage estimation
router.get('/estimate', (req, res) => {
  // Placeholder: estimate gas and slippage
  res.json({ gas: 0.0001, slippage: 0.005 });
});

module.exports = router;
