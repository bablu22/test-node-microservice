import { Request, Response, NextFunction } from "express";
import config from "./config.json";
import axios from "axios";

export const createHandler = (
  hostname: string,
  path: string,
  method: string,
) => {
  return async (req: Request, res: Response) => {
    try {
      let url = `${hostname}${path}`;
      req.params &&
        Object.keys(req.params).forEach((param) => {
          url = url.replace(`:${param}`, req.params[param]);
        });
      const { data } = await axios({
        method,
        url,
        data: req.body,
        headers: {
          origin: "http://localhost:8081",
          "x-user-id": req.headers["x-user-id"] || "",
          "x-user-email": req.headers["x-user-email"] || "",
          "x-user-name": req.headers["x-user-name"] || "",
          "x-user-role": req.headers["x-user-role"] || "",
          "user-agent": req.headers["user-agent"],
        },
      });

      res.json(data);
    } catch (error) {
      console.error(error);
      if (error instanceof axios.AxiosError) {
        res.status(error.response?.status || 500).send(error.response?.data);
      }
      res.status(500).send("Internal Server Error");
    }
  };
};

export const configureRoutes = (app) => {
  Object.entries(config.services).forEach(([_name, service]) => {
    const hostname = service.url;
    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const endpoint = `/api${route.path}`;

        const handler = createHandler(hostname, route.path, method);
        app[method](endpoint, handler);
      });
    });
  });
};
