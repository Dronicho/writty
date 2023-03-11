import * as Joi from '@hapi/joi';
import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';

import configuration from './configuration';

export const configModuleOptions: ConfigModuleOptions = {
  envFilePath: '.env',
  load: [configuration],
  validationSchema: Joi.object({
    APP_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    APP_PORT: Joi.number().default(3000),
    XRPL_NETWORK: Joi.string().required(),
    XUMM_API_KEY: Joi.string().required(),
    XUMM_API_SECRET: Joi.string().required(),

    DEFAULT_ADMIN_USER_PASSWORD: Joi.string().optional(),
  }),
};
