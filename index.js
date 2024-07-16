const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bycrypt = require('bcryptjs')
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.post('/reg-pass', async (req, res) => {
    const {email, password} = req.body;
    console.log(email)
})


app.get('/', (req, res) => {
    res.send('Paymate server is running');
})
app.listen(port, () => {
    console.log(`Paymate server is running on port ${port}`)
})