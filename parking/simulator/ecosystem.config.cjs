// pm2 process definition for the Parking Partner Simulator.
// Start:   pm2 start ecosystem.config.cjs
// Persist: pm2 save   (then `pm2 startup` once, to run on boot)
module.exports = {
  apps: [
    {
      name: 'parking-simulator',
      script: 'server.js',
      cwd: '/home/ubuntu/partner-integrations/parking/simulator',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4100,
      },
    },
  ],
};
