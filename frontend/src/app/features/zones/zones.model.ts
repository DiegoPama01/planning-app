export interface Zone {
  id: string;
  name: string;
  color: string;
}

export interface ZoneUpsertPayload {
  name: string;
  color: string;
}
