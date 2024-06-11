const express = require('express');
const axios = require('axios');
const csv = require('csv-parser');
const stream = require('stream');
const util = require('util');

const app = express();
app.use(express.json());

const finished = util.promisify(stream.finished);

app.post('/zk/getTokenAmounts', async (req, res) => {
    try {
        const userIds = req.body.userIds;
        const url = 'https://raw.githubusercontent.com/ZKsync-Association/zknation-data/main/eligibility_list.csv';
        const response = await axios.get(url, {responseType: 'stream'}).catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error fetching data' });
            return;
        });

        const dataStream = response.data.pipe(csv());

        const tokenAmounts = {};
        dataStream.on('data', (row) => {
            if (userIds.includes(row.userId)) {
                tokenAmounts[row.userId] = row.tokenAmount;
            }
        });

        dataStream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: 'Error processing data' });
        });

        await finished(dataStream);
        res.json(tokenAmounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unexpected server error' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));