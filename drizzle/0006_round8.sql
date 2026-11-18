CREATE TABLE "checklist_done" (
	"student_id" uuid NOT NULL,
	"item" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_done_student_id_item_pk" PRIMARY KEY("student_id","item")
);
--> statement-breakpoint
CREATE TABLE "elective_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"elective_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "electives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"teacher" text NOT NULL,
	"slot" text NOT NULL,
	"credits" smallint NOT NULL,
	"capacity" smallint NOT NULL,
	"reserved" smallint DEFAULT 0 NOT NULL,
	"min_course" smallint DEFAULT 1 NOT NULL,
	"semester" text NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	CONSTRAINT "electives_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "checklist_done" ADD CONSTRAINT "checklist_done_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elective_choices" ADD CONSTRAINT "elective_choices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elective_choices" ADD CONSTRAINT "elective_choices_elective_id_electives_id_fk" FOREIGN KEY ("elective_id") REFERENCES "public"."electives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "elective_choice_uq" ON "elective_choices" USING btree ("student_id","elective_id");--> statement-breakpoint
CREATE INDEX "elective_choices_elective_idx" ON "elective_choices" USING btree ("elective_id","status","created_at");