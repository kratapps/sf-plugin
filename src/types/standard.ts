import { DateString } from 'jsforce';

export interface SObject {
    attributes?: Partial<Attributes>;
    Id: string;
}

export interface Attributes {
    type: string;
    url: string;
}

export interface Organization {
    Id: string;
    NamespacePrefix: string | null;
}

export interface AsyncApexJob {
    ApexClassId: string;
}

export interface User {
    Id: string | undefined;
    Username: string;
    LastName: string;
    FirstName: string | null;
    Name: string;
    CompanyName: string | null;
    Email: string;
    IsActive: boolean;
    TimeZoneSidKey: string;
    UserRoleId: string | null;
    ProfileId: string;
    UserType: string | null;
    CreatedDate: DateString;
    CreatedById: string;
    LastModifiedDate: DateString;
    LastModifiedById: string;
}

export interface ApexClass {
    Id: string;
    NamespacePrefix: string | null;
    Name: string;
    ApiVersion: number;
    Status: string;
    IsValid: boolean;
    BodyCrc: number | null;
    Body: string | null;
    LengthWithoutComments: number;
    CreatedDate: DateString;
    CreatedById: string;
    LastModifiedDate: DateString;
    LastModifiedById: string;
    SystemModstamp: DateString;
}

export interface ApexTrigger {
    Id: string;
    NamespacePrefix: string | null;
    Name: string;
    TableEnumOrId: string | null;
    UsageBeforeInsert: boolean;
    UsageAfterInsert: boolean;
    UsageBeforeUpdate: boolean;
    UsageAfterUpdate: boolean;
    UsageBeforeDelete: boolean;
    UsageAfterDelete: boolean;
    UsageIsBulk: boolean;
    UsageAfterUndelete: boolean;
    ApiVersion: number;
    Status: string;
    IsValid: boolean;
    BodyCrc: number | null;
    Body: string | null;
    LengthWithoutComments: number;
    CreatedDate: DateString;
    CreatedById: string;
    LastModifiedDate: DateString;
    LastModifiedById: string;
    SystemModstamp: DateString;
}
