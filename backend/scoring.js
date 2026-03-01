const express = require('express');
const router = express.Router();
const app = express();
const port = process.env.PORT || 4005;
const { execFile } = require('child_process');

app.use('/scoring', router);

app.listen(port, () => {
  console.log(`Scoring service listening on port ${port}`);
});

router.get('/deep', (req, res) => {
  const { wallet, pool, token } = req.query;
  execFile('python3', ['./bot/scoring.py', wallet, pool, token], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ score: parseInt(stdout) });
  });
});

module.exports = router;
