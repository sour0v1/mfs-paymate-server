const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const bycrypt = require('bcryptjs')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const moment = require('moment');
const moment = require('moment-timezone')
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET;
// console.log(jwtSecret)

// middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://mfs-paymate.web.app'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())

// custom middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('ttt', token);
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    jwt.verify(token, jwtSecret, (errr, userIdentity) => {
        if (errr) {
            return res.status(403).send({ message: 'Forbidden' })
        }
        console.log('uuu', userIdentity)
        req.user = userIdentity;
        next();
    })
}

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
        // await client.connect();
        const database = client.db("paymate");
        const userCollection = database.collection('users');
        const transactionCollection = database.collection('transactions');
        const cashInRequestCollection = database.collection('cashInRequests');
        const cashOutRequestCollection = database.collection('cashOutRequests');

        app.get('/user-info', async (req, res) => {
            const { userIdentity } = req.query;
            // console.log(userIdentity);

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);

            if (checkMail) {
                const query = { email: userIdentity }
                const result = await userCollection.findOne(query);
                res.send(result);
                // res.status().send

            }
            else {
                const query = { phone: userIdentity };
                const result = await userCollection.findOne(query);
                res.send(result);
            }
        })

        // admin
        app.get('/all-agents', verifyToken, async (req, res) => {
            const query = { role: 'agent' }
            const result = await userCollection.find(query).toArray()
            res.send(result);
        })

        app.get('/all-users', verifyToken, async (req, res) => {
            const query = { role: 'user' }
            const result = await userCollection.find(query).toArray()
            res.send(result);
        })

        // app.get('/verify/logged-in', async (req, res) => {
        //     const { user } = req.query;
        //     console.log(user);
        // })

        app.get('/check-balance', verifyToken, async (req, res) => {
            console.log('hhhho', req.user)
            const { email } = req.query;
            console.log(email);
            const query = { email: email };
            const result = await userCollection.findOne(query);
            console.log(result)
            const netBalance = parseFloat(result?.balance).toFixed(2);
            // const netBalance = result?.balance;
            console.log('net - ', netBalance)
            res.send({ balance: netBalance });
        })

        app.get('/user/check-number', verifyToken, async (req, res) => {
            const { phone } = req.query;
            console.log(phone);
            const query = { phone: phone }
            const findPhone = await userCollection.findOne(query);
            console.log(findPhone);

            if (findPhone?.role === 'user') {
                res.send({ matched: true })
            }

            else {
                res.send({ message: 'User not found' })
            }
        })

        app.get('/agent/check-number', verifyToken, async (req, res) => {
            const { phone } = req.query;
            console.log(phone);
            const query = { phone: phone }
            const findPhone = await userCollection.findOne(query);
            console.log(findPhone);

            if (findPhone?.role === 'agent') {
                res.send({ matched: true })
            }

            else {
                res.send({ message: 'Agent not found' })
            }
        })

        app.get('/agent/cash-in-requests', verifyToken, async (req, res) => {
            const { agent } = req.query;
            console.log('ll', agent);

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(agent);
            let agentQuery = ' ';
            if (checkMail) {
                agentQuery = { email: agent }
            }
            else {
                agentQuery = { phone: agent }
            }

            const agentInfo = await userCollection.findOne(agentQuery);
            const agentPhone = agentInfo?.phone;
            console.log(agentPhone)
            const agentFinalQuery = { to: agentPhone };

            const requestInfo = await cashInRequestCollection.find(agentFinalQuery).toArray();
            // console.log(requestInfo)
            res.send(requestInfo);


        })

        app.get('/agent/cash-out-requests', verifyToken, async (req, res) => {
            const { agent } = req.query;
            console.log('ll', agent);

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(agent);
            let agentQuery = ' ';
            if (checkMail) {
                agentQuery = { email: agent }
            }
            else {
                agentQuery = { phone: agent }
            }

            const agentInfo = await userCollection.findOne(agentQuery);
            const agentPhone = agentInfo?.phone;
            console.log(agentPhone)
            const agentFinalQuery = { to: agentPhone };

            const requestInfo = await cashOutRequestCollection.find(agentFinalQuery).toArray();
            // console.log(requestInfo)
            res.send(requestInfo);


        })


        app.get('/user/transaction/send-money', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            console.log(checkMail);

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { from: yourPhone }

            const result = await transactionCollection.find(yourUpdQuery).toArray();
            res.send(result);
        })

        app.get('/user/transaction/recieve-money', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            console.log(checkMail);

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { to: yourPhone }

            const result = await transactionCollection.find(yourUpdQuery).toArray();
            res.send(result);
        })

        app.get('/user/transaction/cash-in', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            console.log(checkMail);

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { from: yourPhone }

            const result = await cashInRequestCollection.find(yourUpdQuery).toArray();
            res.send(result);
        })

        app.get('/user/transaction/cash-out', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            console.log(checkMail);

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { from: yourPhone }

            const result = await cashOutRequestCollection.find(yourUpdQuery).toArray();
            res.send(result);
        })

        app.get('/agent/transaction/cash-in', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { to: yourPhone, accepted: true }

            const result = await cashInRequestCollection.find(yourUpdQuery).toArray();

            return res.send(result);
        })

        app.get('/agent/transaction/cash-out', verifyToken, async (req, res) => {
            const { userIdentity } = req.query;

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            const findResult = await userCollection.findOne(yourQuery);
            // console.log(findResult?.phone);
            const yourPhone = findResult?.phone;
            const yourUpdQuery = { to: yourPhone, accepted: true }

            const result = await cashOutRequestCollection.find(yourUpdQuery).toArray();

            return res.send(result);
        })

        app.post('/verify-user', verifyToken, async (req, res) => {
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const updDoc = {
                $set: {
                    verified: true,
                    balance: 1000,
                }
            }

            const updInfo = await userCollection.updateOne(query, updDoc);
            res.send(updInfo);
            console.log(updInfo);
        })

        app.post('/verify-agent', verifyToken, async (req, res) => {
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const updDoc = {
                $set: {
                    verified: true,
                    balance: 10000,
                }
            }

            const updInfo = await userCollection.updateOne(query, updDoc);
            res.send(updInfo);
            console.log('hmm', updInfo);
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
                const userRole = result?.role;
                console.log(result);
                if (result?.verified) {
                    bycrypt.compare(password, result?.password, async (err, response) => {
                        console.log('yes', response);
                        if (response === true) {
                            const token = jwt.sign({ loggedUser: userIdentity }, jwtSecret, { expiresIn: '1h' })
                            console.log(token)
                            res
                                .cookie('token', token, {
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production' || true,
                                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                                })
                                .send({ isCorrect: true, role: userRole, });
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
                const userRole = result?.role;
                console.log(result);
                if (result?.verified) {
                    bycrypt.compare(password, result?.password, async (err, response) => {
                        console.log('yes', response);
                        if (response === true) {
                            const token = jwt.sign({ loggedUser: userIdentity }, jwtSecret, { expiresIn: '1h' })
                            console.log(token)

                            res
                                .cookie('token', token, {
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production' || true,
                                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                                })
                                .send({ isCorrect: true, role: userRole });
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

        app.post('/user/confirm/send-money', verifyToken, async (req, res) => {
            const { balance, password, phoneNumber, userIdentity } = req.body;
            console.log(balance, password, phoneNumber, userIdentity);
            const money = parseInt(balance);

            const userQuery = { phone: phoneNumber };

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            const result = await userCollection.findOne(yourQuery);
            console.log(result);

            bycrypt.compare(password, result?.password, async (err, response) => {
                console.log('yes', response);
                if (!response) {
                    res.send({ message: 'Wrong Password' });
                    return;
                }
                else {
                    if (money <= 50) {
                        console.log('Minimum balance is 50')
                        res.send({ message: 'Minimum balanced is 50' })
                        return;
                    }

                    if (money <= 100) {
                        console.log('Yeap');
                        if (money > result?.balance) {
                            res.send({ message: 'Your current balance is low' });
                            return;
                        }
                        // here1
                        const yourResult = await userCollection.findOne(yourQuery);

                        const yourUpdBalance = {
                            $set: {
                                balance: yourResult?.balance - money,
                            }
                        }
                        const yourUpdResult = await userCollection.updateOne(yourQuery, yourUpdBalance);
                        console.log(yourUpdResult);

                        const userResult = await userCollection.findOne(userQuery);
                        if (yourUpdResult?.modifiedCount) {
                            const userUpdBalance = {
                                $set: {
                                    balance: userResult?.balance + money,
                                }
                            }
                            const userUpdResult = await userCollection.updateOne(userQuery, userUpdBalance);
                            if (userUpdResult?.modifiedCount) {
                                const transactionInfo = {
                                    from: yourResult?.phone,
                                    to: userResult?.phone,
                                    balance: money,
                                    type: 'Send Money',
                                    date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a")
                                }
                                const transactionResult = await transactionCollection.insertOne(transactionInfo);
                                if (transactionResult?.insertedId) {
                                    res.send(transactionResult);
                                }
                            }

                        }
                    }
                }

                if (money > 100) {
                    if (money + 5 > result?.balance) {
                        console.log('low balance');
                        res.send({ message: 'Your current balance is Low' });
                        return;
                    }
                    else {
                        // here2
                        const yourResult = await userCollection.findOne(yourQuery);

                        const yourUpdBalance = {
                            $set: {
                                balance: yourResult?.balance - (money + 5),
                            }
                        }
                        const yourUpdResult = await userCollection.updateOne(yourQuery, yourUpdBalance);
                        console.log(yourUpdResult);

                        const userResult = await userCollection.findOne(userQuery);
                        if (yourUpdResult?.modifiedCount) {
                            const userUpdBalance = {
                                $set: {
                                    balance: userResult?.balance + money,
                                }
                            }
                            const userUpdResult = await userCollection.updateOne(userQuery, userUpdBalance);
                            if (userUpdResult?.modifiedCount) {
                                const transactionInfo = {
                                    from: yourResult?.phone,
                                    to: userResult?.phone,
                                    balance: money,
                                    type: 'Send Money',
                                    date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a")
                                }
                                const transactionResult = await transactionCollection.insertOne(transactionInfo);
                                if (transactionResult?.insertedId) {
                                    res.send(transactionResult);
                                }
                            }

                        }
                    }
                    console.log(result?.balance)

                }

            })

        })

        app.post('/user/request/cash-in', verifyToken, async (req, res) => {
            const { balance, password, phoneNumber, userIdentity } = req.body;
            console.log(balance, password, phoneNumber, userIdentity);
            const money = parseInt(balance);

            // const agentQuery = { phone: phoneNumber };

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            const result = await userCollection.findOne(yourQuery);
            console.log(result);

            bycrypt.compare(password, result?.password, async (err, response) => {
                console.log('yes', response);
                if (!response) {
                    res.send({ message: 'Wrong Password' });
                    return;
                }
                else {
                    if (money <= 0) {
                        console.log('Enter valid number');
                        res.send({ message: 'Enter valid number' })
                        return;
                    }

                    const requestInfo = {
                        from: result?.phone,
                        to: phoneNumber,
                        balance: balance,
                        date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a")
                    }

                    const requestResult = await cashInRequestCollection.insertOne(requestInfo);
                    if (requestResult?.insertedId) {
                        res.send({ insertedMessage: true });
                    }


                }

            })

        })

        app.post('/user/request/cash-out', verifyToken, async (req, res) => {
            const { balance, password, phoneNumber, userIdentity } = req.body;
            console.log(balance, password, phoneNumber, userIdentity);
            const money = parseInt(balance);

            // const agentQuery = { phone: phoneNumber };

            const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const checkMail = emailRegEx.test(userIdentity);
            let yourQuery = ' ';
            if (checkMail) {
                yourQuery = { email: userIdentity }
            }
            else {
                yourQuery = { phone: userIdentity }
            }

            const result = await userCollection.findOne(yourQuery);
            console.log(result);

            bycrypt.compare(password, result?.password, async (err, response) => {
                console.log('yes', response);
                if (!response) {
                    res.send({ message: 'Wrong Password' });
                    return;
                }
                else {
                    if (money <= 0) {
                        console.log('Enter valid number');
                        res.send({ message: 'Enter valid number' })
                        return;
                    }

                    const charge = money * (1.5 / 100);
                    console.log(charge)

                    if (!(charge + money <= result?.balance)) {
                        return res.send({ message: 'Low Balance' })
                    }

                    const requestInfo = {
                        from: result?.phone,
                        to: phoneNumber,
                        balance: balance,
                        charge: charge,
                        date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a")
                    }

                    const requestResult = await cashOutRequestCollection.insertOne(requestInfo);
                    if (requestResult?.insertedId) {
                        res.send({ insertedMessage: true });
                    }


                }

            })

        })

        app.post('/agent/confirm/cash-in-request', verifyToken, async (req, res) => {
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const result = await cashInRequestCollection.findOne(query);
            console.log(result);

            const agentPhone = result?.to;
            const userPhone = result?.from;

            const balance = parseInt(result?.balance);
            console.log('b', balance)

            const agentQuery = { phone: agentPhone };
            const userQuery = { phone: userPhone }

            // agent
            const agent = await userCollection.findOne(agentQuery)
            const agentCurrentBalance = parseInt(agent?.balance);
            console.log(agentCurrentBalance)

            if (agentCurrentBalance < balance) {
                return res.send({ message: `Sorry! You don't have ${balance} in your account` });
            }

            else {
                const agentUpdBalance = {
                    $set: {
                        balance: agentCurrentBalance - balance
                    }
                }
                const agentResult = await userCollection.updateOne(agentQuery, agentUpdBalance);
                if (agentResult?.modifiedCount) {
                    // user
                    const user = await userCollection.findOne(userQuery)
                    const userCurrentBalance = parseInt(user?.balance);
                    console.log(userCurrentBalance)

                    const userUpdBalance = {
                        $set: {
                            balance: userCurrentBalance + balance
                        }
                    }
                    const userResult = await userCollection.updateOne(userQuery, userUpdBalance);
                    if (userResult?.modifiedCount) {
                        const updRequest = {
                            $set: {
                                accepted: true,
                                date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a")
                            }
                        }
                        const updReqResult = await cashInRequestCollection.updateOne(query, updRequest);
                        res.send(updReqResult);
                    }
                }
            }


        })

        app.post('/agent/confirm/cash-out-request', verifyToken, async (req, res) => {
            console.log(moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a"))
            const { id } = req.query;
            console.log(id);
            const query = { _id: new ObjectId(id) };

            const result = await cashOutRequestCollection.findOne(query);
            console.log(result);

            const agentPhone = result?.to;
            const userPhone = result?.from;

            const balance = parseInt(result?.balance);
            console.log('lll', balance)

            const agentQuery = { phone: agentPhone };
            const userQuery = { phone: userPhone }

            const user = await userCollection.findOne(userQuery)
            const userCurrentBalance = parseInt(user?.balance);
            const totalCharge = balance + (balance * (1.5 / 100))
            console.log('ee', totalCharge)

            // agent
            const agent = await userCollection.findOne(agentQuery)
            const agentCurrentBalance = parseInt(agent?.balance);
            console.log(agentCurrentBalance)
            console.log(agentCurrentBalance + totalCharge);

            if (!(userCurrentBalance >= totalCharge)) {
                return res.send({ message: `Sorry! User has not ${balance} in his/her account` });
            }

            const agentUpdBalance = {
                $set: {
                    balance: agentCurrentBalance + totalCharge
                }
            }
            const agentResult = await userCollection.updateOne(agentQuery, agentUpdBalance);
            if (agentResult?.modifiedCount) {
                // user
                // const user = await userCollection.findOne(userQuery)
                // const userCurrentBalance = user?.balance;
                // console.log(userCurrentBalance)

                const userUpdBalance = {
                    $set: {
                        balance: userCurrentBalance - totalCharge
                    }
                }
                const userResult = await userCollection.updateOne(userQuery, userUpdBalance);
                if (userResult?.modifiedCount) {
                    const updRequest = {
                        $set: {
                            accepted: true,
                            date: moment.tz('Asia/Dhaka').format("dddd, MMMM Do YYYY, h:mm:ss a"),
                        }
                    }
                    const updReqResult = await cashOutRequestCollection.updateOne(query, updRequest);
                    res.send(updReqResult);
                }
            }



        })

        app.post("/logout", async (req, res) => {
            res
                .clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production' || true,
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true });
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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