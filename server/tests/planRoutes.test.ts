import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({
    key,
    url: `/manus-storage/${key}`,
  })),
}));

import type { TrpcContext } from "../_core/context";
import { getFicheBySlug, prisma } from "../db";
import { appRouter } from "../routers";
import { storagePut } from "../storage";

function context(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const caller = () => appRouter.createCaller(context());
const validPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("plan-aware routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a callback form for Essentiel", async () => {
    await expect(
      caller().fiches.contact({
        slug: "atelier-baobab",
        name: "Client Test",
        phone: "+221771234567",
        message: "Rappelez-moi",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("persists a real callback request for Pro", async () => {
    const fiche = await getFicheBySlug("marie-diallo");
    const before = await prisma.contactRequest.count({
      where: { ficheId: fiche!.id },
    });
    await expect(
      caller().fiches.contact({
        slug: "marie-diallo",
        name: "Client Test",
        phone: "+221771234567",
        message: "Je souhaite être rappelé",
      })
    ).resolves.toEqual({ ok: true });
    expect(
      await prisma.contactRequest.count({ where: { ficheId: fiche!.id } })
    ).toBe(before + 1);
    await prisma.contactRequest.deleteMany({
      where: { ficheId: fiche!.id, name: "Client Test" },
    });
  });

  it("blocks gallery upload for Essentiel before contacting storage", async () => {
    await expect(
      caller().media.upload({
        formula: "essentiel",
        kind: "gallery",
        filename: "photo",
        mimeType: "image/webp",
        contentBase64:
          "data:image/webp;base64," + Buffer.alloc(20).toString("base64"),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("blocks profile images over 30 ko before contacting storage", async () => {
    await expect(
      caller().media.upload({
        formula: "pro",
        kind: "profile",
        filename: "portrait",
        mimeType: "image/webp",
        contentBase64:
          "data:image/webp;base64," +
          Buffer.alloc(30 * 1024 + 1).toString("base64"),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("stores a valid gallery image for Signature", async () => {
    const result = await caller().media.upload({
      formula: "signature",
      kind: "gallery",
      filename: "realisation",
      mimeType: "image/png",
      contentBase64: "data:image/png;base64," + validPng.toString("base64"),
    });
    expect(result.bytes).toBe(validPng.byteLength);
    expect(result.url).toContain("/manus-storage/");
    expect(storagePut).toHaveBeenCalledOnce();
  });

  it("rejects bytes that are not a real image", async () => {
    await expect(
      caller().media.upload({
        formula: "signature",
        kind: "gallery",
        filename: "fake",
        mimeType: "image/png",
        contentBase64:
          "data:image/png;base64," + Buffer.alloc(100).toString("base64"),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects activation when Signature contains a ninth gallery image", async () => {
    const fiche = await getFicheBySlug("marie-diallo");
    const data = JSON.parse(fiche!.dataJson);
    await expect(
      caller().fiches.update({
        id: fiche!.id,
        slug: fiche!.slug,
        formule: "signature",
        statut: "active",
        nom: fiche!.nom,
        prenom: fiche!.prenom,
        fonction: fiche!.fonction,
        entreprise: fiche!.entreprise,
        telephone: fiche!.telephone,
        whatsapp: fiche!.whatsapp,
        email: fiche!.email ?? "",
        site: fiche!.site ?? "",
        adresse: fiche!.adresse ?? "",
        lienItineraire: fiche!.lienItineraire ?? "",
        googlePlaceId: "",
        photo: "/portrait.webp",
        logo: "",
        data: {
          ...data,
          galerie: Array.from({ length: 9 }, (_, index) => ({
            url: `/photo-${index}.webp`,
            alt: `Photo ${index}`,
          })),
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
