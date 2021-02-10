const functions = require("firebase-functions");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

// var serviceAccount = require("../key/admin.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: 'https://my-project.firebaseio.com'
// });
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.addMessage = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into Cloud Firestore using the Firebase Admin SDK.
    const writeResult = await admin.firestore().collection("message").add({original: original});


    await admin.firestore().collection("offer").doc("wBA2DdeQrLfGHZw2dFHw").update({"interestedUsers": ["As", "sd"]});


    // Send back a message that we've succesfully written the message
    res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.makeLowercase = functions.firestore.document("/message/{documentId}")
    .onCreate((snap, context) => {
        // Grab the current value of what was written to Cloud Firestore.
        const original = snap.data().original;

        // Access the parameter `{documentId}` with `context.params`
        console.log("Lowercasing", context.params.documentId, original);

        const lowercase = original.toLowerCase();

        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to Cloud Firestore.
        // Setting an 'lowercase' field in Cloud Firestore document returns a Promise.
        return snap.ref.set({lowercase}, {merge: true});
    });

exports.sendMessageNotification = functions.firestore.document("/conversation/{convID}/message/{messageID}")
    .onCreate((snapshot, context) => {
        const message = snapshot.data()
        console.log("message: ", message);
        return admin.firestore().collection("conversation").doc("" + message.conversationID).get().then(snap => {
            let sender
            let receiver
            for (const participant of snap.data().participants) {
                if (participant.id === message.userID) {
                    sender = participant
                } else {
                    receiver = participant
                }
            }
            return admin.firestore().collection("profile").doc("" + receiver.id).get().then(snap => {
                const token = snap.data().deviceToken;
                console.log("token: ", token);

                const payload = {
                    data: {
                        type: "NEW_MESSAGE",
                        title: sender.name,
                        imageUrl: sender.avatarURL || "",
                        message: message.text,
                        conversationID: message.conversationID,
                        data: JSON.stringify(message)
                    },
                    notification: {
                        title: sender.name,
                        body: message.text,
                        image: sender.avatarURL || ""
                    },
                    // android: {
                    //     notification: {
                    //         click_action: "OPEN_ACTIVITY_1"
                    //     }
                    // },
                    // apns: {
                    //     payload: {
                    //         aps: {
                    //             title: sender.name,
                    //             body: message.text,
                    //             image: sender.avatarURL || ""
                    //         }
                    //     }
                    // },
                    token: token
                };

                return admin.messaging().send(payload)
                    .then(function (response) {
                        console.log("Successfully sent message:", response);
                        console.log(response.results[0].error);
                        return response.successCount
                    })
                    .catch(function (error) {
                        console.log("Error sending message:", error);
                    });

            })
        })


    })

// exports.sendRequestNotification = functions.firestore.document('/offer/{offerID}')
//     .onUpdate((change, context) => {
//
//             //get the offer id of the person who sent the message
//             const offerID = context.params.offerID;
//             console.log("offerID: ", offerID);
//
//             //get the offer
//             const offerBeforeUpdate = change.before.data();
//             console.log("offerBeforeUpdate: ", offerBeforeUpdate);
//
//             const offerAfterUpdate = change.after.data();
//             console.log("offerAfterUpdate: ", offerAfterUpdate);
//
//             if (offerBeforeUpdate.interestedUsers.length < offerAfterUpdate.interestedUsers.length) {
//                 let interestedUserId = ""
//
//                 for (const item of offerAfterUpdate.interestedUsers) {
//                     if (!offerBeforeUpdate.interestedUsers.includes(item)) {
//                         interestedUserId = item
//                     }
//                 }
//                 if (interestedUserId) {
//                     console.log("send notification: ");
//                     return admin.firestore().collection('profile').doc(offerAfterUpdate.userID).get().then(snap => {
//                         const token = snap.data().deviceToken;
//                         console.log("token: ", token);
//
//                         return admin.firestore().collection('profile').doc(interestedUserId).get().then(snap => {
//                             const interestedUser = snap.data()
//                             console.log("interestedUser: ", interestedUser);
//                             const message = {
//                                 data: {
//                                     type: "NEW_REQUEST",
//                                     title: interestedUser.name,
//                                     message: "Hi, I am interested in your offer",
//                                     imageUrl: interestedUser.avatarUrl || "",
//                                     data: JSON.stringify(interestedUser)
//                                 },
//                                 notification: {
//                                     title: interestedUser.name,
//                                     body: "Hi, I am interested in your offer",
//                                     image: interestedUser.avatarUrl || ""
//                                 },
//                                 token: token
//                             };
//
//                             return admin.messaging().send(message)
//                                 .then((response) => {
//                                     // Response is a message ID string.
//                                     console.log('Successfully sent message:', response);
//                                     return response
//                                 })
//                                 .catch((error) => {
//                                     console.log('Error sending message:', error);
//                                 });
//                         })
//                     })
//                 }
//                 return 0
//             }
//
//
//         }
//     );
