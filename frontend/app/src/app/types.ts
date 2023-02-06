export interface JWTData {
  email: string;
  isCoach: boolean;
  firstName: string;
  lastName: string;
  phone: string;
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
