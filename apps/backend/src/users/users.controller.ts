import { Controller, Get, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Tüm kullanıcıları listele' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return ApiResponseHelper.paginated(result.users, result.total, result.page, result.limit);
  }

  @Get('field-users')
  @Roles('admin')
  @ApiOperation({ summary: 'Aktif saha kullanıcılarını listele' })
  async getFieldUsers() {
    const users = await this.usersService.getFieldUsers();
    return ApiResponseHelper.success(users);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return ApiResponseHelper.success(user);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Kullanıcı güncelle' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return ApiResponseHelper.success(user, 'Kullanıcı güncellendi');
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Kullanıcı aktif/pasif' })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.toggleActive(id);
    return ApiResponseHelper.success(user, `Kullanıcı ${user.isActive ? 'aktif' : 'pasif'} yapıldı`);
  }
}
