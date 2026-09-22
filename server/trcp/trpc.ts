import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

const ADMIN_ONLY_PATHS = new Set([
  "fiches.list",
  "fiches.overview",
  "fiches.create",
  "fiches.update",
  "fiches.updateStatus",
  "fiches.contactRequests",
  "media.upload",
]);

const requireAdminForSensitivePath = t.middleware(async opts => {
  if (ADMIN_ONLY_PATHS.has(opts.path)) {
    if (!opts.ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (opts.ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
  }

  return opts.next();
});

export const router = t.router;
export const publicProcedure = t.procedure.use(requireAdminForSensitivePath);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

export const clientProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role !== "user") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Réservé aux comptes client.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
