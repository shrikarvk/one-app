/*
 * Copyright 2019 American Express Travel Related Services Company, Inc.
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

import { META_DATA_KEY } from '@americanexpress/one-app-bundler';

import { setStateConfig, getClientStateConfig, getServerStateConfig } from './stateConfig';
import { setCorsOrigins } from '../middleware/conditionallyAllowCors';
import readJsonFile from './readJsonFile';
import { extendRestrictedAttributesAllowList, validateSafeRequestRestrictedAttributes } from './safeRequest';
import { setConfigureRequestLog } from './logging/serverMiddleware';
import { setCreateSsrFetch } from './createSsrFetch';
import { setEventLoopDelayThreshold } from './createCircuitBreaker';
import { configurePWA } from '../middleware/pwa';
import { updateCSP } from '../middleware/csp';
import { validateRootModuleAppConfig, validateChildModuleAppConfig } from './validation';

// Trim build hash
const { buildVersion } = readJsonFile('../../../.build-meta.json');
const appVersion = buildVersion.slice(0, -9);
let modulesUsingExternals = new Set();

const registerModuleUsingExternals = (moduleName) => {
  modulesUsingExternals = modulesUsingExternals.add(moduleName);
};

const clearModulesUsingExternals = () => {
  modulesUsingExternals = modulesUsingExternals.clear();
};

export const getModulesUsingExternals = () => [...modulesUsingExternals || []];

export const setModulesUsingExternals = (moduleNames) => {
  modulesUsingExternals = new Set(moduleNames);
};

const logModuleLoad = (moduleName, moduleVersion) => {
  console.info(`Loaded module ${moduleName}@${moduleVersion}`);
};

function validateConfig(configValidators, config) {
  Object.entries(configValidators)
    .forEach(([configKey, {
      client: { validate: validateClient = () => 0 } = {},
      server: { validate: validateServer = () => 0 } = {},
    }]) => {
      validateClient(config.client[configKey]);
      validateServer(config.server[configKey]);
    });
}

export const CONFIGURATION_KEY = 'appConfig';

export default function onModuleLoad({
  module,
  moduleName,
}) {
  const {
    [CONFIGURATION_KEY]: moduleConfig = {},
    [META_DATA_KEY]: metaData = {},
  } = module;

  const serverStateConfig = getServerStateConfig();
  const clientStateConfig = getClientStateConfig();
  const validationContext = {
    moduleName,
    moduleVersion: metaData.version,
    appVersion,
    serverStateConfig,
    clientStateConfig,
  };

  if (moduleName === serverStateConfig.rootModuleName) {
    const {
      provideStateConfig,
      csp,
      corsOrigins,
      configureRequestLog,
      extendSafeRequestRestrictedAttributes,
      createSsrFetch,
      eventLoopDelayThreshold,
      pwa,
    } = validateRootModuleAppConfig(moduleConfig, validationContext);

    clearModulesUsingExternals();
    if (provideStateConfig) {
      setStateConfig(provideStateConfig);
    }
    updateCSP(csp);
    setCorsOrigins(corsOrigins);
    extendRestrictedAttributesAllowList(extendSafeRequestRestrictedAttributes);
    setConfigureRequestLog(configureRequestLog);
    setCreateSsrFetch(createSsrFetch);
    setEventLoopDelayThreshold(eventLoopDelayThreshold);
    configurePWA(pwa);
  } else {
    const RootModule = global.getTenantRootModule();
    const { providedExternals } = RootModule[CONFIGURATION_KEY];
    validationContext.providedExternals = { ...providedExternals };

    const {
      requiredExternals,
      validateStateConfig,
      requiredSafeRequestRestrictedAttributes,
    } = validateChildModuleAppConfig(moduleConfig, validationContext);

    if (validateStateConfig) {
      validateConfig(validateStateConfig, {
        server: serverStateConfig,
        client: clientStateConfig,
      });
    }

    if (requiredExternals) registerModuleUsingExternals(moduleName);

    validateSafeRequestRestrictedAttributes(requiredSafeRequestRestrictedAttributes);
  }

  logModuleLoad(moduleName, metaData.version);
}
