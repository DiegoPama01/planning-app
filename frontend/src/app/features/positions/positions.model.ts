export interface Position {
  id: string;
  name: string;
  color: string;
}

export interface PositionUpsertPayload {
  name: string;
  color: string;
}
