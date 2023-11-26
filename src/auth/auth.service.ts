/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { SECRET } from './strategy';
import { generateSessionId } from 'src/utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  async login(dto: AuthDto) {
    // Find the user by email
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException('Email does not exist');
    }
    if (user.activeSession.length > 0) {
      throw new ForbiddenException('Already logged in on a different device');
    }
    // Compare Password
    const passwordMatch = await argon.verify(user.password, dto.password);
    // If password incorrect throw exception
    if (!passwordMatch) {
      throw new ForbiddenException('Incorrect Password');
    }
    const sessionId = generateSessionId();
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        activeSession: [sessionId],
      },
    });
    return this.signToken(user.id, user.email);
  }
  async signup(dto: AuthDto) {
    // Generate the password hash
    const hash = await argon.hash(dto.password);
    // Save the new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
        },
        select: {
          id: true,
          email: true,
        },
      });
      // Return the saved user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw Error;
    }
  }
  async signToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: SECRET,
    });
    return {
      access_token: token,
    };
  }
}
