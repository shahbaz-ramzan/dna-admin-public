import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesCareerInsightComponent } from './sales-career-insight.component';

describe('SalesCareerInsightComponent', () => {
  let component: SalesCareerInsightComponent;
  let fixture: ComponentFixture<SalesCareerInsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesCareerInsightComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesCareerInsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
