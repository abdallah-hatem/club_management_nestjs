import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SizeToColorsDto,
  SizeToColorsUpdateDto,
} from './dto/size-to-colors.dto';

@Injectable()
export class SizeToColorService {
  constructor(private prisma: PrismaService) {}

  async getAllSizeToColors() {
    try {
      const sizeToColors = await this.prisma.sizeToColors.findMany({
        include: { colors: true, size: true },
      });
      if (!sizeToColors) {
        throw new BadRequestException('Error');
      }

      return { sizeToColors };
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  async addSizeToColors(dto: SizeToColorsDto) {
    try {
      const { productId, sizeId, colors, quantity } = dto;

      // check if a product with the same size already exists
      const alreadyExists = await this.findSizeToColor(productId, sizeId);

      if (alreadyExists) {
        throw new BadRequestException(
          'Error! item already found',
        ).getResponse();
      }

      const newSizeToColors = await this.prisma.sizeToColors.create({
        data: {
          productId,
          sizeId,
          quantity,
          colors: {
            connect: colors.map((id: number) => ({ id })),
          },
        },
      });

      if (!newSizeToColors) throw new BadRequestException();

      return { msg: 'Succefully created', newSizeToColors };
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  async updateSizeToColors(dto: SizeToColorsUpdateDto, id: string) {
    try {
      const sizeToColorId = Number(id);
      const { productId, sizeId, colors, quantity } = dto;

      // check if eligible to update
      const alreadyExists = await this.findSizeToColor(productId, sizeId);
      if (!alreadyExists) {
        throw new HttpException(
          'Error! not found, make sure that product or size already created',
          HttpStatus.NOT_FOUND,
        );
      }

      // check if all colors ar in database before creating

      const updatedSizeToColors = await this.prisma.sizeToColors.update({
        where: { id: sizeToColorId, sizeId, productId },
        data: {
          colors: { set: colors?.map((id: number) => ({ id })) },
          quantity,
        },
        // include: { colors: true },
      });

      if (!updatedSizeToColors) {
        throw new BadRequestException().getResponse();
      }

      return { msg: 'successfully updated', updatedSizeToColors };
    } catch (error) {
      console.log(error);
      return { error };
    }
  }

  async findSizeToColor(productId: number, sizeId: number) {
    const alreadyExists = await this.prisma.sizeToColors.findMany({
      where: {
        productId,
        sizeId,
      },
    });

    return alreadyExists.length > 0;
  }
}
