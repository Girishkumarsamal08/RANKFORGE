import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      res.status(400);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      res.status(401);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In JWT authentication, logging out on server side is primarily deleting the token Client-side.
      // We return success status.
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      next(error);
    }
  }
}
