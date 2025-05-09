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
  const message = payload.toString();
  
  // Ignore the "ESP32 online" message
  if (message === "ESP32 online") {
    console.log('[MQTT] ESP32 reported online');
    return;
  }
  
  const uid = message.toUpperCase();
  console.log('[MQTT] Scanned UID:', uid);

  // Find latest order for this RFID
  const order = await prisma.order.findFirst({
    where: { user: { rfidTag: uid } },
    orderBy: { createdAt: 'desc' },
  });

  if (!order) {
    console.log('[DISPENSE] No order found for', uid);
    // Publish no orders message to the client
    client.publish('rfid/dispensed', 'Hi, Sorry No orders');
    return;
  }
  
  if (order.status !== 'pending') {
    console.log('[DISPENSE] Order', order.id, 'already', order.status);
    // Publish no pending orders back to the ESP32
    client.publish('rfid/dispensed', `Hi, Sorry No pending orders`);
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mark order as dispensed
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'dispensed' },
      });

      // Decrement each product's stock and publish item details
      for (let i = 0; i < order.items.length; i++) {
        const productId = parseInt(order.items[i], 10);
        const qty = order.qty[i];
        
        await tx.product.update({
          where: { id: productId },
          data: { 
            stock: { decrement: qty }
          }
        });

        // Send individual item info to ESP32 with slight delay
        client.publish('rfid/dispensed', `ITEM:${productId},QTY:${qty}`);
        
        // Add small delay between messages to allow ESP32 to process each one
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
    
    console.log('[DISPENSE] Order', order.id, 'dispensed successfully');
    // Wait a bit before sending the final success message
    setTimeout(() => {
      client.publish('rfid/dispensed', `DISPENSED:${order.id}`);
    }, 1000);
    
  } catch (e) {
    console.error('[DISPENSE] Error:', (e as Error).message);
    // Publish error message back to ESP32
    client.publish('rfid/dispensed', 'ERROR');
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