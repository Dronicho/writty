export default (): any => ({
  env: process.env.APP_ENV,
  port: process.env.APP_PORT,
  xrpl: {
    network: process.env.XRPL_NETWORK,
  },
  xumm: {
    apiKey: process.env.XUMM_API_KEY,
    secret: process.env.XUMM_API_SECRET,
  },

  defaultAdminUserPassword: process.env.DEFAULT_ADMIN_USER_PASSWORD,
});
