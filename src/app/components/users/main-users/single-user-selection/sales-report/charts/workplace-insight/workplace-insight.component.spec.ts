import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkplaceInsightComponent } from './workplace-insight.component';

describe('WorkplaceInsightComponent', () => {
  let component: WorkplaceInsightComponent;
  let fixture: ComponentFixture<WorkplaceInsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkplaceInsightComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WorkplaceInsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
