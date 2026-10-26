import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalSingleScanComponent } from './digital-single-scan.component';

describe('DigitalSingleScanComponent', () => {
  let component: DigitalSingleScanComponent;
  let fixture: ComponentFixture<DigitalSingleScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalSingleScanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DigitalSingleScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
