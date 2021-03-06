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
  constructor(
    $translate,
    ProjectService,
    CmsService,
    $mdSelect,
  ) {
    'ngInject';

    this.$translate = $translate;
    this.ProjectService = ProjectService;
    this.CmsService = CmsService;
    this.$mdSelect = $mdSelect;
  }

  $onInit() {
    this.core = {
      name: this.$translate.instant('CORE'),
    };
  }

  getProjects() {
    return this.ProjectService.projects;
  }

  get selectedProject() {
    return this.ProjectService.selectedProject || this.core;
  }

  set selectedProject(selectedProject) {
    this.$mdSelect.hide().then(() => {
      this.ProjectService.updateSelectedProject(selectedProject.id);
      this.CmsService.reportUsageStatistic('CMSChannelsProjectSwitch');
    });
  }
}

export default ProjectToggleController;
