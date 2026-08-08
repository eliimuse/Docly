import { runTestSuite, TEST_SUITE } from './allTestCases.test';

console.log('\n======================================================');
console.log(' DOCLY WORKFLOW DECISION MATRIX - AUTOMATED TEST SUITE');
console.log('======================================================\n');

const report = runTestSuite();

console.log(`Executed ${TEST_SUITE.length} Test Cases:`);
console.log(`------------------------------------------------------`);

report.results.forEach((res) => {
  const icon = res.success ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | [${res.id}] ${res.title}`);
  if (!res.success) {
    console.log(`       Expected: ${res.expected.toUpperCase()} | Got: ${res.actual.toUpperCase()}`);
  }
});

console.log(`------------------------------------------------------`);
console.log(`Summary: ${report.passed} Passed, ${report.failed} Failed.`);
console.log(`======================================================\n`);

if (report.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
