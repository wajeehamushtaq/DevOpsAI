import { Injectable } from '@nestjs/common';

export interface Organization {
  id: string;
  name: string;
}

@Injectable()
export class OrganizationsService {
  private readonly organizations: Organization[] = [];

  create(name: string) {
    const organization = {
      id: crypto.randomUUID(),
      name,
    };

    this.organizations.push(organization);

    return organization;
  }

  findAll() {
    return this.organizations;
  }
}
