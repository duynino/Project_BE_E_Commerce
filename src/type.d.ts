import { User } from '~/models/schemas/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User | any;
    }
  }
}
