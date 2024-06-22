const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
  try {
    const connection = await amqp.connect('amqp://127.0.0.1:5672', { credentials: require('amqplib').credentials.plain(process.env.LOCALUSERNAME, process.env.LOCALPASSWORD) });
    const channel = await connection.createConfirmChannel();
    const queueName = process.env.QUEUE_NAME || 'dead-letter-queue'; 
    await channel.assertQueue(queueName, { durable: true });
    const messages = []; // Array to store the messages

    const timeout = 5000; // Time to wait for new messages

    await new Promise((resolve, reject) => {

      let lastMessageTimestamp = Date.now();

      const checkTimeout = setInterval(() => {
        if (Date.now() - lastMessageTimestamp > timeout) {
          clearInterval(checkTimeout);
          resolve();
        }
      }, timeout);

      channel.consume(queueName, (msg) => {
        if (msg) {

          lastMessageTimestamp = Date.now(); // is updated each time a new message is received.
          const message = msg.content.toString();
          console.log('Received message:', message);
          messages.push(JSON.parse(message));
          // Assuming a condition or a specific message to resolve the promise
          if (message === 'end') {
            resolve();
          }
        } else {
          // No more messages to consume
          console.log('No more messages in the queue.');
          clearInterval(checkTimeout);
          resolve();
        }
      });
    });

    if (messages.length === 0) {
      console.log('No messages in the queue to read.');
    } else {
      const count = messages.length;
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${date}-${queueName}-${count}.json`;
      const filePath = path.join(__dirname, '..', 'messages', fileName);
      const jsonData = JSON.stringify(messages, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf8');
      console.log('Messages written to JSON file:', filePath);

      // Ensure the destination directory exists
      const destinationDir = path.join(__dirname, '..',  'client', 'public', 'messages');
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      // Copy the file to the client/public/messages folder
      const destinationPath = path.join(destinationDir, fileName);
      fs.copyFileSync(filePath, destinationPath);
      console.log('File copied to:', destinationPath);
    }

    console.log('Closing connection...');
    channel.close();
    connection.close();
} catch (error) {
  console.error('Failed to connect or process messages:', error);
}
})();
