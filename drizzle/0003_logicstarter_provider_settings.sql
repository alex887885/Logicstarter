CREATE TABLE "logicstarter_provider_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "logicstarter_provider_setting_category_idx" ON "logicstarter_provider_setting" USING btree ("category");
