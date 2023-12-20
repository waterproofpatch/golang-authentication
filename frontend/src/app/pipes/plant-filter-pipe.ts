import { Pipe, PipeTransform } from '@angular/core';
import { Plant } from '../models/plant.model';

@Pipe({
	name: 'plantFilter',
	pure: true
})
export class PlantFilterPipe implements PipeTransform {

	transform(plants: Plant[] | null,
		filters: Map<string, any>,
		username: string,
		plantNameFilter: string,
		filterTags: string[],
		filterUsernames: string[]): Plant[] {
		if (plants == null) {
			return []
		}
		return plants.filter(plant => this.matchesFilter(plant,
			filters,
			username,
			plantNameFilter,
			filterTags,
			filterUsernames));
	}

	private matchesFilter(plant: Plant,
		filters: Map<string, any>,
		username: string,
		plantNameFilter: string,
		filterTags: string[],
		filterUsernames: string[]): boolean {
		if (filters.get("onlyMyPlants") && plant.username != username) {
			return false;
		}

		if (filters.get("needsCare") && !plant.needsCare()) {
			return false;
		}

		if (!plant.name.toLowerCase().includes(plantNameFilter.toLowerCase())) {
			return false;
		}
		if (this.usernameMatchesFilter(username, filterUsernames) && this.tagMatchesFilter(plant.tag, filterTags)) {
			return true;
		}
		return false;
	}
	private usernameMatchesFilter(username: string, filterUsernames: string[]) {
		return filterUsernames.length === 0 || filterUsernames.includes(username);
	}

	private tagMatchesFilter(tag: string, filterTags: string[]) {
		return filterTags.length === 0 || filterTags.includes(tag);
	}

}
