import mqtt from 'mqtt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use environment variable or fallback to the hardcoded value
const MQTT_BROKER_URL = 'mqtt://192.168.46.183:1883';
const MQTT_TOPIC = 'rfid/status';

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
  console.log('[MQTT] Connected to', MQTT_BROKER_URL);
  client.subscribe(MQTT_TOPIC, (err: Error | null) => {
    if (err) console.error('[MQTT] Subscribe error:', err);
    else console.log(`[MQTT] Subscribed to ${MQTT_TOPIC}`);
  });
});

client.on('message', async (topic: string, payload: Buffer) => {
  const uid = payload.toString().toUpperCase();
  console.log('[MQTT] Scanned UID:', uid);

  // Find latest order for this RFID
  const order = await prisma.order.findFirst({
    where: { user: { rfidTag: uid } },
    orderBy: { createdAt: 'desc' },
  });

  if (!order) {
    console.log('[DISPENSE] No order found for', uid);
    // Optionally publish back to the ESP32 that no order was found
    // client.publish('rfid/response', 'ORDER_NOT_FOUND');
    return;
  }
  
  if (order.status !== 'pending') {
    console.log('[DISPENSE] Order', order.id, 'already', order.status);
    // Optionally publish back to the ESP32
    // client.publish('rfid/response', `ORDER_${order.status.toUpperCase()}`);
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mark order as dispensed
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'dispensed' },
      });

      // Decrement each product's stock
      for (let i = 0; i < order.items.length; i++) {
        const productId = parseInt(order.items[i], 10);
        const qty = order.qty[i];
        
        await tx.product.update({
          where: { id: productId },
          data: { 
            stock: { decrement: qty }
          }
        });
      }
    });
    
    console.log('[DISPENSE] Order', order.id, 'dispensed successfully');
    // Publish success message back to ESP32
    client.publish('rfid/response', `DISPENSED:${order.id}`);
    
  } catch (e) {
    console.error('[DISPENSE] Error:', (e as Error).message);
    // Publish error message back to ESP32
    client.publish('rfid/response', 'ERROR');
  }
});

// Handle disconnections
client.on('close', () => {
  console.log('[MQTT] Connection closed. Attempting to reconnect...');
});

client.on('error', (error: Error) => {
  console.error('[MQTT] Connection error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  client.end();
  process.exit(0);
});