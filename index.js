const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bycrypt = require('bcryptjs')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhnq0hd.mongodb.net/?appName=Cluster0`;
// console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("paymate");
        const userCollection = database.collection('users');
        // const agentCollection = database.collection('agents');
        const verifiedAgents = database.collection('verifiedAgents')

        app.get('/user-info', async (req, res) => {
            const { userIdentity } = req.query;
            // console.log(userIdentity);

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);

            if (checkMail) {
                const query = { email: userIdentity }
                const result = await userCollection.findOne(query);
                res.send(result);
            }
            else {
                const query = { phone: userIdentity };
                const result = await userCollection.findOne(query);
                res.send(result);
            }
        })

        // admin
        app.get('/all-agents', async (req, res) => {
            const query = { role: 'agent' }
            const result = await userCollection.find(query).toArray()
            res.send(result);
        })

        app.get('/all-users', async (req, res) => {
            const query = { role: 'user' }
            const result = await userCollection.find(query).toArray()
            res.send(result);
        })

        app.get('/check-balance', async (req, res) => {
            const {email} = req.query;
            console.log(email);
            const query = {email : email};
            const result = await userCollection.findOne(query);
            console.log(result)
            const netBalance = result?.balance;
            res.send({balance : netBalance});
        })

        app.get('/user/check-number', async (req, res) => {
            const {phone} = req.query;
            console.log(phone);
            const query = {phone : phone}
            const findPhone = await userCollection.findOne(query);
            console.log(findPhone);

            if(findPhone){
                res.send({matched : true})
            }

            if(!findPhone){
                res.send({message : 'Not registered this number'})
            }
        })
        app.post('/verify-user', async (req, res) => {
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const updDoc = {
                $set: {
                    verified: true,
                    balance : 100,
                }
            }

            const updInfo = await userCollection.updateOne(query, updDoc);
            console.log(updInfo);
        })

        app.post('/verify-agent', async (req, res) => {
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const updDoc = {
                $set: {
                    verified: true,
                    balance : 10000,
                }
            }

            const updInfo = await userCollection.updateOne(query, updDoc);
            console.log(updInfo);
        })

        app.post('/log-user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const { userIdentity, password } = user;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);

            console.log(checkMail);
            if (checkMail) {
                const query = { email: userIdentity };
                console.log('email query -', query);
                const result = await userCollection.findOne(query);
                console.log(result);
                if (result?.verified) {
                    bycrypt.compare(password, result?.password, (err, response) => {
                        console.log('yes', response);
                        if (response === true) {
                            res.send({ isCorrect: true });
                        }
                        else {
                            res.send({ message: 'Wrong Password' })
                        }

                    })
                }
                else if (!result) {
                    res.send({ message: 'Not Registered' })
                }

                else if (!result?.verified) {
                    res.send({ message: 'Not verified. Try later' })
                }
                
                else {
                    res.send({ message: 'This email is not registered.' })
                }

            }
            else {
                const query = { phone: userIdentity };
                console.log(query);
                const result = await userCollection.findOne(query);
                console.log(result);
                if (result?.verified) {
                    bycrypt.compare(password, result?.password, (err, response) => {
                        console.log('yes', response);
                        if (response === true) {
                            res.send({ isCorrect: true });
                        }
                        else {
                            res.send({ message: 'Wrong Password' })
                        }

                    })
                }
                else if (!result?.verified) {
                    res.send({ message: 'Not verified. Try later' })
                }
                else {
                    res.send({ message: 'This Phone Number is not registered.' })
                }
            }

        })

        app.post('/reg-user', async (req, res) => {
            const { password, role, name, phone, email } = req.body;
            // console.log(password, role);
            const user = { name, phone, email, role };

            const phoneQuery = { phone: phone };
            const emailQuery = { email: email };

            const phoneResult = await userCollection.findOne(phoneQuery);
            if (phoneResult) {
                res.send({ message: 'This phone number already exist' });
                return;
            }

            const emailResult = await userCollection.findOne(emailQuery);
            if (emailResult) {
                res.send({ message: 'This email already exist' });
                return;
            }

            bycrypt.genSalt(10, (err, salt) => {
                bycrypt.hash(password, salt, async (err, hashPass) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(hashPass);
                    user.password = hashPass;
                    console.log(user);
                    const result = await userCollection.insertOne(user);
                    console.log(result);
                    res.send(result);
                    // if(role === 'user'){
                    //     const result = await userCollection.insertOne(user);
                    //     console.log(result);
                    //     res.send(result);
                    // }
                    // if(role === 'agent'){
                    //     const result = await agentCollection.insertOne(user);
                    //     res.send(result);
                    // }
                })
            })
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Paymate server is running');
})
app.listen(port, () => {
    console.log(`Paymate server is running on port ${port}`)
})