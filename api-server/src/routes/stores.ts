import { Router, type IRouter } from "express";
import { db, storesTable } from "@workspace/db";
import { ListStoresResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stores", async (_req, res): Promise<void> => {
  const stores = await db.select().from(storesTable).orderBy(storesTable.id);
  res.json(ListStoresResponse.parse(stores));
});

export default router;
