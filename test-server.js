const express = require('express');
const app = express();
const PORT = 5001;

app.get('/api/test', (req, res) => {
    res.json({ working: true });
});

app.listen(PORT, () => {
    console.log(`Test server on port ${PORT}`);
});