/*
 * Copyright 2015-2016 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class SessionService {
  constructor(HstService) {
    'ngInject';

    this.HstService = HstService;

    this._canWrite = false;
    this._initCallbacks = {};
  }

  initialize(channel) {
    return this.HstService
      .initializeSession(channel.hostname, channel.mountId)
      .then((canWrite) => {
        this._canWrite = canWrite;
        this._serveInitCallbacks();
        return channel;
      });
  }

  hasWriteAccess() {
    return this._canWrite;
  }

  registerInitCallback(id, callback) {
    this._initCallbacks[id] = callback;
  }

  unregisterInitCallback(id) {
    delete this._initCallbacks[id];
  }

  _serveInitCallbacks() {
    Object.keys(this._initCallbacks).forEach((id) => this._initCallbacks[id]());
  }
}
