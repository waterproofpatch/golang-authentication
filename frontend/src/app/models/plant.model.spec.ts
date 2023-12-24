import { Plant } from './plant.model';

describe('Plant', () => {
  it('should be created correctly', () => {
    // expect(new Plant(123, "name", "username", "email", 1, 2, "1/1/2021", "1/2/2021", "1/3/2021", false, "tag", 345, true, true, [], [], "some notes")).toBeTruthy();
    let plant = new Plant(123, "name", "username", "email", 1, 2, "1/1/2021", "1/2/2021", "1/3/2021", false, "tag", 345, true, true, [], [], "some notes")
    expect(plant.comments).toEqual([])
    expect(plant.name).toBe("name")
    expect(plant.getTag()).toBe("tag")
  });
  it('should be created correctly with empty tag', () => {
    // expect(new Plant(123, "name", "username", "email", 1, 2, "1/1/2021", "1/2/2021", "1/3/2021", false, "tag", 345, true, true, [], [], "some notes")).toBeTruthy();
    let plant = new Plant(123, "name", "username", "email", 1, 2, "1/1/2021", "1/2/2021", "1/3/2021", false, "", 345, true, true, [], [], "some notes")
    expect(plant.comments).toEqual([])
    expect(plant.name).toBe("name")
    expect(plant.getTag()).toBe("(no tag)")
  });
});
