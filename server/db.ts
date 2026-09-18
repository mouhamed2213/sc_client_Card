  return prisma.fiche.findMany({ orderBy: { updatedAt: "desc" } });
}
export async function getFicheBySlug(slug: string) {
  await ensureDemoFiches();
  return prisma.fiche.findUnique({ where: { slug } });
}
export async function getFicheById(id: number) {
  return prisma.fiche.findUnique({ where: { id } });
}
export async function createFiche(value: InsertFiche) {
  // Fiche.data is an editor-only object; Prisma persists the canonical
  // serialized representation in dataJson.
  const { data, ...fields } = value as InsertFiche & { data?: unknown };
  void data;
  return (await prisma.fiche.create({ data: fields })).id;
}
export async function updateFiche(
  id: number,
  value: Prisma.FicheUncheckedUpdateInput
) {
  await prisma.fiche.update({ where: { id }, data: value });
  return true;