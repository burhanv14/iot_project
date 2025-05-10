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
  
  let uid = message.toUpperCase();
  console.log('[MQTT] Scanned UID:', uid);
  
  // Format the UID to match the database format (with colons)
  // Convert "3CA0D500" to "3C:A0:D5:00"
  if (uid.length === 8) {
    uid = `${uid.slice(0, 2)}:${uid.slice(2, 4)}:${uid.slice(4, 6)}:${uid.slice(6, 8)}`;
  } else if (uid.length === 14) {
    // If it's a longer UID like "DF36931C12345", format as "DF:36:93:1C:12:34:5"
    uid = uid.match(/.{1,2}/g)?.join(':') || uid;
  }
  console.log('[MQTT] Formatted UID for database lookup:', uid);

  try {
    // First, find the user with this RFID tag
    const user = await prisma.user.findUnique({
      where: {
        rfidTag: uid
      }
    });

    if (!user) {
      console.log('[DISPENSE] No user found for RFID:', uid);
      client.publish('rfid/dispensed', 'Hi, Sorry No user found');
      return;
    }

    // Then find the latest pending order for this user
    const order = await prisma.order.findFirst({
      where: { 
        userId: user.id,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      console.log('[DISPENSE] No pending order found for user:', user.id);
      client.publish('rfid/dispensed', 'Hi, Sorry No pending orders');
      return;
    }
    
    // Log the order structure to understand the data format
    console.log('[DISPENSE] Found order:', JSON.stringify(order, null, 2));
    
    // Validate items and qty arrays
    if (!Array.isArray(order.items) || !Array.isArray(order.qty)) {
      console.error('[DISPENSE] Order has invalid items or qty format:', { 
        itemsType: typeof order.items, 
        qtyType: typeof order.qty 
      });
      
      // Try to parse JSON strings if needed
      if (typeof order.items === 'string') {
        try {
          order.items = JSON.parse(order.items);
          console.log('[DISPENSE] Successfully parsed items from JSON string');
        } catch (e) {
          console.error('[DISPENSE] Failed to parse items JSON:', e);
          client.publish('rfid/dispensed', 'Error: Invalid order format');
          return;
        }
      }
      
      if (typeof order.qty === 'string') {
        try {
          order.qty = JSON.parse(order.qty);
          console.log('[DISPENSE] Successfully parsed qty from JSON string');
        } catch (e) {
          console.error('[DISPENSE] Failed to parse qty JSON:', e);
          client.publish('rfid/dispensed', 'Error: Invalid order format');
          return;
        }
      }
      
      // If still not arrays after parsing attempts, return error
      if (!Array.isArray(order.items) || !Array.isArray(order.qty)) {
        console.error('[DISPENSE] Order items/qty could not be converted to arrays');
        client.publish('rfid/dispensed', 'Error: Invalid order format');
        return;
      }
    }
    
    await prisma.$transaction(async (tx) => {
      // Mark order as dispensed
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'dispensed' },
      });

      console.log('[DISPENSE] Order items:', order.items);
      console.log('[DISPENSE] Order quantities:', order.qty);

      // Decrement each product's stock and publish item details
      for (let i = 0; i < order.items.length; i++) {
        try {
          let productInfo = order.items[i];
          const qty = order.qty[i];
          
          // Handle both numeric IDs and string product names
          if (typeof productInfo === 'number') {
            console.log(`[DISPENSE] Processing product ID: ${productInfo}, Quantity: ${qty}`);
            // For numeric IDs, send just the ID
            client.publish('rfid/dispensed', `ITEM:${productInfo},QTY:${qty}`);
          } else if (typeof productInfo === 'string') {
            // For string product names, send the name (truncated if needed)
            const productName = productInfo.substring(0, 10); // Truncate to fit LCD if needed
            console.log(`[DISPENSE] Processing product name: ${productName}, Quantity: ${qty}`);
            client.publish('rfid/dispensed', `NAME:${productName},QTY:${qty}`);
          } else {
            console.error(`[DISPENSE] Unexpected product info type at index ${i}:`, typeof productInfo);
            continue; // Skip this item
          }
          
          // Add small delay between messages to allow ESP32 to process each one
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[DISPENSE] Error processing item at index ${i}:`, error);
        }
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