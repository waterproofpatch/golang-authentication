import { Component, Input } from '@angular/core';
import { Item, ItemsService } from 'src/app/services/items.service';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent {
  constructor(private itemService: ItemsService) {

  }
  @Input() item?: Item
  editMode: boolean = false

  editItem() {
    this.editMode = true;
    return;
  }

  leaveEditMode() {
    this.editMode = false;
  }
  save() {
    if (this.item) {
      console.log("Sending item name " + this.item.name)
      this.itemService.updateItem(this.item)
    }
    this.leaveEditMode();
  }

  cancel() {
    this.leaveEditMode();
  }

  deleteItem() {
    if (this.item == null) {
      console.log("Unexpected item is NULL");
      return;
    }
    this.itemService.deleteItem(this.item.id);

  }
}
