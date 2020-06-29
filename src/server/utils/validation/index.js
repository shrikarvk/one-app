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

import { provideStateConfigSchema, validateStateConfigSchema } from './stateConfig';
import { providedExternalSchema, requiredExternalSchema } from './externals';
import { safeRequestSchema } from './safeRequest';
import { semverExtension } from './semver';
import { pwaSchema } from './pwa';

export const rootModuleSchema = Joi.object().keys({
  providedExternals: providedExternalSchema,
  provideStateConfig: provideStateConfigSchema,
  csp: Joi.string().required().messages({
    'any.required': '"csp" must provide a valid content security policy in the Root module',
  }),
  corsOrigins: Joi.array().items(
    Joi.alternatives().try(
      Joi.object().instance(RegExp),
      Joi.string().hostname(),
      Joi.string().pattern(/(?:https?)?[a-z.-]/)
    )
  ),
  configureRequestLog: Joi.function(),
  extendSafeRequestRestrictedAttributes: safeRequestSchema,
  pwa: pwaSchema,
  createSsrFetch: Joi.function(),
  eventLoopDelayThreshold: Joi.number().allow(Infinity),
  appCompatibility: semverExtension.semver().valid(),
});

export const childModuleSchema = Joi.object().keys({
  providedExternals: Joi.any().custom((value, helpers) => helpers.warn('any.exists')).messages({
    'any.exists': 'Module {{$moduleName}} attempted to provide externals. Only the root module can provide externals.',
  }),
  requiredExternals: requiredExternalSchema,
  validateStateConfig: validateStateConfigSchema,
  requiredSafeRequestRestrictedAttributes: safeRequestSchema,
  appCompatibility: semverExtension.semver().valid(),
});


function validateSchema(schema, validationTarget, options) {
  const { error, value, warning } = schema.validate(
    validationTarget,
    { ...options, abortEarly: false }
  );
  if (error) throw error;
  if (warning) {
    console.warn(warning);
  }
  return value;
}

export function validateRootModuleAppConfig(appConfig, context) {
  return validateSchema(rootModuleSchema, appConfig, { context });
}

export function validateChildModuleAppConfig(appConfig, context) {
  return validateSchema(childModuleSchema, appConfig, { context });
}
