import { Component } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';
import { ItemsService } from 'src/app/services/items.service';
import Plant from 'src/app/services/items.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  selectedImage: File | null = null;
  form = new FormGroup({
    nameOfPlant: new FormControl('', Validators.required),
    wateringFrequency: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private itemsService: ItemsService,
    private formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group({
      nameOfPlant: ['Plant Name'],
      wateringFrequency: [5]
    });
  }

  ngOnInit(): void {
    this.itemsService.getItems()
  }
  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  addItem() {
    // Perform actions when the form is submitted
    console.log(this.form.value);
    var item = ItemsService.ItemFactory.makeItem(this.form.controls.nameOfPlant.value || '', this.form.controls.wateringFrequency.value || 0)
    this.itemsService.addItem(item, this.selectedImage)
  }
  getItems(): Subject<Plant[]> {
    return this.itemsService.items
  }
}
