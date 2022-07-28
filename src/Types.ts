declare namespace GoogleAppsScript {
  namespace Drive {
    namespace Schema {
      interface ContentRestriction {
        readOnly?: boolean | undefined,
        reason?: string | undefined,
        restrictingUser?: {
          kind: "drive#user",
          displayName: string,
          picture: {
            url: string
          },
          isAuthenticatedUser: boolean,
          permissionId: string,
          emailAddress: string,
        } | undefined,
        restrictionDate?: string | undefined,
        type?: string | undefined
      }
      interface File {
        contentRestrictions?: ContentRestriction[] | undefined,
      }
    }
  }
}
