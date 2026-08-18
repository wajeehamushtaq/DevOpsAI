import { Injectable } from '@nestjs/common';

export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

@Injectable()
export class IncidentsService {}
