CREATE TABLE "request_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_feedback_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "request_feedback_rating_chk" CHECK ("request_feedback"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "request_feedback" ADD CONSTRAINT "request_feedback_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_feedback" ADD CONSTRAINT "request_feedback_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;