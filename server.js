const express = require('express');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');
const Clarifai = require('clarifai');

const app = express();
app.use(express.json());
app.use(cors());

const clarifai = new Clarifai.App({
    apiKey: '6644cd2fd0cf47e2ae6ff4e5d88b46b0'
});

const saltRounds = 10;

const db = knex({
        client: 'pg',
        connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : '123',
        database : 'smartbrains'
    }
});

app.get('/', (request, response) => {
    response.send(database.users)
})

app.post('/facedetect', (req, res) => {
    const { image } = req.body;
    clarifai.models.predict(Clarifai.FACE_DETECT_MODEL, image)
    .then(result => res.json(result))
    .catch(err => console.log(err))
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json('Empty Fields')
    }
    const hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx => {
        trx.insert({
            email: email,
            password: hash
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .insert({
                    name: name,
                    email: loginEmail[0],
                    join_date: new Date()
                })
                .then(res.json('registered'))
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.post('/signin', (req, res) => {
    const {signInEmail, signInPassword} = req.body;
    db.select('email', 'password').from('login').where('email', signInEmail)
    .then(info => {
        let isValid = bcrypt.compareSync(signInPassword, info[0].password);
        if(isValid) {
            db.select().from('users').where('email', signInEmail)
            .then(userinfo => {
                res.send({
                    entries: userinfo[0].image_entries,
                    msg: 'success',
                    name: userinfo[0].name,
                    email: userinfo[0].email
                })
            })
            .catch(err => res.status(400).json('unable to fetch user information!'))
        } else {
            res.json('wrongCredentials')
        }
    })
    .catch(err => res.json('wrongCredentials'))
})

app.post('/image', (req, res) => {
    db('users').where('email', req.body.email).increment('image_entries', 1)
    .returning('image_entries')
    .then(data => res.json(data[0]))
    .catch(err => res.status(400).json('error'))
})

app.put('/imagecountupdate', (req, res) => {
    database.users.forEach(user => {
        if (user.email === req.body.user) {
            user.entries = req.body.entries
            return
        }
    })
    res.json('success')
})

app.listen(3001, () => {
    console.log('app is running on port 3001');
})

// /signin                     POST
// /register                   POST
// /profile/:userId            GET
// /profile/image              PUT



// ---------------------------------------------------------------------------------------------------------

// <--------We can also do like this------->

// <---In server.js--->

// const signin = require('./signin.js');
// app.post('/signin', signin.handleSignin(req, res, db, bcrypt))


// <---and then in signin.js--->

// const handleSignin = (req, res, db, bcrypt) => {
//     const {signInEmail, signInPassword} = req.body;
//     db.select('email', 'password').from('login').where('email', signInEmail)
//     .then(info => {
//         let isValid = bcrypt.compareSync(signInPassword, info[0].password);
//         if(isValid) {
//             db.select().from('users').where('email', signInEmail)
//             .then(userinfo => {
//                 res.send({
//                     entries: userinfo[0].image_entries,
//                     msg: 'success',
//                     name: userinfo[0].name,
//                     email: userinfo[0].email
//                 })
//             })
//             .catch(err => res.status(400).json('unable to fetch user information!'))
//         } else {
//             res.json('wrongCredentials')
//         }
//     })
//     .catch(err => res.json('wrongCredentials'))
// }

// module.exports = {
//     handleSignin: handleSignin
// }

// --------------------------------------------------------------------------------------------------------------