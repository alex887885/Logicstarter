import { t as SSOPlugin } from "./index-DHITQH_m.mjs";

//#region src/client.d.ts
interface SSOClientOptions {
  domainVerification?: {
    enabled: boolean;
  } | undefined;
}
declare const ssoClient: <CO extends SSOClientOptions>(options?: CO | undefined) => {
  id: "sso-client";
  $InferServerPlugin: SSOPlugin<{
    domainVerification: {
      enabled: CO["domainVerification"] extends {
        enabled: true;
      } ? true : false;
    };
  }>;
  pathMethods: {
    "/sso/providers": "GET";
    "/sso/get-provider": "GET";
  };
};
//#endregion
export { ssoClient };
//# sourceMappingURL=client.d.mts.map