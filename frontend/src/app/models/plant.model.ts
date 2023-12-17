import { PlantLog } from "../types";
import { Comment } from "../types";

export class Plant {
	constructor(public id: number,
		public name: string,
		public username: string,
		public email: string,
		public wateringFrequency: number,
		public fertilizingFrequency: number,
		public lastWaterDate: string,
		public lastFertilizeDate: string,
		public lastMoistDate: string,
		public skippedLastFertilize: boolean,
		public tag: string,
		public imageId: number,
		public isPublic: boolean,
		public doNotify: boolean,
		public logs: PlantLog[],
		public comments: Comment[],
		public notes: string) {
		console.log("Plant constructor!")
	}
	public plantToString(): string {
		let plantDetails = `Plant Details:
		ID: ${this.id}
		Name: ${this.name}
		Username: ${this.username}
		Email: ${this.email}
		Watering Frequency: ${this.wateringFrequency}
		Fertilizing Frequency: ${this.fertilizingFrequency}
		Last Water Date: ${this.lastWaterDate}
		Last Fertilize Date: ${this.lastFertilizeDate}
		Last Moist Date: ${this.lastMoistDate}
		Skipped Last Fertilize: ${this.skippedLastFertilize ? 'Yes' : 'No'}
		Tag: ${this.tag}
		Image ID: ${this.imageId}
		Is Public: ${this.isPublic ? 'Yes' : 'No'}
		Do Notify: ${this.doNotify ? 'Yes' : 'No'}
		Notes: ${this.notes}`;
		return plantDetails;
	}
}


