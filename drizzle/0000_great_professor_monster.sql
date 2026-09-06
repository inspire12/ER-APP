CREATE TABLE "discharges" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"content" jsonb NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "discharges_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "disease_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aliases" text DEFAULT '' NOT NULL,
	"medication" text NOT NULL,
	"education" text NOT NULL,
	"warning_signs" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disease_templates_name_unique" UNIQUE("name")
);
