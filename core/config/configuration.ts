const DEVELOPMENT_CORS_ORIGINS = ['http://localhost:4000'];

const resolveCorsOrigins = (): string[] => {
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === 'production') return configured;
  return [...new Set([...configured, ...DEVELOPMENT_CORS_ORIGINS])];
};

export default () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),
  corsOrigins: resolveCorsOrigins(),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
});
