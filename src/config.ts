import {requireEnv} from "./utils.js";

const config = {
  port: parseInt(requireEnv('PORT')),
  checkCron: requireEnv('CHECK_CRON'),
  registrationDbPath: requireEnv('REGISTRATION_DB_PATH'),
  vapidPublicKey: requireEnv('VAPID_PUBLIC_KEY'),
  vapidPrivateKey: requireEnv('VAPID_PRIVATE_KEY'),
  vapidSubject: requireEnv('VAPID_SUBJECT'),
  corsWhitelist: requireEnv('CORS_WHITELIST').split(';')
}

export default config;
