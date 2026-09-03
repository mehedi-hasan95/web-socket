CREATE TABLE "commentaries" (
	"id" serial PRIMARY KEY,
	"match_id" serial,
	"minutes" integer,
	"sequence" integer,
	"period" text,
	"event_type" text,
	"actor" text,
	"team" text,
	"message" text NOT NULL,
	"tags" text[],
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "commentary";--> statement-breakpoint
ALTER TABLE "commentaries" ADD CONSTRAINT "commentaries_match_id_matches_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE;