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
import semver from 'semver';

import { semverExtension } from './semver';

export const providedExternalSchema = Joi.object().pattern(
  Joi.string(),
  Joi.object().keys({
    version: semverExtension.semver().valid(),
    module: Joi.alternatives().try(
      Joi.object(),
      Joi.function()
    ),
  })
);

export const requiredExternalSchema = Joi.object().pattern(
  Joi.string(),
  semverExtension.semver().valid().concat(
    Joi.any().custom((value, helpers) => {
      const { providedExternals } = helpers.prefs.context;
      const external = helpers.state.path[helpers.state.path.length - 1];
      if (external in providedExternals === false) {
        return helpers.error('any.missing', { external });
      }
      if (!semver.satisfies(providedExternals[external].version, value)) {
        return helpers.error('any.incompatible', { external, providedExternalVersion: providedExternals[external].version });
      }
      return value;
    }).messages({
      'any.missing': "External '{{#external}}' is required by {{$moduleName}}, but is not provided by the root module",
      'any.incompatible': '{{#external}}@{{#value}} is required by {{$moduleName}}, but the root module provides {{#providedExternalVersion}}',
    })
  )
);
