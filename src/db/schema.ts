import { defineRelations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const matchStatusEnum = pgEnum("match_status_enum", [
  "scheduled",
  "live",
  "finished",
]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sports: text("sports").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  startAt: timestamp("start_at").notNull(),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  ...timestamps,
});

export const commentaries = pgTable(
  "commentaries",
  {
    id: serial("id").primaryKey(),
    matchId: serial("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    minutes: integer("minutes"),
    sequence: integer("sequence"),
    period: text("period"),
    eventType: text("event_type"),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    tags: text("tags").array(),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [index("commentaries_match_id_idx").on(table.matchId)],
);

export const schemaRelations = defineRelations(
  { matches, commentaries },
  (r) => ({
    matches: {
      commentaries: r.many.commentaries(),
    },
    commentaries: {
      match: r.one.matches({
        from: r.commentaries.matchId,
        to: r.matches.id,
      }),
    },
  }),
);
