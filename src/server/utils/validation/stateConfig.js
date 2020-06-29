/*
 * Copyright 2020 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import Joi from '@hapi/joi';

const provideStateConfigSchemaFragment = Joi.alternatives().try(
  Joi.number(),
  Joi.boolean(),
  Joi.string(),
  Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.number(),
      Joi.boolean(),
      Joi.string()
    ).allow(null, '')
  )
).allow(null, '').required();

export const provideStateConfigSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().keys({
    server: provideStateConfigSchemaFragment.required(),
    client: provideStateConfigSchemaFragment.required(),
  })
);

export const validateStateConfigSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().keys({
    server: Joi.object().keys({
      validate: Joi.function(),
    }),
    client: Joi.object().keys({
      validate: Joi.function(),
    }),
  })
);
