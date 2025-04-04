import dotenv from 'dotenv';
dotenv.config();

if (!process.env.BASE_URL) {
  throw new Error('[globalSetup] BASE_URL is not defined in .env file. Aborting.');
}
const baseUrl = process.env.BASE_URL;

export default async () => {
  // @ts-expect-error 型定義は存在しないため黙認。ランタイム解決。
  const waitOnModule = await import('wait-on');
  const waitOn = waitOnModule.default ?? waitOnModule;

  const healthCheckUrl = `${baseUrl.replace(/\/$/, '')}/register`;
  console.log(`[globalSetup] Waiting for: ${healthCheckUrl}`);

  await waitOn({
    resources: [healthCheckUrl],
    timeout: 30000,
    interval: 500,
    validateStatus: (status: number) => status === 200,
  });

  console.log('[globalSetup] Server ready.');
};
