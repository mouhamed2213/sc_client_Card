-- Keep legacy OAuth identity data available during migration,
-- but stop requiring it for local users whose canonical identity is users.id.
ALTER TABLE "users" ALTER COLUMN "openId" DROP NOT NULL;
