import { Component } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/services/items.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    type: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private itemsService: ItemsService,
    private formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group({
      name: ['Some Name'],
      type: [123]
    });
  }

  ngOnInit(): void {
    this.itemsService.getItems()
  }

  addItem() {
    // Perform actions when the form is submitted
    console.log(this.form.value);
    var item = ItemsService.ItemFactory.makeItem(this.form.controls.name.value || '', this.form.controls.type.value || 0)
    this.itemsService.addItem(item)
  }
  getItems(): Subject<Item[]> {
    return this.itemsService.items
  }
}
