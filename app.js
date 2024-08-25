const express = require('express');
const rateLimit = require('express-rate-limit');
const Queue = require('bull');
const taskProcessor = require('./taskProcessor');

const app = express();
app.use(express.json());

// Create a rate limiter: 1 request per second and 20 requests per minute per user ID
const taskLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 1, // limit each user ID to 1 request per second
  keyGenerator: (req) => req.body.user_id, // rate limit based on user_id
  handler: (req, res, next) => {
    res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
  },
});

const minuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // limit each user ID to 20 requests per minute
  keyGenerator: (req) => req.body.user_id, // rate limit based on user_id
  handler: (req, res, next) => {
    res.status(429).json({ error: 'Too many requests in a minute. Please wait and try again.' });
  },
});

// Create a Bull queue for task management
const taskQueue = new Queue('taskQueue');

// Process tasks from the queue
taskQueue.process(async (job) => {
  const { user_id } = job.data;
  await taskProcessor(user_id);
});

// Task processing route with rate limiting
app.post('/api/v1/task', taskLimiter, minuteLimiter, (req, res) => {
  const { user_id } = req.body;

  taskQueue.add({ user_id }, {
    delay: 1000, // 1 task per second
    attempts: 5, // Retry on failure
    removeOnComplete: true, // Remove task from queue when done
  });

  res.status(200).json({ message: 'Task added to the queue' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
