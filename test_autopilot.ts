// Test autopilot directly
import { startAutopilot, getAutopilotStatus } from './server/_core/autopilotEngine';

console.log('Testing autopilot...');

const state = startAutopilot();
console.log('Autopilot started:', state);

// Wait 30 seconds and check status
setTimeout(() => {
  const status = getAutopilotStatus();
  console.log('Status after 30s:', status);
  process.exit(0);
}, 30000);
