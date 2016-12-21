'use strict';
/*
  allows parallel mode by splitting scenarios across nodes,

  usage:

    # run scenarios for node 3 of 4
    ./cucumber --parallel 3/4
    # or use env vars
    PARALLEL_NODE_INDEX=3 PARALLEL_NODE_TOTAL=4 ./cucumber

  after all nodes are run, use this to collect and merge the results:

    ./run-plugin parallel-collect

*/
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';

class ParallelPlugin {

  cli(program, config) {
    this.config = config;
    program.command('parallel-collect')
      .description('collects and merges results from parallel nodes')
      .action(() => {
        const projectRoot = path.join(__dirname, '..');
        const outputPath = path.join(projectRoot, 'output');
        let files = fs.readdirSync(outputPath).filter(f => /^result-parallel/.test(f));
        let results = [];
        files.forEach(file => {
          let fileResults = JSON.parse(fs.readFileSync(path.join(outputPath, file)).toString());
          fileResults.forEach(feature => {
            let existingFeature = results.find(r => r.id === feature.id);
            if (existingFeature) {
              existingFeature.elements.push.apply(existingFeature.elements, feature.elements);
            } else {
              results.push(feature);
            }
          });
        });
        fs.writeFileSync('result.json', JSON.stringify(results, null, 2));
      });
    program.command('parallel-clean')
      .description('deletes results from parallel nodes')
      .action(this.cleanResults);
  }

  cleanResults() {
    let projectRoot = path.join(__dirname, '..');
    const outputPath = path.join(projectRoot, 'output');
    let files = fs.readdirSync(outputPath).filter(f => /^result-parallel/.test(f));
    files.forEach(file => {
      fs.unlinkSync(path.join(outputPath, file));
    });
  }

  getUris(args) {
    let projectRoot = path.join(__dirname, '..');
    let command = process.argv[0];
    let commandOptions = {
      env: {
        NOPLUGINS: true
      },
      stdio: 'pipe'
    };

    let commandArgs = args.slice();
    commandArgs.unshift(path.join(__dirname, '..', 'cucumber'));
    commandArgs.push('--dry-run', '--format', 'json');

    let child = childProcess.spawnSync(command, commandArgs, commandOptions);
    if (child.error) {
      throw new Error(child.error.toString());
    }
    if (child.status !== 0) {
      throw new Error(child.output[2].toString());
    }
    let json = child.output[1].toString();
    let features = JSON.parse(json);
    let uris = [];
    features.forEach(feature => {
      let featureUri = path.relative(projectRoot, feature.uri);
      feature.elements.forEach(scenario => uris.push(featureUri + ':' + scenario.line));
    });

    let nodeIndex = process.env.PARALLEL_NODE_INDEX || 0;
    let nodeTotal = process.env.PARALLEL_NODE_TOTAL || 1;
    if (nodeIndex >= nodeTotal) {
      throw new Error('invalid node index for node total, index: ' + nodeIndex + ', total: ' + nodeTotal);
    }
    let nodeSize = Math.ceil(uris.length / nodeTotal);
    uris = uris.slice(nodeIndex * nodeSize, nodeIndex * nodeSize + nodeSize);
    return uris;
  }
}

export default new ParallelPlugin();
