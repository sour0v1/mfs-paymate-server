# Paymate - Server Side
This repository contains the server-side code for the Pamate web application. The server handles user authentication, transactions, cash-in/cash-out requests,
and provides data to the client-side application.

## Features
- **Send Money :**  Process and record money transactions between users.
- **Cash In / Out Requests :** Manage and process cash-in and cash-out requests from users.
- **Transaction History :** Store and retrieve transaction history for users and agents.
## Installation and Set Up
**1. Clone the Repository :**
```
git clone https://github.com/sour0v1/mfs-paymate-server.git
cd mfs-paymate-server
```
**2. Install dependencies :**
```
npm install
```
**3. Create .env File :**
```
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>

```
**4. Start the Server**
```
node index.js
```
## Security
- **JWT Authentication:** Secure routes using JWT tokens.
- **Password Encryption:** User passwords are encrypted using bcrypt.js before storing in the database.
