import { Comment } from './comment.model';

describe('Comment', () => {
  it('should create an instance', () => {
    expect(new Comment(1, new Date(), 2, "content", "username", "email", false)).toBeTruthy();
  });
});
