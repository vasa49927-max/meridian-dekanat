CREATE TABLE "portfolio_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"org" text,
	"date" text NOT NULL,
	"description" text,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"clarity" smallint NOT NULL,
	"teacher" smallint NOT NULL,
	"workload" smallint NOT NULL,
	"comment" text,
	"day" text NOT NULL,
	CONSTRAINT "survey_scores_chk" CHECK ("survey_responses"."clarity" between 1 and 5 and "survey_responses"."teacher" between 1 and 5 and "survey_responses"."workload" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "survey_votes" (
	"voter_hash" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_invites" ADD CONSTRAINT "risk_invites_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_invites" ADD CONSTRAINT "risk_invites_offering_id_course_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_invites" ADD CONSTRAINT "risk_invites_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_offering_id_course_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_student_idx" ON "portfolio_items" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "risk_invites_student_idx" ON "risk_invites" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "survey_responses_offering_idx" ON "survey_responses" USING btree ("offering_id");