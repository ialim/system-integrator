import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SharesService } from './shares.service';
import { ProposalResponseDto } from './dto';

@Controller('shared')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Get('bom-versions/:shareId')
  getSharedBom(@Param('shareId') shareId: string) {
    return this.sharesService.getSharedBomVersion(shareId);
  }

  @Post('bom-versions/:shareId/respond')
  respondToProposal(@Param('shareId') shareId: string, @Body() body: ProposalResponseDto) {
    return this.sharesService.respondToProposal(shareId, body);
  }

  @Get('orders/:shareId')
  getSharedOrder(@Param('shareId') shareId: string) {
    return this.sharesService.getSharedOrder(shareId);
  }
}
