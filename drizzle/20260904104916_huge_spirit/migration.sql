DROP INDEX "commentaries_match_id_idx";--> statement-breakpoint
CREATE INDEX "commentaries_match_id_idx" ON "commentaries" ("match_id");