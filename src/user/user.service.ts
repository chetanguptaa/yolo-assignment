/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async editUser(userId: number, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });
    delete user.password;
    return user;
  }
  async deleteUser(id: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) throw new ForbiddenException('User does not exist');
    await this.prisma.user.delete({
      where: {
        id: parseInt(id),
      },
    });
    delete user.password;
    return user;
  }
  async logoutUser(userId: number) {
    const newArr: string[] = [];
    await this.prisma.user.update({
      where: {
        id: userId as number,
      },
      data: {
        activeSession: newArr,
      },
    });
    return 'logged out successfully';
  }
  async getUser(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (user.activeSession.length === 0) {
      throw new ForbiddenException('You need to Login');
    }
  }
}
