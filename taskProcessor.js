const fs = require('fs');
const path = require('path');

async function task(user_id) {
  const logMessage = `${user_id} - task completed at - ${new Date().toISOString()}\n`;
  console.log(logMessage);

  // Append log to the log file
  const logFilePath = path.join(__dirname, 'logs', 'task_logs.txt');
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

module.exports = task;
