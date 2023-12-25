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
	public static makeComment(content: string, plantId: number): Comment {
		const comment: Comment = {
			content: content,
			plantId: plantId,
			username: "", // authoritative
			email: "", // authoritative
			id: 0, // authoritative
			createdAt: new Date(), // authoritative
			viewed: false, // authoritative
		}
		return comment;
	}
}
