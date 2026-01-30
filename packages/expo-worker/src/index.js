require('dotenv').config();
const { CityOSCityBusClient } = require('@mvp-lab-sa/cityos-sdk');
const { Expo } = require('expo-server-sdk');

const BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['cityos-redpanda:29092'];
const TOPIC = 'cityos.notifications.send';
const GROUP_ID = 'notifications-expo-worker'; // Distinct group ID

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

const bus = new CityOSCityBusClient({ clientId: 'expo-worker', brokers: BROKERS });

const run = async () => {
    await bus.connect();
    
    console.log(`📱 Expo Worker Listening on ${TOPIC}...`);

    await bus.subscribe(GROUP_ID, TOPIC, async (message) => {
        const payload = message.payload;
        // Filter: Only process EXPO provider
        if (payload.provider !== 'EXPO') return;

        console.log(`📨 Expo Processing:`, payload.title);
        const { tokens, title, body, data } = payload;
        
        let messages = [];
        for (let pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken)) continue;
            messages.push({ to: pushToken, sound: 'default', title, body, data });
        }

        let chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
                console.log(`🚀 Expo Sent Batch`);
            } catch (error) {
                console.error("❌ Expo Error:", error);
            }
        }
    });
};

run().catch(console.error);
