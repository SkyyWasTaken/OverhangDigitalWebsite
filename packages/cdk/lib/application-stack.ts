import {aws_route53, Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {
  CrossAccountZoneDelegationRecord,
  PublicHostedZone,
  TxtRecord,
} from "aws-cdk-lib/aws-route53";
import {ACCOUNTS, DOMAIN_DELEGATED, PROD_ZONE_NAME, PROTON_TXT_RECORD} from "./constants";
import {AccountPrincipal, PolicyDocument, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import {Bucket, BucketEncryption} from "aws-cdk-lib/aws-s3";
import {CfnWebACL} from "aws-cdk-lib/aws-wafv2";
import {AllowedMethods, Distribution,} from "aws-cdk-lib/aws-cloudfront";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {S3BucketOrigin} from "aws-cdk-lib/aws-cloudfront-origins";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, stageName: string) {
    super(scope, id, props);
    const isProd = props.env?.account === ACCOUNTS.prod
    const domainName = isProd ? PROD_ZONE_NAME : `${stageName.toLowerCase()}.${PROD_ZONE_NAME}`
    const route_53 = new Route53Construct(this, 'Route53Construct', stageName, isProd, domainName)
    const site_infra = new SiteInfrastructureConstruct(this, 'SiteInfrastructureConstruct', domainName, route_53.certificate)
    if (site_infra.cloudfrontTarget) {
      route_53.register_cloudfront_target(site_infra.cloudfrontTarget)
    }
  }
}

class SiteInfrastructureConstruct extends Construct {
  public readonly cloudfrontTarget: CloudFrontTarget | undefined;

  constructor(scope: Construct, id: string, domainName: string, certificate?: Certificate) {
    super(scope, id);

    // Create the bucket
    const assetBucketLoggingBucket: Bucket = new Bucket(this, "assetAccessLogs", {
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      lifecycleRules: [
        {
          expiration: Duration.days(1),
        }
      ]
    });

    // Create the bucket
    const assetBucket: Bucket = new Bucket(this, "WebsiteBucket", {
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
      },
      serverAccessLogsBucket: assetBucketLoggingBucket,
    });

    const webAccessControlList = new CfnWebACL(this, "WebACL", {
      name: "WebACL",
      defaultAction: {
        allow: {}
      },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "WebACL",
        sampledRequestsEnabled: true
      }

    })
    if (certificate) {
      const cloudfrontDistribution = new Distribution(this, "websiteDistribution", {
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(assetBucket),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        defaultRootObject: "index.html",
        domainNames: [domainName],
        certificate: certificate,
        webAclId: webAccessControlList.attrArn,
      })
      new BucketDeployment(this, "WebsiteDeploymentBucketV2", {
        destinationBucket: assetBucket,
        // distribution: cloudfrontDistribution,
        sources: [Source.asset("../../build/website", {})],
        distribution: cloudfrontDistribution,
        distributionPaths: ["/*"],
      })
      this.cloudfrontTarget = new CloudFrontTarget(cloudfrontDistribution)
    }
  }
}

class Route53Construct extends Construct {
  private readonly hostedZone: PublicHostedZone;
  public readonly certificate: Certificate | undefined;

  constructor(scope: Construct, id: string, stageName: string, isProd: boolean, domainName: string) {
    super(scope, id);

    this.hostedZone = new PublicHostedZone(this, 'OverhangHostedZone', {
      zoneName: domainName,
      caaAmazon: true,
    })

    if (isProd || DOMAIN_DELEGATED) {
      this.certificate = new Certificate(this, 'OverhangCertificate', {
        domainName: domainName,
        validation: CertificateValidation.fromDns(this.hostedZone)
      })
    } else {
      this.certificate = undefined;
    }

    // Delegate to the beta stage
    const roleName = 'OverhangDelegationRole'
    if (isProd) {
      this.createDelegation(roleName);
      this.createProdRecords();
    } else if (DOMAIN_DELEGATED) {
      this.registerDelegationRecord(this, roleName);
    }
  }

  private createDelegation(roleName: string) {
    const betaPrincipal = new AccountPrincipal(ACCOUNTS.beta)
    new Role(this, roleName, {
      assumedBy: betaPrincipal,
      inlinePolicies: {
        delegation: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['route53:ChangeResourceRecordSets'],
              resources: [this.hostedZone.hostedZoneArn],
            }),
            new PolicyStatement({
              actions: ['route53:ListHostedZonesByName'],
              resources: ['*'],
            }),
          ]
        })
      },
      roleName: roleName,
    })
    this.hostedZone.grantDelegation(betaPrincipal)
  }

  private registerDelegationRecord(scope: Construct, roleName: string) {
    const roleArn = Stack.of(scope).formatArn({
      region: '',
      service: 'iam',
      resource: 'role',
      account: ACCOUNTS.prod,
      resourceName: roleName,
    })
    const delegationRole = Role.fromRoleArn(this, `OverhangHostedZoneDelegationRole`, roleArn)
    new CrossAccountZoneDelegationRecord(this, `${this.hostedZone.zoneName}Record`, {
      delegationRole: delegationRole,
      delegatedZone: this.hostedZone,
      parentHostedZoneName: PROD_ZONE_NAME,
    })
  }

  private createProdRecords() {
    new TxtRecord(this, "ProtonTxtRecord", {
      values: [PROTON_TXT_RECORD],
      recordName: "@",
      zone: this.hostedZone
    })
  }

  public register_cloudfront_target(cloudfrontTarget: CloudFrontTarget) {
    new aws_route53.ARecord(this, 'CloudfrontARecord', {
      zone: this.hostedZone,
      target: aws_route53.RecordTarget.fromAlias(cloudfrontTarget),
    })
  }
}