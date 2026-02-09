import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {CodePipeline, CodePipelineSource, ShellStep} from 'aws-cdk-lib/pipelines';
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {BuildSpec} from "aws-cdk-lib/aws-codebuild";
import { GITHUB_CREDENTIAL_ENTERED } from './constants';

export class OverhangPipelineStack extends cdk.Stack {
  readonly pipeline: CodePipeline | undefined;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Secret(this, 'GithubToken', {
      secretName: 'github-token'
    })

    if (GITHUB_CREDENTIAL_ENTERED) {
      this.pipeline = new CodePipeline(this, 'Pipeline', {
        pipelineName: 'OverhangPipeline',
        crossAccountKeys: true,
        synth: new ShellStep('Synth', {
          input: CodePipelineSource.gitHub('SkyyWasTaken/OverhangDigitalWebsite', 'main'),
          commands: ['npm ci', 'npm run build'],
          primaryOutputDirectory: "build"
        }),
        synthCodeBuildDefaults: {
          partialBuildSpec: BuildSpec.fromObject({
            phases: {
              install: {
                "runtime-versions": {
                  "nodejs": 22
                }
              }
            }
          })
        }
      });
    } else {
      this.pipeline = undefined
    }
  }
}