import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachingReportComponent } from './coaching-report.component';

describe('CoachingReportComponent', () => {
  let component: CoachingReportComponent;
  let fixture: ComponentFixture<CoachingReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachingReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CoachingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
