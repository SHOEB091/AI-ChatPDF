import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const messageRoleEnum = pgEnum("message_role_enum", ["system", "user", "assistant"]);

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  fileKey: text("file_key").notNull(),
});

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: messageRoleEnum("role").notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull().unique(),
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 256 })
    .notNull()
    .unique(),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", {
    length: 256,
  }).unique(),
  razorpayPlanId: varchar("razorpay_plan_id", { length: 256 }),
  razorpayCurrentPeriodEnd: timestamp("razorpay_current_period_ended_at"),
});

// drizzle-orm
// drizzle-kit
