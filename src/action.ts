import * as core from '@actions/core';
import process from 'process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import yaml from 'yaml';
import json5 from 'json5';

async function run(): Promise<void> {
  try {
    const token = core.getInput('token');
    const endpoint = core.getInput('endpoint');
    const target = core.getInput('project');
    const stagenames = core.getInput('stage');
    const file = core.getInput('file');
    const jsoncontents = core.getInput('yaml');
    const yamlcontents = core.getInput('yaml');

    if (!token) throw new Error(`variable token(cloudtype api token) is required`);
    if (!target) throw new Error(`variable target is required [@scope/]project`);
    if (!file && !jsoncontents && !yamlcontents) throw new Error(`variable yaml or json or file is required`);

    const docs = (() => {
      try {
        if (yamlcontents) {
          return yaml.parseAllDocuments(yamlcontents).map((v) => v.toJSON());
        } else if (jsoncontents) {
          return [json5.parse(jsoncontents)];
        } else if (file) {
          const filepath = path.join(process.cwd(), file);
          const text = filepath && fs.existsSync(filepath) && fs.readFileSync(filepath).toString();
          if (!text || typeof text !== 'string') return null;
          try {
            return yaml.parseAllDocuments(text).map((v) => v.toJSON());
          } catch (err) {
            return [json5.parse(text)];
          }
        }
      } catch (err: any) {
        throw new Error(`description load error: ${err.message}`);
      }
    })();

    if (!docs || !Array.isArray(docs)) {
      core.setFailed(`description is null or empty`);
      return;
    }

    const formedtarget = ~target.indexOf('/') ? target : `/${target}`;
    const scopename = formedtarget.split('/')[0];
    const scope = scopename?.startsWith('@') ? scopename.substring(1) : scopename;
    const project = formedtarget.split('/')[1];
    const stages = stagenames?.split(',').map((v) => v.trim()) || ['$default'];

    core.info(`token: ${token}`);
    core.info(`scope: ${scope || '(your scope)'}`);
    core.info(`project: ${project}`);
    core.info(`stage: ${stages.join(',') || '(default stage)'}`);

    // core.info(`payload is ${docs.map((doc: any) => yaml.stringify(doc)).join('---\n')}`);
    core.info(`${docs.length} description(s) will be deployed.`);

    // const url = `${endpoint || 'https://api.cloudtype.io'}/project/${scope || '$user'}/${project}/stage/${stage || '$default'}/deployment`;
    // core.info(`url: ${url}`);
    const url = `${endpoint || 'https://api.cloudtype.io'}/project/${scope || '$user'}/${project}/deploy`;

    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({
        request: docs,
        stages
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!~[200, 204].indexOf(response.status)) {
      const text: any = await response.text();
      let message = `[${response.status}] ${text || '(no body)'} at ${url}`;
      try {
        const result: any = JSON.parse(text);
        if (result.message) message = `[${response.status}] ${result.message} at ${url}`;
      } catch (err: any) {}
      throw new Error(message);
    }

    const data: any = await response.json();
    if (data.error) throw new Error(`${data.message}`);

    // core.info(`response: \n${yaml.stringify(data)}`);
    core.info(`${data.length} apps deployed`);
    core.info('Done.');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();

/*
put https://api.cloudtype.io/project/joje.attrs/test/stage/main/deployment

{
  "name": "html",
  "resources": {
    "cpu": 0.25,
    "memory": 64,
    "replicas": 1,
    "volume": "250M"
  },
  "options": {
    "git": {
      "branch": "master",
      "url": "https://github.com/cloudtype/example-html.git"
    },
    "docbase": "/",
    "spa": false,
    "indexpage": "index.html"
  },
  "app": "html@latest",
  "labels": {
    "app": "html@"
  }
}
*/
