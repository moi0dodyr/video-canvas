const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public')); // Serve static files from the 'public' folder

app.use(express.json());

app.post('/saveContainerPositions', (req, res) => {
    const positions = req.body.positions;

    fs.writeFile('container_positions.json', JSON.stringify(positions), (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.sendStatus(200);
    });
});

app.get('/loadContainerPositions', (req, res) => {
    fs.readFile('container_positions.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        try {
            const positions = JSON.parse(data);
            res.json(positions || []); // Return an empty array if positions is falsy
        } catch (parseError) {
            console.error('Error parsing container positions:', parseError);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
