#!/usr/bin/env node
import { runBench } from './run.js';

runBench({ scenariosFile: 'bench/holdout.json', resultsName: 'holdout-latest.json', reportName: 'holdout.html' })
  .then((result) => {
    console.log(JSON.stringify({
      passed: result.passed,
      metrics: result.metrics,
      failures: result.failures.map((failure) => ({
        scenario: failure.scenario,
        mode: failure.mode,
        chosen: failure.chosen,
        reasons: failure.reasons
      }))
    }, null, 2));
    if (!result.passed) process.exitCode = 1;
  });
