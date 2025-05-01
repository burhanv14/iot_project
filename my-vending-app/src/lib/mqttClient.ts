import mqtt from 'mqtt';

const client = mqtt.connect(process.env.MQTT_BROKER_URL!, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 5000,
});

client.on('connect', () => console.log('🔌 MQTT connected'));
client.on('error', err => console.error('❌ MQTT error', err));

export default client;
