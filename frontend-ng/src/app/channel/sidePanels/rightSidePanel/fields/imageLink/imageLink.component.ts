import { Component, Input, OnInit } from '@angular/core';
import CmsService from '../../../../../services/cms.service.js';
import './imageLink.scss';

@Component({
  selector: 'hippo-image-link',
  templateUrl: './imageLink.html'
})
export class ImageLinkComponent implements OnInit {
  @Input() value: any;
  @Input() url: string;
  @Input() displayName: string;
  @Input() fieldObject: any;
  @Input() config: any;
  @Input() formObject: any;
  @Input() isRequired: boolean;

  constructor(private cmsService: CmsService) {
  }

  ngOnInit() {
    console.log(this);
  }

  openImagePicker() {
  }
}
