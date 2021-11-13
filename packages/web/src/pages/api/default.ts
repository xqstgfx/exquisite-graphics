import APIHandler from '@server/middlewares/APIHandler';
import { NextApiHandler } from 'next';

const api: NextApiHandler = async (req, res) => {
  return res.json({});
};

export default APIHandler(api);
