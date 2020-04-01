// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//exports.helloWorld = functions.https.onRequest((request, response) => {
//    cors(request, response, () => { });
//    return response.send("Hello from Firebase!");
//});

var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-6478c.firebaseio.com/'
});

//exports.storePostData = functions.https.onRequest((request, response) => {
//    return cors(request, response, () => {
//        admin.database().ref('posts').push({
//            id: request.body.id,
//            title: request.body.title,
//            location: request.body.location,
//            image: request.body.image
//        })
//    });
//});


exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        }).then(() => {
            return response.status(201).json({ message: 'Data stored', id: request.body.id });
        }).catch((err) => {
            return response.status(500).json({ error: err });
        });
    });
});

