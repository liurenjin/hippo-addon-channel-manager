/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
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

export class ChannelActionsCtrl {
  constructor($translate, ChannelService, ConfigService, DialogService) {
    'ngInject';
    this.$translate = $translate;
    this.ChannelService = ChannelService;
    this.ConfigService = ConfigService;
    this.DialogService = DialogService;
  }

  isChannelSettingsAvailable() {
    return this.ChannelService.getChannel().hasCustomProperties;
  }

  isChannelDeletionAvailable() {
    return this.ChannelService.isChannelDeletionSupported() && this.ConfigService.hasAdminPrivileges;
  }

  hasMenuOptions() {
    return this.isChannelSettingsAvailable() || this.isChannelDeletionAvailable();
  }

  openSettings() {
    this.onActionSelected({ subpage: 'channel-settings' });
  }

  deleteChannel() {
    this._confirmDelete()
      .then(() => {
        // TODO: actually ask the back-end to delete the channel!
        // something like: this.ChannelService.delete();
      });
    // do nothing on cancel
  }

  _confirmDelete() {
    const confirm = this.DialogService.confirm()
      .title(this.$translate.instant('CONFIRM_DELETE_CHANNEL_TITLE', { channel: this.ChannelService.getName() }))
      .textContent(this.$translate.instant('CONFIRM_DELETE_CHANNEL_MESSAGE'))
      .ok(this.$translate.instant('DELETE'))
      .cancel(this.$translate.instant('CANCEL'));

    return this.DialogService.show(confirm);
  }
}
