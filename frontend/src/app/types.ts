export interface JWTData {
  email: string;
  username: string;
}

export interface User {
  ID: number;
  email: string;
}

export interface Version {
  version: string;
}

export interface Error {
  message: string;
}

export abstract class UserFactory {
  /**
   *
   * @returns a new User object
   */
  public static createUser(): User {
    let user: User = {
      email: '',
      ID: 0,
    };
    return user;
  }
}

export interface Comment {
  id: number;
  CreatedAt?: string;
  plantId: number;
  content: string;
  username: string;
  email: string;
  viewed: boolean;
}
export interface PlantLog {
  id: number;
  log: string;
  CreatedAt: string;
}

export enum PlantCareType {
  FERTILIZE = 1,
  WATER,
}
