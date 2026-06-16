module.exports = {
  apps: [
    {
      name: 'social-api',
      script: 'pnpm',
      args: '--filter @social/api start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'social-web',
      script: 'pnpm',
      args: '--filter @social/web start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
