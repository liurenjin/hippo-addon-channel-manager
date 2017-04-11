/*
 * Copyright 2017 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

class ProjectToggleController {
  constructor($translate, OverlayService, ChannelService, ProjectService) {
    'ngInject';

    this.$translate = $translate;
    this.OverlayService = OverlayService;
    this.ChannelService = ChannelService;
    this.ProjectService = ProjectService;
    this.available = ProjectService.available;
    this._setProjects();
  }
  $onInit() {
    this._activate();
  }

  _setProjects() {
    const channelId = 'alternate-hap';
    this.projects = this.ProjectService.projects(channelId);
  }

  _activate() {
    this.selectedProject = this.ProjectService.master.id;
    this._projectChanged();
  }

  _projectChanged() {
    if (this.selectedProject.name.equals('master')) {
      return;
    }
    if (this.selectedProject.isBranch) {
      this.ProjectService.doSelectBranch(this.selectedProject);
    } else {
      this.ProjectService.doCreateBranch(this.selectedProject);
    }
  }

  getDisplayName(project) {
    let s = this.$translate.insert(`${project.name}`);
    if (project.isBranch) {
      s = `${s} +`;
    }
    return s;
  }
}

export default ProjectToggleController;
