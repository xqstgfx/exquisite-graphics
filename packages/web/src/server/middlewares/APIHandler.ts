import { NextApiRequest, NextApiResponse } from 'next';
import isProd from '../helpers/isProd';

export type APIType = (
  req: NextApiRequest,
  res: NextApiResponse
) => void | Promise<void> | Promise<NextApiResponse>;

const APIHandler = (handler: APIType) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      const status = error.statusCode || 500;
      const message =
        isProd && status == 500
          ? 'There was an error processing this request.'
          : error.message;
      return res.status(status).json({ error: true, status, message });
    }
  };
};

export default APIHandler;
