import dotenv from 'dotenv';
dotenv.config();

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error('[globalSetup] BASE_URL is not defined in .env. Abort.');
}

export default async () => {
  const waitOnModule = await import('wait-on');
  const waitOn = waitOnModule.default ?? waitOnModule;

  const healthCheckUrl = `${baseUrl}`;

  console.log(`[globalSetup] Waiting for: ${healthCheckUrl}`);

  await waitOn({
    resources: [healthCheckUrl],
    timeout: 30_000,
    interval: 500,
    validateStatus: (status: number) => status === 200,
  });

  console.log('[globalSetup] Server is ready.');
};
