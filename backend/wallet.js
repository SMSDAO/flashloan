const express = require('express');
const router = express.Router();
const app = express();
const port = process.env.PORT || 4004;
const { execFile } = require('child_process');

app.use('/wallet', router);

app.listen(port, () => {
  console.log(`Wallet service listening on port ${port}`);
});

router.get('/balance/:wallet', (req, res) => {
  execFile('python3', ['./bot/wallet_sync.py', req.params.wallet], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ balance: parseFloat(stdout) });
  });
});

router.get('/pool/:pool', (req, res) => {
  execFile('python3', ['./bot/wallet_sync.py', req.params.pool], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ pool: req.params.pool, data: stdout });
  });
});

module.exports = router;
