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
    const endpoint = core.getInput('endpoint') || 'https://api.cloudtype.io';
    const target = core.getInput('project');
    const stagenames = core.getInput('stage');
    const allstages = (core.getInput('allstages') || core.getInput('allStages')) === 'true' ? true : false;
    const file = core.getInput('file');
    const jsoncontents = core.getInput('json');
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
    const projectname = formedtarget.split('/')[1];
    const project = projectname.split(':')[0];
    const stages = (() => {
      if (allstages) return null;
      if (stagenames) return stagenames.split(',').map((v) => v.trim());
      if (~projectname?.indexOf(':')) return [projectname.split(':')[1]];
      return ['$default'];
    })();

    core.info(`🚀 ${docs.length} description(s) will be deployed.`);
    core.info(`👌 Target project is ${scope ? '@' + scope + '/' : ''}${project}`);
    !allstages && core.info(` └ stage: ${stages ? stages.join(',') : '(default stage)'}`);

    // core.info(`payload is ${docs.map((doc: any) => yaml.stringify(doc)).join('---\n')}`);

    // const url = `${endpoint}/project/${scope || '$user'}/${project}/stage/${stage || '$default'}/deployment`;
    // core.info(`url: ${url}`);
    const url = `${endpoint}/project/${scope || '$user'}/${project}/deploy`;

    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({
        request: docs,
        stagenames: stages
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
    core.info(`🎉 ${data.length} apps deployed`);
    core.info('✅ Success - deploy');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
