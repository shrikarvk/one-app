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

import { validateRootModuleAppConfig, validateChildModuleAppConfig, validateWebAppManifest } from '../../../src/server/utils/validateAppConfig';

describe('root module app config validation', () => {
  test('valid app config', () => {
    const appConfig = {
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
      eventLoopDelayThreshold: Infinity,
      pwa: {
        serviceWorker: true,
        escapeHatch: false,
        recoveryMode: false,
        scope: '/',
        webManifest: { name: 'One App Test' },
      },
    };

    expect(() => validateRootModuleAppConfig(appConfig)).not.toThrow();
    expect(validateRootModuleAppConfig(appConfig)).toEqual(appConfig);
  });

  test('invalid app config', () => {
    const appConfig = {
      provideStateConfig: {
        missingKey: {
          client: 'is missing the server key',
        },
      },
      eventLoopDelayThreshold: 'Infinity',
      pwa: {
        serviceWorker: 'true',
        escapeHatch: 0,
        recoveryMode: [],
        scope: '\\',
        webManifest: { short_name: 'One App Test' },
      },
    };

    expect(() => validateRootModuleAppConfig(appConfig)).toThrow(new Error([
      '"provideStateConfig.missingKey.server" is required',
      '"csp" is required',
      '"pwa.recoveryMode" must be a boolean. "pwa.escapeHatch" must be a boolean',
      '"pwa.scope" with value "\\" fails to match the required pattern: /^\\//',
      '"pwa.webManifest.name" is required',
      '"eventLoopDelayThreshold" must be a number',
    ].join('. ')));
  });
});

describe('child module app config validation', () => {
  test('valid app config', () => {
    const appConfig = {
      requiredSafeRequestRestrictedAttributes: {
        headers: ['accept'],
        cookies: ['macadamia'],
      },
    };

    expect(() => validateChildModuleAppConfig(appConfig)).not.toThrow();
    expect(validateChildModuleAppConfig(appConfig)).toEqual(appConfig);
  });

  test('invalid app config', () => {
    const appConfig = {
      requiredSafeRequestRestrictedAttributes: {
        headers: {},
        cookies: 9,
      },
    };

    expect(() => validateChildModuleAppConfig(appConfig)).toThrow(new Error([
      '"requiredSafeRequestRestrictedAttributes.headers" must be an array',
      '"requiredSafeRequestRestrictedAttributes.cookies" must be an array',
    ].join('. ')));
  });
});

describe('web app manifest validation', () => {
  test('valid web manifest', () => {
    const webManifest = {
      lang: 'en-US',
      dir: 'auto',
      display: 'standalone',
      orientation: 'portrait',
      short_name: 'Test',
      name: 'One App Test',
      categories: ['testing', 'example'],
      icons: [{
        src: 'https://example.com/pwa-icon.png',
        type: 'img/png',
        sizes: '72x72',
        purpose: 'badge',
      }],
      screenshots: [{
        src: 'https://example.com/pwa-screenshot.png',
        type: 'img/png',
        sizes: '1024x768',
      }],
      related_applications: [{
        platform: 'new pwa store',
        url: 'https://platform.example.com/pwa',
        id: 'aiojfoahfaf',
      }],
    };

    expect(() => validateWebAppManifest(webManifest)).not.toThrow();
    expect(validateWebAppManifest(webManifest)).toEqual(webManifest);
  });

  test('invalid web manifest', () => {
    const webManifest = {
      my_name: 'One App Test',
      display: 'big',
      orientation: 'up',
      dir: 'backwards',
      direction: 'backwards',
      icons: [{
        size: '72x72',
      }, {
        purpose: 'none',
      }],
      screenshots: [{
        href: 'https://screenshots.example.com/screenshot/latest',
      }],
      related_applications: [{
        store: 'new pwa store',
      }],
    };

    expect(() => validateWebAppManifest(webManifest)).toThrow(new Error([
      '"name" is required',
      '"related_applications[0].store" is not allowed',
      '"orientation" must be one of [any, natural, landscape, landscape-primary, landscape-secondary, portrait, portrait-primary, portrait-secondary]',
      '"display" must be one of [fullscreen, standalone, minimal-ui, browser]',
      '"dir" must be one of [auto, ltr, rtl]',
      '"icons[0].size" is not allowed',
      '"icons[1].purpose" must be one of [any, maskable, badge]',
      '"screenshots[0].href" is not allowed',
      '"my_name" is not allowed',
      '"direction" is not allowed',
    ].join('. ')));
  });
});
