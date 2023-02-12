import { Component } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/services/items.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(
    private itemsService: ItemsService,
  ) {
  }

  getItems(): Subject<Item[]> {
    return this.itemsService.items
  }
}
