/*
 * Copyright 2016-2017 Hippo B.V. (http://www.onehippo.com)
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

class ChannelService {
  constructor(
    $http,
    $log,
    $q,
    $rootScope,
    $state,
    CatalogService,
    CmsService,
    ConfigService,
    FeedbackService,
    HstService,
    PathService,
    ProjectService,
    SessionService,
    SiteMapService,
  ) {
    'ngInject';

    this.$http = $http;
    this.$log = $log;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.CatalogService = CatalogService;
    this.CmsService = CmsService;
    this.ConfigService = ConfigService;
    this.FeedbackService = FeedbackService;
    this.HstService = HstService;
    this.PathService = PathService;
    this.ProjectService = ProjectService;
    this.SessionService = SessionService;
    this.SiteMapService = SiteMapService;
  }

  initialize() {
    this.isToolbarDisplayed = true;
    this.channel = {};
    this.channels = [];

    this.CmsService.subscribe('channel-changed-in-extjs', () => {
      this.$rootScope.$apply(() => this.reload());
    });

    this.CmsService.subscribe('load-channel', (channel, initialPath, projectId) => {
      this._initializeChannel(channel, initialPath, projectId);
    });

    // Handle reloading of iframe by BrowserSync during development
    this.CmsService.publish('reload-channel');
  }

  _initializeChannel(channel, initialPath, passedProjectId) {
    let channelId = channel.id;
    let setupPromise;

    if (this.ConfigService.projectsEnabled) {
      setupPromise = this.$q
        .when(passedProjectId || this.ProjectService.getCurrentProject(channel.mountId))
        .then((selectedProjectId) => {
          if (selectedProjectId && selectedProjectId !== 'master') {
            channelId = channelId.replace(/-preview$/, `-${selectedProjectId}-preview`);
          }
          return selectedProjectId;
        })
        .then(selectedProjectId => this.ProjectService.load(channel.mountId, selectedProjectId))
        .then(() => {
          this.ProjectService.registerUpdateListener(() => {
            const baseChannelId = this.ProjectService.getBaseChannelId(channelId);
            this.CmsService.publish('load-channel', baseChannelId);
          });
        });
    } else {
      setupPromise = this.$q.resolve();
    }

    return setupPromise
      .then(() => this.ConfigService.setContextPathForChannel(channel.contextPath))
      .then(() => this.loadChannel(channelId))
      .then(() => {
        const initialRenderPath = this.PathService.concatPaths(this.getHomePageRenderPathInfo(), initialPath);
        this.$state.go('hippo-cm.channel',
          { channelId: this.channel.id, initialRenderPath },
          { reload: true },
        );
      });
  }

  loadChannel(channelId) {
    return this.HstService
      .getChannel(channelId)
      .then(channel =>
        this.SessionService
          .initialize(channel.hostname, channel.mountId)
          .then(() => this._ensurePreviewHstConfigExists(channel))
          .then(previewChannel => this._setChannel(previewChannel)),
      )
      .catch((error) => {
        this.$log.error(`Failed to load channel '${channelId}'.`, error);
        return this.$q.reject();
      });
  }

  _ensurePreviewHstConfigExists(channel) {
    if (this.SessionService.hasWriteAccess() && !channel.previewHstConfigExists) {
      return this.HstService
        .doPost(null, channel.mountId, 'edit')
        .then(() => this.HstService.getChannel(`${channel.id}-preview`))
        .catch((error) => {
          this.$log.error(`Failed to load channel '${channel.id}'.`, error.message);
          this.FeedbackService.showError('ERROR_ENTER_EDIT');

          // initialize the app with the non-editable channel so it becomes read-only
          return this.$q.resolve(channel);
        });
    }

    // channel is already editable or the user is not allowed to edit it
    return this.$q.resolve(channel);
  }

  _setChannel(channel) {
    this.channel = channel;

    // precompute channel prefix to be more efficient
    this.channelPrefix = this._makeContextPrefix(channel.contextPath);

    this.CatalogService.load(this.getMountId());
    this.SiteMapService.load(channel.siteMapId);

    if (this.SessionService.hasWriteAccess()) {
      this._augmentChannelWithPrototypeInfo();
    }
  }

  _makeContextPrefix(contextPath) {
    return this.PathService.concatPaths('/', contextPath, this.channel.cmsPreviewPrefix);
  }

  clearChannel() {
    this.channel = {};

    if (!this.isToolbarDisplayed) {
      this.setToolbarDisplayed(true);
    }
  }

  hasChannel() {
    return !!this.channel.id;
  }

  getChannel() {
    return this.channel;
  }

  reload(channelId = this.channel.id) {
    return this.loadChannel(channelId);
  }

  getPreviewPaths() {
    return this.ConfigService.contextPaths.map(path => this._makeContextPrefix(path));
  }

  makePath(renderPathInfo) {
    let path = this.channelPrefix;

    if (renderPathInfo) {
      path = this.PathService.concatPaths(path, renderPathInfo);
    }

    if (path === this.channel.contextPath) {
      // The best practice for proxy pass rules is to match on <context path>/ to delegate to the site webapp.
      // The iframe url should therefore end with '/'.
      path = this.PathService.concatPaths(path, '/');
    }

    return path;
  }

  extractRenderPathInfo(path) {
    if (!path.startsWith(this.channelPrefix)) {
      this.$log.warn(`Current path '${path}' does not match current channel's path prefix '${this.channelPrefix}'.`);
      return path;
    }

    let renderPathInfo = path.slice(this.channelPrefix.length);

    // remove trailing slash if any, HST's siteMapItem.renderPathInfo never has a trailing slash.
    if (renderPathInfo.endsWith('/')) {
      renderPathInfo = renderPathInfo.slice(0, renderPathInfo.length - 1);
    }

    return renderPathInfo;
  }

  getId() {
    return this.channel.id;
  }

  getHomePageRenderPathInfo() {
    return this.channel.mountPath ? this.channel.mountPath : '';
  }

  getName() {
    return this.channel.name;
  }

  isEditable() {
    return this.SessionService.hasWriteAccess() && this.hasChannel() && this.channel.previewHstConfigExists;
  }

  isConfigurationLocked() {
    return this.getChannel().configurationLocked;
  }

  recordOwnChange() {
    const user = this.ConfigService.cmsUser;

    if (this.channel.changedBySet.indexOf(user) === -1) {
      this.channel.changedBySet.push(user);
    }

    this.CmsService.publish('channel-changed-in-angular');
  }

  publishOwnChanges() {
    return this.HstService.doPost(null, this.getMountId(), 'publish')
      .then(() => this.reload());
  }

  publishChangesOf(users) {
    const url = 'userswithchanges/publish';
    return this.HstService.doPost({ data: users }, this.getMountId(), url)
      .then(() => this.reload());
  }

  discardOwnChanges() {
    return this.HstService.doPost(null, this.getMountId(), 'discard')
      .then(() => this.reload());
  }

  discardChangesOf(users) {
    const url = 'userswithchanges/discard';
    return this.HstService.doPost({ data: users }, this.getMountId(), url)
      .then(() => this.reload());
  }

  getSiteMapId() {
    return this.channel.siteMapId;
  }

  _augmentChannelWithPrototypeInfo() {
    this.getNewPageModel()
      .then((data) => {
        this._hasPrototypes = data.prototypes && data.prototypes.length > 0;
      });
  }

  hasPrototypes() {
    return this._hasPrototypes;
  }

  hasWorkspace() {
    return this.channel.workspaceExists;
  }

  getNewPageModel(mountId) {
    const params = mountId ? { mountId } : undefined;
    return this.HstService.doGetWithParams(this.getMountId(), params, 'newpagemodel')
      .then(response => response.data);
  }

  getChannelInfoDescription() {
    const params = { locale: this.ConfigService.locale };
    return this.HstService.doGetWithParams(this.ConfigService.rootUuid, params, 'channels', this.channel.id, 'info');
  }

  getProperties() {
    return this.channel.properties;
  }

  setProperties(properties) {
    this.channel.properties = properties;
  }

  saveChannel() {
    return this.HstService.doPut(this.channel, this.ConfigService.rootUuid, 'channels', this.channel.id);
  }

  loadPageModifiableChannels() {
    const params = {
      previewConfigRequired: true,
      workspaceRequired: true,
      skipBranches: true,
      skipConfigurationLocked: true,
    };
    this.HstService.doGetWithParams(this.ConfigService.rootUuid, params, 'channels')
      .then((response) => {
        this.pageModifiableChannels = response.data || [];
      });
  }

  getPageModifiableChannels() {
    return this.pageModifiableChannels;
  }

  getMountId() {
    return this.channel.mountId;
  }

  getContentRootPath() {
    return this.channel.contentRoot;
  }

  deleteChannel() {
    return this.HstService.doDelete(this.ConfigService.rootUuid, 'channels', this.getId());
  }

  setToolbarDisplayed(state) {
    this.isToolbarDisplayed = state;
  }
}

export default ChannelService;
