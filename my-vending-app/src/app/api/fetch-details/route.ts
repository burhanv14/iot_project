import { NextResponse } from 'next/server'
import mqtt from 'mqtt'

export const runtime = 'nodejs'

// === Configuration ===
const MQTT_WS_URL = 'ws://172.22.28.218:9001'
const MQTT_TOPIC  = 'rfid_details'

export async function GET(request: Request) {
  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Connect to Mosquitto over WebSockets
  const client = mqtt.connect(MQTT_WS_URL)

  client.on('connect', () => {
    console.log(`[MQTT] Connected to ${MQTT_WS_URL}, subscribing to ${MQTT_TOPIC}`)
    client.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
      if (err) {
        console.error('[MQTT] Subscription error:', err)
        writer.write(`data: ERROR: MQTT subscription failed: ${err.message}\n\n`)
      }
    })
  })

  client.on('message', (topic, payload) => {
    if (topic === MQTT_TOPIC) {
      const uid = payload.toString()
      // Send as SSE event
      writer.write(`data: ${uid}\n\n`)
    }
  })

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err)
    writer.write(`data: ERROR: MQTT connection error: ${err.message}\n\n`)
  })

  // Clean up when client disconnects or closes the page
  request.signal.addEventListener('abort', () => {
    console.log('[SSE] Client aborted, closing MQTT connection and stream')
    client.end()
    writer.close()
  })

  return new NextResponse(stream.readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
