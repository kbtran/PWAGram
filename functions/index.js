// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webpush = require('web-push');

// Add correct values 
const mailToEmail = 'mailto:youremail@mail.com';
const vapidPublicKey = 'PutPublicKeyHere';
const vapidPrivateKey = 'PutPrivateKeyHere';

var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-6478c.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        }).then(() => {
            webpush.setVapidDetails(mailToEmail, vapidPublicKey, vapidPrivateKey);
            return admin.database().ref('subscriptions').once('value');
        }).then((subscriptions) => {
            subscriptions.forEach((sub) => {
                var pushConfig =
                {
                    endpoint: sub.val().endpoint,
                    keys: { auth: sub.val().keys.auth, p256dh: sub.val().keys.p256dh }
                };

                webpush.sendNotification(pushConfig, JSON.stringify({
                    title: 'New Post',
                    content: 'New Post added!',
                    openUrl: '/help'
                }))
                    .catch((err) => {
                        console.log(err);
                    })
            });
            return response.status(201).json({ message: 'Data stored', id: request.body.id });
        }).catch((err) => {
            return response.status(500).json({ error: err });
        });
    });
});


 