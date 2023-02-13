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

  deleteItem() {
    if (this.item == null) {
      console.log("Unexpected item is NULL");
      return;
    }
    this.itemService.deleteItem(this.item.id);

  }
}
