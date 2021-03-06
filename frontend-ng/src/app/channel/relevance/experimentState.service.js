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

const EXPERIMENT_ID = 'Targeting-experiment-id';
const EXPERIMENT_STATE = 'Targeting-experiment-state';

class ExperimentStateService {
  constructor($translate) {
    'ngInject';

    this.$translate = $translate;
  }

  hasExperiment(component) {
    return !!this.getExperimentId(component);
  }

  getExperimentId(component) {
    return component.metaData[EXPERIMENT_ID];
  }

  getExperimentStateLabel(component) {
    let label = null;
    if (this.hasExperiment(component)) {
      const state = component.metaData[EXPERIMENT_STATE];
      label = this.$translate.instant(`EXPERIMENT_LABEL_${state}`);
    }
    return label;
  }
}

export default ExperimentStateService;
