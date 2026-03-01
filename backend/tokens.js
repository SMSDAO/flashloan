const express = require('express');
const router = express.Router();
const app = express();
const port = process.env.PORT || 4003;
const { execFile } = require('child_process');

app.use('/tokens', router);

app.listen(port, () => {
  console.log(`Tokens service listening on port ${port}`);
});

router.get('/sync', (req, res) => {
  execFile('python3', ['./bot/token_sync.py'], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    try {
      res.json(JSON.parse(stdout.replace(/'/g, '"')));
    } catch (e) {
      res.status(500).json({ error: 'Invalid token output', details: stdout });
    }
  });
});

module.exports = router;
