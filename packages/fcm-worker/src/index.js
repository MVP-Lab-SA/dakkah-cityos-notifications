require('dotenv').config();
const { Kafka } = require('kafkajs');
const admin = require('firebase-admin');

const BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['cityos-redpanda:29092'];
const TOPIC = 'cityos.notifications.send';
const GROUP_ID = 'notifications-fcm-worker'; // Distinct group ID

// Init FCM
if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
    try {
       const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
       admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
       console.log("✅ FCM Initialized");
    } catch (e) {
       console.error("❌ FCM Init Failed:", e.message);
       process.exit(1);
    }
} else {
    console.error("❌ FCM_SERVICE_ACCOUNT_JSON missing");
    process.exit(1);
}

const fcm = admin.messaging();
const kafka = new Kafka({ clientId: 'fcm-worker', brokers: BROKERS });
const consumer = kafka.consumer({ groupId: GROUP_ID });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

    console.log(`🔥 FCM Worker Listening on ${TOPIC}...`);

    await consumer.run({
        eachMessage: async ({ message }) => {
            const payload = JSON.parse(message.value.toString());
            // Filter: Only process FCM provider
            if (payload.provider !== 'FCM') return;

            console.log(`📨 FCM Processing:`, payload.title);
            const { tokens, title, body, data } = payload;
            
            try {
                const response = await fcm.sendMulticast({
                    notification: { title, body },
                    data: data || {},
                    tokens: tokens
                });
                console.log(`🚀 FCM Sent: ${response.successCount}/${tokens.length}`);
            } catch(e) {
                console.error("❌ FCM Error:", e);
            }
        },
    });
};

run().catch(console.error);
