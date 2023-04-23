import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantCareComponent } from './plant-care.component';

describe('PlantCareComponent', () => {
  let component: PlantCareComponent;
  let fixture: ComponentFixture<PlantCareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlantCareComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlantCareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
