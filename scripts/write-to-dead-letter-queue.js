const fs = require('fs');
const amqp = require('amqplib');
const path = require('path');
require('dotenv').config();

async function writeToDLQ() {
  try {
    const connection = await amqp.connect('amqp://127.0.0.1:5672', {
      credentials: require('amqplib').credentials.plain(process.env.LOCALUSERNAME, process.env.LOCALPASSWORD)
    });
    const channel = await connection.createConfirmChannel();

    const deadLetterQueueName = 'dead-letter-queue';
    await channel.assertQueue(deadLetterQueueName, { durable: true });

    const filePath = path.join(__dirname, '..', 'DLQMessages.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const objects = JSON.parse(fileContent);

    for (const obj of objects) {
      const message = JSON.stringify(obj);
      channel.sendToQueue(deadLetterQueueName, Buffer.from(message));
      console.log('Published message to the Dead Letter Queue:', message);
    }

    await channel.waitForConfirms();

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

writeToDLQ();
