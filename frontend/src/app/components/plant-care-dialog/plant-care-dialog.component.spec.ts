import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantCareDialogComponent } from './plant-care-dialog.component';

describe('PlantCareDialogComponent', () => {
  let component: PlantCareDialogComponent;
  let fixture: ComponentFixture<PlantCareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlantCareDialogComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlantCareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
