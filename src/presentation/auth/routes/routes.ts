import { Router } from "express";
import { AuthController } from "../controllers/controller";
import { AuthDatasource } from "@/infrastructure/datasources/auth.datasource";

export class AuthRoutes {
  static get routes(): Router {
    const router = Router();
    const datasource = new AuthDatasource();
    const controller = new AuthController(datasource);

    router.post("/register", controller.register);

    return router;
  }
}
