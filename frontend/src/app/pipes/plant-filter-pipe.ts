import { Pipe, PipeTransform } from '@angular/core';
import { Plant } from '../models/plant.model';

@Pipe({
	name: 'plantFilter',
	pure: true
})
export class PlantFilterPipe implements PipeTransform {

	transform(plants: Plant[] | null,
		filters: Map<string, any>,
		plantNameFilter: string,
		filterTags: string[]): Plant[] {
		if (plants == null) {
			return []
		}
		return plants.filter(plant => this.matchesFilter(plant,
			filters,
			plantNameFilter,
			filterTags));
	}

	private matchesFilter(plant: Plant,
		filters: Map<string, any>,
		plantNameFilter: string,
		filterTags: string[]): boolean {
		if (filters.get("needsCare") && !plant.needsCare()) {
			return false;
		}

		if (!plant.name.toLowerCase().includes(plantNameFilter.toLowerCase())) {
			return false;
		}
		if (this.tagMatchesFilter(plant.tag, filterTags)) {
			return true;
		}
		return false;
	}

	private tagMatchesFilter(tag: string, filterTags: string[]) {
		return filterTags.length === 0 || filterTags.includes(tag);
	}

}
