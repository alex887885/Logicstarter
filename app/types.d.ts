declare module "*.css?url" {
  const href: string;
  export default href;
}

declare module "@better-auth/infra" {
  export function sendEmail(input: {
    template: string;
    to: string;
    variables?: Record<string, string | undefined>;
  }): Promise<void>;

  export function sendSMS(input: {
    to: string;
    code: string;
    template: string;
  }): Promise<void>;

  export function dash(input: {
    apiKey?: string;
    activityTracking?: {
      enabled?: boolean;
      updateInterval?: number;
    };
  }): any;
}
