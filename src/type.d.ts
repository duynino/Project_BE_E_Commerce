import type { User } from '~/modules/user/user.model';

type RequestUser = Partial<User> & {
  userId?: string;
  permissions?: string[];
};

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
