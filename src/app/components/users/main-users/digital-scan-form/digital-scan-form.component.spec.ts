import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalScanFormComponent } from './digital-scan-form.component';

describe('DigitalScanFormComponent', () => {
  let component: DigitalScanFormComponent;
  let fixture: ComponentFixture<DigitalScanFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalScanFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DigitalScanFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
