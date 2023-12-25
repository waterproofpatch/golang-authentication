export class Comment {
	constructor(
		public id: number,
		public createdAt: Date,
		public plantId: number,
		public content: string,
		public username: string,
		public email: string,
		public viewed: boolean
	) { }
}
