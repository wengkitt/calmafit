CREATE TABLE "diary_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"source_version_id" text,
	"quantity" double precision NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "diary_quantity_positive" CHECK ("diary_entries"."quantity" > 0 AND "diary_entries"."quantity" <= 1000000),
	CONSTRAINT "diary_meal_valid" CHECK ("diary_entries"."meal" IN ('breakfast','lunch','dinner','snacks')),
	CONSTRAINT "diary_unit_valid" CHECK ("diary_entries"."unit" IN ('grams','servings'))
);
--> statement-breakpoint
CREATE TABLE "food_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"nutrition" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" text NOT NULL,
	"calories" double precision,
	"protein" double precision,
	"carbs" double precision,
	"fat" double precision,
	"target_weight" double precision
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"kilograms" double precision NOT NULL,
	CONSTRAINT "weight_positive" CHECK ("weight_entries"."kilograms" > 0 AND "weight_entries"."kilograms" <= 1000)
);
--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_source_version_id_food_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."food_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_versions" ADD CONSTRAINT "food_versions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_user_date_idx" ON "diary_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "diary_user_created_idx" ON "diary_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "food_versions_food_idx" ON "food_versions" USING btree ("food_id","created_at");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_user_date_idx" ON "weight_entries" USING btree ("user_id","date");