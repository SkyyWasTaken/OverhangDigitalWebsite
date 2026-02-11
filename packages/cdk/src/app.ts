#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {OverhangPipelineStack} from "./pipeline-stack";
import {ACCOUNTS, PIPELINE_ACCOUNT, PIPELINE_REGION, REGION} from "./constants";
import {ApplicationStage} from "./application-stage";

const app = new cdk.App();

const pipelineStack = new OverhangPipelineStack(app, 'OverhangPipelineStack', {
    env: {
        account: PIPELINE_ACCOUNT,
        region: PIPELINE_REGION
    }
});

// Add beta
pipelineStack.pipeline?.addStage(new ApplicationStage(app, {
    env: {
        account: ACCOUNTS.beta,
        region: REGION
    },
}, 'Beta'))

// Add prod
pipelineStack.pipeline?.addStage(new ApplicationStage(app, {
    env: {
        account: ACCOUNTS.prod,
        region: REGION
    },
}, 'Prod'))

app.synth();