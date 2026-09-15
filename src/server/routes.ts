import { handleApi } from '@/server/api';
import { handleCapture } from '@/server/capture';

type SpaHandler = Bun.HTMLBundle | (() => Response);

type MethodHandler = (req: Bun.BunRequest) => Response | Promise<Response>;

function tokenFromRequest(req: Bun.BunRequest): string {
  const fromParams = req.params.token;
  if (typeof fromParams === 'string' && fromParams.length > 0) {
    return fromParams;
  }
  const match = /^\/h\/([^/]+)/.exec(new URL(req.url).pathname);
  return match?.[1] ?? '';
}

const captureMethods: Record<string, MethodHandler> = {};
for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const) {
  captureMethods[method] = (req) => handleCapture(req, tokenFromRequest(req));
}

function apiRoute(req: Request): Promise<Response> {
  return handleApi(req);
}

export function buildRoutes(spa: SpaHandler) {
  return {
    '/h/:token': captureMethods,
    '/h/:token/*': captureMethods,
    '/api/*': {
      GET: apiRoute,
      POST: apiRoute,
      PUT: apiRoute,
      PATCH: apiRoute,
      DELETE: apiRoute,
    },
    '/*': spa,
  };
}
