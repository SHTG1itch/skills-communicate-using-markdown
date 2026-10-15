const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { evaluate, parse, section } = require('./check-step.cjs');

const fence = (language, body) => '```' + language + '\n' + body + '\n```';
const journal = '# Daily Learning\n\n## Morning Planning\n\n- [ ] Practice Markdown\n\n' +
  '<img src="https://octodex.github.com/images/cloud.jpg" alt="Cloudy morning" width="100">\n\n' +
  '## Review\n\n' + fence('bash', 'git status') + '\n\n## Learning metrics\n\n' +
  'On day $d_1$, c means completed tasks and t means total tasks. The percentage p is fifty when c is two and t is four.\n\n' +
  '$$\np = \\frac{c}{t} \\times 100\n$$\n';
const readme = `# Markdown Learning Journal

## Overview

A learning journal for students practicing technical communication with GitHub Markdown.

## Features

- Plan the day with headings.
- Track tasks with checkboxes.
- Explain progress with math.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)

## Prerequisites

Install Git and a text editor to read this journal locally.

## Installation

Run these commands in a terminal to download the repository and enter its folder.

${fence('bash', 'git clone https://github.com/SHTG1itch/skills-communicate-using-markdown.git\ncd skills-communicate-using-markdown')}

## Usage

From the repository folder, display the journal in your terminal with this command.

${fence('bash', 'cat day-1.md')}

## Expected output

The terminal displays source Markdown while GitHub Preview renders the headings.

${fence('text', '# Daily Learning\n\n## Morning Planning')}

## Project files

| File | Purpose |
| --- | --- |
| [Journal](../day-1.md) | Plans and reviews |
| [README](README.md) | Setup and usage |

## Contributing

Create a branch, preview your Markdown, check links, then open a pull request.

## Support

Ask for help in [repository issues](https://github.com/SHTG1itch/skills-communicate-using-markdown/issues) and include your lesson and error message.

## License

This project uses the [MIT License](../LICENSE), which explains permissions and conditions.

## Troubleshooting

If the journal is missing, enter the repository folder and check your selected branch.

## Review checklist

- [x] Confirmed the purpose and audience.
- [x] Followed setup and usage instructions.
- [x] Tested links and alternative text.
- [x] Verified support and license information.
`;

function submission(t, changes = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-course-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'project-guide'));
  for (const [file, text] of Object.entries({ 'day-1.md': journal, 'project-guide/README.md': readme, LICENSE: 'MIT License', ...changes })) {
    if (text !== null) fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

test('a complete submission passes every lesson cumulatively', t => {
  const root = submission(t);
  for (let step = 1; step <= 10; step++) {
    assert.deepEqual(evaluate(step, root).filter(r => !r.passed), [], `Step ${step}`);
  }
});

test('missing files fail without throwing', t => {
  const root = submission(t, { 'day-1.md': null, 'project-guide/README.md': null });
  assert.ok(evaluate(10, root).some(r => !r.passed));
});

test('code examples and comments cannot supply headings or tasks', t => {
  const root = submission(t, { 'day-1.md': '<!-- # Fake title -->\n' + fence('md', '# Fake\n## One\n## Two\n- [ ] Fake') });
  assert.equal(evaluate(2, root).every(r => r.passed), false);
});

test('math fences render but ordinary latex fences do not count as display math', t => {
  const block = '$$\np = \\frac{c}{t} \\times 100\n$$';
  const root = submission(t, { 'day-1.md': journal.replace(block, fence('math', 'p = \\frac{c}{t}')) });
  assert.ok(evaluate(5, root).every(r => r.passed));
  fs.writeFileSync(path.join(root, 'day-1.md'), journal.replace(block, fence('latex', 'p = \\frac{c}{t}')));
  assert.ok(evaluate(5, root).some(r => !r.passed && /display math/.test(r.description)));
});

for (const [description, before, after] of [
  ['wrong local path', '../day-1.md', 'day-1.md'],
  ['wrong contents anchor', '(#overview)', '(#missing)'],
  ['unfinished placeholder', 'A learning journal', 'TODO A learning journal'],
  ['unchecked review task', '[x] Tested links', '[ ] Tested links'],
  ['missing license section', '## License', '## Copyright'],
  ['missing usage section', '## Usage', '## How to use'],
  ['missing expected output', '## Expected output', '## Example'],
  ['missing file table', '| --- | --- |', 'No table separator'],
  ['missing contribution process', '## Contributing', '## Community'],
  ['missing support section', '## Support', '## Help'],
  ['missing troubleshooting', '## Troubleshooting', '## Problems'],
  ['empty overview', 'A learning journal for students practicing technical communication with GitHub Markdown.', 'Brief.'],
  ['missing install commands', 'git clone https://github.com/SHTG1itch/skills-communicate-using-markdown.git', 'echo hello'],
  ['empty alt text', '## Overview', '<img src="https://octodex.github.com/images/cloud.jpg" alt="">\n\n## Overview'],
  ['malformed URL encoding', '../day-1.md', '%invalid'],
]) {
  test(`final review rejects ${description}`, t => {
    const root = submission(t, { 'project-guide/README.md': readme.replace(before, after) });
    assert.ok(evaluate(10, root).some(r => !r.passed));
  });
}

test('deleting old work fails later lessons', t => {
  const root = submission(t, { 'day-1.md': journal.replace('- [ ] Practice Markdown', '') });
  assert.ok(evaluate(10, root).some(r => !r.passed && /unchecked task/.test(r.description)));
});

test('inline math shown only as source code does not pass', t => {
  const root = submission(t, { 'day-1.md': journal.replace('$d_1$', '`$d_1$`') });
  assert.ok(evaluate(5, root).some(r => !r.passed && /inline math/.test(r.description)));
});

test('unclosed README fences fail final review', t => {
  const root = submission(t, { 'project-guide/README.md': readme + '\n```bash\necho unfinished\n' });
  assert.ok(evaluate(10, root).some(r => !r.passed && /fences are closed/.test(r.description)));
});

test('parser handles CRLF, tilde fences, nested fences, and unclosed blocks', () => {
  const parsed = parse('## Real\r\n~~~~md\r\n```bash\r\n## Fake\r\n```\r\n~~~~\r\n');
  assert.equal(parsed.closed, true);
  assert.ok(!parsed.prose.includes('## Fake'));
  assert.equal(parse('```bash\nhello').closed, false);
  assert.equal(section(readme, 'Expected output').includes('## Morning Planning'), true);
  assert.ok(section(readme, 'Expected output').includes('GitHub Preview'));
});

test('CLI writes useful feedback and signals success and failure', t => {
  const root = submission(t);
  const feedback = path.join(root, 'feedback.md');
  const cli = path.join(__dirname, 'check-step.cjs');
  assert.equal(spawnSync(process.execPath, [cli, '10', root, feedback]).status, 0);
  assert.match(fs.readFileSync(feedback, 'utf8'), /All checks passed/);
  fs.unlinkSync(path.join(root, 'day-1.md'));
  assert.equal(spawnSync(process.execPath, [cli, '10', root, feedback]).status, 1);
  assert.match(fs.readFileSync(feedback, 'utf8'), /Fix the marked items/);
});

test('numbered workflows have matching lessons and correct next-step wiring', () => {
  const workflows = path.join(__dirname, '../workflows');
  const files = fs.readdirSync(workflows).filter(f => /^\d+-.*\.yml$/.test(f));
  assert.equal(files.length, 12);
  for (let step = 1; step <= 10; step++) {
    const file = files.find(f => f.startsWith(`${step}-`));
    const yaml = fs.readFileSync(path.join(workflows, file), 'utf8');
    assert.match(yaml, new RegExp(`^name: Step ${step}\\r?$`, 'm'));
    assert.match(yaml, new RegExp(`check-step.cjs ${step} submission`));
    assert.match(yaml, new RegExp(`gh workflow enable "Step ${step + 1}"`));
    assert.match(yaml, new RegExp(`gh workflow disable "Step ${step}"`));
    assert.match(yaml, /needs: \[find_exercise, check_step_work\]/);
    assert.match(yaml, /if: needs.active_step.outputs.active == 'true'/);
    const lesson = yaml.match(/STEP_\d+_FILE: "([^"]+)"/)[1];
    assert.ok(fs.existsSync(lesson));
    assert.match(fs.readFileSync(lesson, 'utf8'), new RegExp(`^## Step ${step + 1}:`));
  }
  const final = fs.readFileSync(path.join(workflows, files.find(f => f.startsWith('11-'))), 'utf8');
  assert.match(final, /needs: \[find_exercise, validate_final_submission\]/);
  assert.match(final, /github.event.pull_request.merged == true/);
  assert.match(final, /needs: \[find_exercise, finish_exercise\]/);
  const runtime = fs.readFileSync(path.join(workflows, 'course-tests.yml'), 'utf8');
  assert.match(runtime, /step: \$\{\{ fromJSON\(inputs.verify-step\) \}\}/);
  for (const [, job, body] of final.matchAll(/^  (\w+):\r?\n([^]*?)(?=^  \w+:|$(?![^]))/gm)) {
    assert.ok(!body.match(new RegExp(`needs: \\[[^\\]]*\\b${job}\\b`)), `${job} cannot depend on itself`);
  }
});

test('active lesson gate ignores results and learner comments', async () => {
  const yaml = fs.readFileSync(path.join(__dirname, '../workflows/check-active-step.yml'), 'utf8');
  const script = yaml.split('          script: |')[1].split(/\r?\n/).slice(1).map(l => l.slice(12)).join('\n');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('github', 'context', 'core', 'process', script);
  const bot = body => ({ user: { login: 'github-actions[bot]' }, body, created_at: '2026-10-15T10:00:00Z' });
  const comments = [bot('## Step 4: Add an image'), bot('## Step 4: Passed'), bot('## Step 5: Explain a result with LaTeX'),
    { user: { login: 'student' }, body: '## Step 11: Pretend to finish' }, bot('## Step 5: Keep going')];
  for (const [step, time] of [['4', '10:01'], ['5', '10:01'], ['6', '10:01'], ['11', '10:01'], ['5', '09:59']]) {
    let active;
    await run({ paginate: async () => comments, rest: { issues: { listComments: null }, actions: {
      getWorkflowRun: async () => ({ data: { created_at: `2026-10-15T${time}:00Z` } })
    } } }, { repo: {}, runId: 123 },
      { setOutput: (_, value) => { active = value; } }, { env: { ISSUE_NUMBER: '1', STEP: step } });
    assert.equal(active, step === '5' && time === '10:01' ? 'true' : 'false');
  }
});
