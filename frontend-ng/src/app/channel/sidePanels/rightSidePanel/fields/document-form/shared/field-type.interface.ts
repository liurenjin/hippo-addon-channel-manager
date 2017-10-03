export class IFieldType {
  id: string;
  type?: any;
  displayName?: string;
  hint?: string;
  minValues?: number;
  maxValues?: number;
  multiple?: boolean;
  required?: boolean;
  valid?: boolean;
  validators?: Array<string>
}
