import type { MxRecordValue } from "aws-cdk-lib/aws-route53";

export const ACCOUNTS = {
    "beta": "805673386085",
    "prod": "903070443001"
};

export const PIPELINE_ACCOUNT = ACCOUNTS.beta;

export const PIPELINE_REGION = "us-east-1";

export const REGION = "us-east-1";

export const PROTON_TXT_RECORD = "protonmail-verification=052ac20814248363ca972697dac451e07bfde02a";

export const PROD_ZONE_NAME = "overhangdigital.com";

export const ROOT_MX_RECORDS: MxRecordValue[] = [{ hostName: "mail.protonmail.ch", priority: 10 }, { hostName: "mailsec.protonmail.ch", priority: 20 }]

export const SPF_RECORD_TEXT = "v=spf1 include:_spf.protonmail.ch ~all";

interface DkimRecordEntry {
  recordName: string,
  domainName: string,
  id: string
}

export const DKIM_RECORD_ENTRIES: DkimRecordEntry[] = [
  {
    recordName: "protonmail._domainkey",
    domainName: "protonmail.domainkey.dktlenzupwwzhobhwjooswbflozl7kgk7f7mx4kedoyevzyawknea.domains.proton.ch.",
    id: "ProtonDkim1"
  },
  {
    recordName: "protonmail2._domainkey",
    domainName: "protonmail2.domainkey.dktlenzupwwzhobhwjooswbflozl7kgk7f7mx4kedoyevzyawknea.domains.proton.ch.",
    id: "ProtonDkim2"
  },
  {
    recordName: "protonmail3._domainkey",
    domainName: "protonmail3.domainkey.dktlenzupwwzhobhwjooswbflozl7kgk7f7mx4kedoyevzyawknea.domains.proton.ch.",
    id: "ProtonDkim3"
  }
]

export const CLOUDFRONT_VERIFIED = false;

export const DOMAIN_DELEGATED = true;

export const GITHUB_CREDENTIAL_ENTERED = true;