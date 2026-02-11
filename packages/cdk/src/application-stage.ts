import {Stage, type StageProps} from "aws-cdk-lib";
import {ApplicationStack} from "./application-stack";
import type { Construct } from "constructs";

export class ApplicationStage extends Stage {
    constructor(scope: Construct, props: StageProps, stageName: string) {
        super(scope, `${stageName}ApplicationStage`, props);
        new ApplicationStack(this, `${stageName}ApplicationStack`, {
            env: props.env,
        }, stageName);
    }
}