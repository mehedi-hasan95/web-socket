export type MATCH_TYPE = {
  id: number;
  sports: string;
  homeTeam: string;
  awayTeam: string;
  status: "scheduled" | "live" | "finished";
  startAt: Date;
  homeScore: number;
  awayScore: number;
  createdAt: Date;
  updatedAt: Date;
};
