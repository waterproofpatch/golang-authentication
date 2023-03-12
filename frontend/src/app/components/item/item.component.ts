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
  imageUrl: string | null = null

  editItem() {
    this.editMode = true;
    return;
  }

  ngOnInit() {
    console.log("onInit")
    this.getImage()
  }

  getImage() {
    if (!this.item) {
      return
    }
    console.log("Getting image for imageId=" + this.item.imageId)
    this.itemService.getItemImage(this.item.imageId)
      .subscribe(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.imageUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
      });
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
