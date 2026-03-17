import os
import aio_pika
import json

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")

async def get_rabbitmq_connection():
    return await aio_pika.connect_robust(RABBITMQ_URL)

async def publish_event(event_name: str, payload: dict):
    """
    Publish an event to the message broker.
    """
    connection = await get_rabbitmq_connection()
    async with connection:
        channel = await connection.channel()
        exchange = await channel.declare_exchange("drplant_events", aio_pika.ExchangeType.TOPIC)
        
        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            content_type="application/json"
        )
        await exchange.publish(message, routing_key=event_name)

async def consume_event(event_name: str, queue_name: str, callback):
    """
    Consume an event from the message broker.
    """
    connection = await get_rabbitmq_connection()
    channel = await connection.channel()
    exchange = await channel.declare_exchange("drplant_events", aio_pika.ExchangeType.TOPIC)
    
    queue = await channel.declare_queue(queue_name, durable=True)
    await queue.bind(exchange, routing_key=event_name)
    
    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                payload = json.loads(message.body.decode())
                await callback(payload)
