import { IFieldValue } from './field-value.interface';

export class IDocument {
  id: string;
  displayName?: string;
  fields?: any;
  info?: {
    type: { id: string },
    dirty: boolean
  };
}
