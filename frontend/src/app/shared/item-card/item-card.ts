import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './item-card.html',
  styleUrl: './item-card.css',
})
export class ItemCardComponent {
  @Input({ required: true }) item!: Item;

  get truncatedDescription(): string {
    if (this.item.description.length <= 100) {
      return this.item.description;
    }
    return this.item.description.slice(0, 100) + '…';
  }
}
