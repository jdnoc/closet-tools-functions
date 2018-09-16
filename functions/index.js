const functions = require('firebase-functions')
const admin = require('firebase-admin')
const stripe = require('stripe')('sk_test_ipbpSc5hdCCqcpbPDWs8bt65');
admin.initializeApp()

//Initialize Cloud Firestore
const db = admin.firestore()

// Disable deprecated features
db.settings({
    timestampsInSnapshots: true
});

exports.create = functions.auth.user().onCreate((user) => {
    const userRef = db.collection('users').doc(user.uid)
    var customer_id;
    var subscription_id;
    // Create a new customer and then a new subscription for that customer:
    stripe.customers.create({
        email: user.email
    })
    .then((customer) => {
        // start subscription
        customer_id = customer.id

        return stripe.subscriptions.create({
            customer: customer_id,
            items: [{plan: 'plan_D63LEzDXDp9o3Q'}],
            trial_period_days: 7
        });
    })
    .then((subscription) => {
        subscription_id = subscription.id
        //initialize database
        var userObject = {
            personal: {
                email : user.email,
            },
            subscription: {
                created: user.metadata.creationTime,
                active: true,
                has_upgraded: false,
                pending_cancel: false,
                cancel_time: 0,
                state: 0
            },
            settings: {
                return_shares: false,
                share_limit: true,
                share_limit_num: 2000,
                auto_open: true,
                available_only: true
            },
            analytics: {
                share_count: 0,
                share_date: 0
            },
            stripe: {
                cust_id: customer_id,
                sub_id: subscription_id
            }
        };
        return userRef.set(userObject)
    })
    .then(() => {
        console.log("Write successful!")
        return;
    })
    .catch((error) => {
        // Deal with an error
        console.error("Error writing document: ", error)
    });
});

/*
exports.fun = functions.https.onRequest((req, res) => {
    const store = admin.firestore()
    store.collection('users').doc('foo').get().then(doc => {
        if (doc.exists) {
            console.log(doc.data())
            res.send(doc.data())
        }
        else {
            res.send("Nothing")
        }
    }).catch(reason => {
        console.log(reason)
        res.send(reason)
    })
})
*/