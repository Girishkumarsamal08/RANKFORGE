import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const userRepository = new UserRepository();

export class AuthService {
  async register(payload: any) {
    // Validate request body
    const validated = registerSchema.parse(payload);

    const existingUser = await userRepository.findByEmail(validated.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const user = await userRepository.createUser({
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(payload: any) {
    const validated = loginSchema.parse(payload);

    const user = await userRepository.findByEmail(validated.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }
}
