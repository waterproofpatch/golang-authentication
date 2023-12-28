export interface JWTData {
  email: string;
  username: string;
}

export interface Version {
  version: string;
}

export interface Error {
  message: string;
}


export interface PlantLog {
  ID: number;
  log: string;
  CreatedAt: string;
}

export enum PlantCareType {
  FERTILIZE = 1,
  WATER,
}
