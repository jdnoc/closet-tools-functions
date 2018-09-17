const functions = require('firebase-functions')
const admin = require('firebase-admin')
const stripe = require('stripe')(functions.config().stripe.secret_key);
admin.initializeApp()

//Initialize Cloud Firestore
const db = admin.firestore()

// Disable deprecated features
db.settings({
    timestampsInSnapshots: true
})

//create customer
    //create stripe customer
    //start subscription without payment
    //add default parameters to firestore

exports.create = functions.auth.user().onCreate((user) => {
    const userRef = db.collection('users').doc(user.uid)
    var customer_id;
    var subscription_id;
    console.log(user.email + " created an account.")
    // Create a new customer and then a new subscription for that customer:
    return stripe.customers.create({
        email: user.email
    })
    .then((customer) => {
        console.log("Stripe account created: " + customer.id)
        // start subscription
        customer_id = customer.id

        return stripe.subscriptions.create({
            customer: customer_id,
            items: [{plan: functions.config().stripe.plan}],
            trial_period_days: 7
        });
    })
    .then((subscription) => {
        console.log("Stripe subscription created: " + subscription.id)
        subscription_id = subscription.id
        //initialize database
        var userObject = {
            personal: {
                email : user.email,
            },
            subscription: {
                created: admin.firestore.FieldValue.serverTimestamp(),
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
        console.log("Firestore write successful: users/" + user.uid)
         //Should add email to Buttondown.email here
        return 0;
    })
    .catch((error) => {
        // Deal with an error
        console.error("Error writing document: ", error)
    })
})

//upgrade 
    //[if within free trial, just add payment source and trial_end_now: true]
    //[if after free trial, create a subscription and charge using payment source (update customer source)]
exports.upgrade = functions.https.onRequest((req, res) => {
    const user_email = req.body.stripeEmail;
    const source_token = req.body.stripeToken;
    var free_trial_active;
    var customer_id;
    var subscription_id;

    admin.auth().getUserByEmail(email)
    .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully fetched user data for " + userRecord.email);
        return db.collection(userRecord.uid).doc('stripe').get()
    })
    // .then(doc => {
    //     customer_id = doc.data().stripe.cust_id
    //     subscription_id = doc.data().stripe.cust_id
    //     //Update the payment source
    //     stripe.customers.createSource(customer_id, {            
    //         source: req.body.stripeToken 
    //     })
    // })
    // .then(function(card) {

    // })
    .catch(function(error) {
        console.log("Error fetching user data:", error);
    })

})

//cancel subscription 
    //[update to delete subscription on end date]

//stripe webhook
    //subscription canceled
    //customer source updated
    //customer created

//update payment info
    //add source brand and last 4 digits to firebase

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