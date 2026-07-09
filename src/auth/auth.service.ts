import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    password: string;
    language?: string;
    quartier?: string;
    role?: 'MEMBER' | 'TREASURER' | 'GROUP_ADMIN';
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        passwordHash,
        language: data.language || 'fr',
        quartier: data.quartier,
        role: data.role || 'MEMBER',
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async login(phoneNumber: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }
}
