import express, { Router } from "express";

interface IOptions {
  port: number;
  routes: Router;
}

export class Server {
  private readonly app = express();
  private readonly port: number;
  private readonly router: Router;

  constructor(options: IOptions) {
    this.port = options.port;
    this.router = options.routes;
  }

  async start() {
    //* Middlewares
    this.app.use(express.json()); // raw
    this.app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

    //* Routes
    this.app.use(this.router);

    this.app.listen(this.port, () => {
      console.log(`Server is running on port http://localhost:${this.port}`);
    });
  }
}
