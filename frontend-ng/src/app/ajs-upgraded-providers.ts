import CmsService from './services/cms.service.js';

export function CmsServiceFactory(i: any) {
  return i.get('CmsService');
}

export const CmsServiceProvider = {
  provide: CmsService,
  useFactory: CmsServiceFactory,
  deps: ['$injector']
};
