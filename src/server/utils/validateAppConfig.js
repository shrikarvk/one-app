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

const webManifestSchema = Joi.object().keys({
  name: Joi.string().required(),
  short_name: Joi.string(),
  lang: Joi.string(),
  scope: Joi.string().pattern(/^\//),
  start_url: Joi.string().pattern(/^\//),
  theme_color: Joi.alternatives(
    Joi.string(),
    Joi.string().hex()
  ),
  background_color: Joi.alternatives(
    Joi.string(),
    Joi.string().hex()
  ),
  categories: Joi.array().items(Joi.string()),
  iarc_rating_id: Joi.boolean(),
  prefer_related_applications: Joi.boolean(),
  related_applications: Joi.array().items(Joi.object().keys({
    platform: Joi.string(),
    url: Joi.string(),
    id: Joi.string(),
  })),
  orientation: Joi.string().valid(
    'any',
    'natural',
    'landscape',
    'landscape-primary',
    'landscape-secondary',
    'portrait',
    'portrait-primary',
    'portrait-secondary'
  ),
  display: Joi.string().valid(
    'fullscreen',
    'standalone',
    'minimal-ui',
    'browser'
  ),
  dir: Joi.string().valid(
    'auto',
    'ltr',
    'rtl'
  ),
  icons: Joi.array().items(Joi.object().keys({
    src: Joi.string().uri(),
    sizes: Joi.string(),
    type: Joi.string(),
    purpose: Joi.string().valid(
      'any',
      'maskable',
      'badge'
    ),
  })),
  screenshots: Joi.array().items(Joi.object().keys({
    src: Joi.string().uri(),
    sizes: Joi.string(),
    type: Joi.string(),
  })),
});

const pwaSchema = Joi.object().keys({
  serviceWorker: Joi.boolean(),
  recoveryMode: Joi.boolean(),
  escapeHatch: Joi.boolean(),
  scope: Joi.string().pattern(/^\//),
  webManifest: Joi.alternatives().try(webManifestSchema, Joi.function()),
});

const safeRequestSchema = Joi.object().keys({
  headers: Joi.array().items(Joi.string()),
  cookies: Joi.array().items(Joi.string()),
});

const stateConfigKeySchema = Joi.object().unknown().keys({
  server: Joi.string().required().allow(null),
  client: Joi.string().required().allow(null),
});

const provideStateConfigSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().concat(stateConfigKeySchema)
);

// TODO: add custom messages for fields
// TODO: validate app compatibility via semver

const rootModuleSchema = Joi.object().keys({
  providedExternals: Joi.array().items(Joi.string()),
  provideStateConfig: provideStateConfigSchema,
  csp: Joi.string().required(),
  corsOrigins: Joi.array().items(Joi.string().uri({
    scheme: [
      /https?/,
    ],
  })),
  configureRequestLog: Joi.function(),
  extendSafeRequestRestrictedAttributes: safeRequestSchema,
  pwa: pwaSchema,
  createSsrFetch: Joi.function(),
  eventLoopDelayThreshold: Joi.number().allow(Infinity),
  appCompatibility: Joi.string(),
});

const childModuleSchema = Joi.object().keys({
  requiredExternals: Joi.array().items(Joi.string()),
  validateStateConfig: Joi.object().pattern(
    Joi.string(),
    Joi.object().concat(stateConfigKeySchema)
  ),
  requiredSafeRequestRestrictedAttributes: safeRequestSchema,
  appCompatibility: Joi.string(),
});

function validateSchema(schema, validationTarget) {
  const { error, value } = schema.validate(validationTarget, { abortEarly: false, render: false });
  if (error) throw error;
  return value;
}

export function validateWebAppManifest(webManifest) {
  return validateSchema(webManifestSchema, webManifest);
}

// TODO: validate provided/required state config
// TODO: validate provided/required safe request restricted attributes

export function validateRootModuleAppConfig(appConfig) {
  return validateSchema(rootModuleSchema, appConfig);
}

export function validateChildModuleAppConfig(appConfig) {
  // TODO: move validateStateConfig to here
  return validateSchema(childModuleSchema, appConfig);
}
