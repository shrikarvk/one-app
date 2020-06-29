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

import { validateRootModuleAppConfig, validateChildModuleAppConfig } from '../../../../src/server/utils/validation';

const baseValidationContext = {
  appVersion: '5.0.0',
  clientStateConfig: {
    cdnUrl: 'https://cdn.example.com/',
  },
  serverStateConfig: {
    cdnUrl: 'https://cdn.example.com/',
  },
  providedExternals: {
    'some-library': {
      version: '9.8.7',
      module: {},
    },
  },
};

describe('root module app config validation', () => {
  const validationContext = {
    ...baseValidationContext,
    moduleName: 'some-root',
    moduleVersion: '1.2.3',
  };

  test('valid app config', () => {
    const appConfig = {
      appCompatibility: '5.0.0',
      providedExternals: {
        'some-library': {
          version: '9.8.7',
          module: {},
        },
      },
      provideStateConfig: {
        randomApi: {
          server: 'https://api.example.com',
          client: 'https://example.com/api',
        },
        clientValue: {
          client: 'only-for-client',
          server: null,
        },
      },
      csp: "default-src 'self';",
      corsOrigins: [/example\.com/],
      eventLoopDelayThreshold: Infinity,
      pwa: {
        serviceWorker: true,
        escapeHatch: false,
        recoveryMode: false,
        scope: '/',
        webManifest: { name: 'One App Test' },
      },
    };

    expect(() => validateRootModuleAppConfig(appConfig, validationContext)).not.toThrow();
    expect(validateRootModuleAppConfig(appConfig, validationContext)).toEqual(appConfig);
  });

  test('invalid app config', () => {
    const appConfig = {
      providedExternals: {
        'some-library': {
          version: 9,
          module: null,
        },
      },
      corsOrigins: ['/'],
      provideStateConfig: {
        missingKey: {
          client: 'is missing the server key',
        },
      },
      configureRequestLog: false,
      extendSafeRequestRestrictedAttributes: {
        headers: [87],
        cookies: [/cookie/],
        notAValidKey: null,
      },
      eventLoopDelayThreshold: 'Infinity',
      createSsrFetch: null,
      pwa: {
        serviceWorker: 'true',
        escapeHatch: 0,
        recoveryMode: [],
        scope: '\\',
        webManifest: () => ({ short_name: 'One App Test' }),
      },
      appCompatibility: '1.0.0',
    };

    expect(() => validateRootModuleAppConfig(appConfig, validationContext)).toThrow(new Error([
      '"providedExternals.some-library.version" must be a string',
      '"providedExternals.some-library.module" must be one of [object]',
      '"provideStateConfig.missingKey.server" is required',
      '"csp" must provide a valid content security policy in the Root module',
      '"corsOrigins[0]" does not match any of the allowed types',
      '"configureRequestLog" must be of type function',
      '"extendSafeRequestRestrictedAttributes.headers[0]" must be a string',
      '"extendSafeRequestRestrictedAttributes.cookies[0]" must be a string',
      '"extendSafeRequestRestrictedAttributes.notAValidKey" is not allowed',
      '"pwa.recoveryMode" must be a boolean',
      '"pwa.escapeHatch" must be a boolean',
      '"pwa.scope" with value "\\" fails to match the required pattern: /^\\//',
      '"pwa.webManifest.name" is required',
      '"createSsrFetch" must be of type function',
      '"eventLoopDelayThreshold" must be a number',
      'some-root@1.2.3 is not compatible with this version of one-app (5.0.0), it requires "1.0.0"',
    ].join('. ')));
  });
});

describe('child module app config validation', () => {
  const validationContext = {
    ...baseValidationContext,
    moduleName: 'child-module',
    moduleVersion: '1.2.3',
  };

  test('valid app config', () => {
    const appConfig = {
      appCompatibility: '5.0.0',
      validateStateConfig: {
        apiUrl: {
          server: {
            validate: () => true,
          },
          client: {
            validate: () => true,
          },
        },
      },
      requiredSafeRequestRestrictedAttributes: {
        headers: ['accept'],
        cookies: ['macadamia'],
      },
      requiredExternals: {
        'some-library': '9.8.7',
      },
    };

    expect(() => validateChildModuleAppConfig(appConfig, validationContext)).not.toThrow();
    expect(validateChildModuleAppConfig(appConfig, validationContext)).toEqual(appConfig);
  });

  test('invalid app config', () => {
    const appConfig = {
      appCompatibility: '1.0.0',
      providedExternals: {},
      validateStateConfig: () => true,
      requiredSafeRequestRestrictedAttributes: {
        headers: {},
        cookies: 9,
      },
      requiredExternals: {
        'some-library': '3.2.1',
        'some-other-library': {
          version: '3.2.1',
        },
      },
    };

    expect(() => validateChildModuleAppConfig(appConfig, validationContext)).toThrow(new Error([
      'some-library@3.2.1 is required by child-module, but the root module provides 9.8.7',
      '"requiredExternals.some-other-library" must be a string',
      '"validateStateConfig" must be of type object',
      '"requiredSafeRequestRestrictedAttributes.headers" must be an array',
      '"requiredSafeRequestRestrictedAttributes.cookies" must be an array',
      'child-module@1.2.3 is not compatible with this version of one-app (5.0.0), it requires "1.0.0"',
    ].join('. ')));
  });
});
