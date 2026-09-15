import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import ingredientsRouter from "./ingredients";
import recipesRouter from "./recipes";
import shoppingRouter from "./shopping";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(ingredientsRouter);
router.use(recipesRouter);
router.use(shoppingRouter);

export default router;
