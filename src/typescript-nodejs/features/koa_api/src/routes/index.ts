import { APIRouter } from "../types/api";

export const routes: APIRouter["Index"] = {
  "GET /": async (ctx) => {
    return { success: true, query: ctx.querystring };
  },
};
