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

test('every required check rejects a submission that omits that requirement', t => {
  const cases = [
    [1, 'day-1.md', journal.replace('# Daily Learning', 'Daily Learning'), /headings/],
    [2, 'day-1.md', journal.replace('- [ ] Practice Markdown', ''), /unchecked task/],
    [3, 'day-1.md', journal.replace(fence('bash', 'git status'), ''), /code block/],
    [4, 'day-1.md', journal.replace('alt="Cloudy morning"', 'alt=""'), /HTML image/],
    [5, 'day-1.md', journal.replace('$d_1$', 'day one'), /inline math/],
    [5, 'day-1.md', journal.replace('\\frac{c}{t}', 'c / t'), /display math/],
    [5, 'day-1.md', journal.slice(0, journal.indexOf('## Learning metrics')) +
      '## Learning metrics\n$d_1$\n\n$$\np = \\frac{c}{t}\n$$\n', /explains the variables/],
    [6, 'project-guide/README.md', readme.replace('# Markdown Learning Journal', 'Journal'), /project title/],
    [6, 'project-guide/README.md', readme.replace(section(readme, 'Overview'), '\nBrief.\n'), /Overview explains/],
    [6, 'project-guide/README.md', readme.replace('- Explain progress with math.', ''), /Features includes/],
    [6, 'project-guide/README.md', readme.replace('[Usage](#usage)', '[Usage](#missing)'), /Contents links/],
    [6, 'project-guide/README.md', readme.replace('## Installation', '## Setup'), /headings exist/],
    [7, 'project-guide/README.md', readme.replace(section(readme, 'Prerequisites'), '\nGit.\n'), /Prerequisites/],
    [7, 'project-guide/README.md', readme.replace(section(readme, 'Installation'), '\nSetup.\n'), /Installation explains/],
    [7, 'project-guide/README.md', readme.replace('cd skills-communicate-using-markdown', 'echo ready'), /git clone and cd/],
    [8, 'project-guide/README.md', readme.replace(section(readme, 'Usage'), '\nRead it.\n'), /Usage provides/],
    [8, 'project-guide/README.md', readme.replace('```text', '```md'), /Expected output/],
    [8, 'project-guide/README.md', readme.replace('| [README](README.md) | Setup and usage |', ''), /Project files/],
    [9, 'project-guide/README.md', readme.replace('open a pull request', 'request a review'), /Contributing/],
    [9, 'project-guide/README.md', readme.replace('[repository issues](https://github.com/SHTG1itch/skills-communicate-using-markdown/issues)', 'repository issues'), /Support/],
    [9, 'project-guide/README.md', readme.replace('[MIT License](../LICENSE)', 'MIT License'), /License identifies/],
    [10, 'project-guide/README.md', readme.replace(section(readme, 'Troubleshooting'), '\nMissing.\n'), /Troubleshooting/],
    [10, 'project-guide/README.md', readme.replace('- [x] Tested links', '- [ ] Tested links'), /Review checklist/],
    [10, 'project-guide/README.md', readme + '\n```bash\necho unfinished\n', /fences are closed/],
    [10, 'project-guide/README.md', readme + '\nTODO finish this.\n', /placeholders/],
    [10, 'project-guide/README.md', readme.replace('(../day-1.md)', '(missing.md)'), /existing local targets/],
    [10, 'project-guide/README.md', readme + '\n<img src="cloud.jpg">\n', /HTML images in README/],
  ];
  const root = submission(t);
  const covered = new Set();
  for (const [step, file, text, description] of cases) {
    fs.writeFileSync(path.join(root, 'day-1.md'), journal);
    fs.writeFileSync(path.join(root, 'project-guide/README.md'), readme);
    fs.writeFileSync(path.join(root, file), text);
    const check = evaluate(step, root).find(r => description.test(r.description));
    assert.ok(check, String(description));
    assert.equal(check.passed, false, check.description);
    covered.add(check.description);
  }
  assert.deepEqual([...covered].sort(), evaluate(10, root).map(r => r.description).sort());
});

test('complete CRLF submissions and every taught shell language pass', t => {
  const root = submission(t, { 'day-1.md': journal.replace(/\n/g, '\r\n') });
  for (const language of ['bash', 'sh', 'shell', 'powershell', 'console']) {
    fs.writeFileSync(path.join(root, 'project-guide/README.md'), readme.replace(/```bash/g, '```' + language).replace(/\r?\n/g, '\r\n'));
    assert.deepEqual(evaluate(10, root).filter(r => !r.passed), [], language);
  }
});

test('valid ATX headings accept indentation, tabs and optional closing hashes', t => {
  const root = submission(t);
  for (const indent of ['', ' ', '  ', '   ']) {
    const format = text => text.replace(/^(#{1,6}) +(.+)$/gm, (_, hashes, title) => `${indent}${hashes}\t${title} ${hashes}`);
    fs.writeFileSync(path.join(root, 'day-1.md'), format(journal));
    fs.writeFileSync(path.join(root, 'project-guide/README.md'), format(readme));
    assert.deepEqual(evaluate(10, root).filter(r => !r.passed), [], `indent ${indent.length}`);
  }
});

test('blank headings and closing hashes alone cannot supply a title', t => {
  const root = submission(t);
  for (const blank of ['#    ', '# ###', '  #\t  ']) {
    fs.writeFileSync(path.join(root, 'day-1.md'), journal.replace('# Daily Learning', blank));
    fs.writeFileSync(path.join(root, 'project-guide/README.md'), readme.replace('# Markdown Learning Journal', blank));
    assert.equal(evaluate(1, root)[0].passed, false, blank);
    assert.equal(evaluate(6, root).find(r => /project title/.test(r.description)).passed, false, blank);
  }
});

test('large submissions and repeated incomplete fences do not bypass cumulative checks', t => {
  const root = submission(t, { 'day-1.md': journal + '\n' + '- [ ] Practice safely\n'.repeat(10000) });
  assert.deepEqual(evaluate(10, root).filter(r => !r.passed), []);
  fs.writeFileSync(path.join(root, 'project-guide/README.md'), readme + '\n````bash\n' + '```\necho example\n'.repeat(10000));
  assert.equal(evaluate(10, root).find(r => /fences are closed/.test(r.description)).passed, false);
});

test('fence lengths, characters and newline conventions preserve section boundaries', () => {
  for (let size = 3; size <= 16; size++) {
    for (const char of ['`', '~']) {
      for (const newline of ['\n', '\r\n']) {
        const delimiter = char.repeat(size);
        const source = ['## Installation', delimiter + 'bash', '# Not a title', '## Usage',
          char.repeat(size - 1), 'git status', delimiter, '## Usage', 'Real instructions here.'].join(newline);
        const parsed = parse(source);
        assert.equal(parsed.closed, true);
        assert.equal(parsed.blocks.length, 1);
        assert.equal(section(source, 'Usage').trim(), 'Real instructions here.');
        assert.ok(!parsed.prose.includes('# Not a title'));
      }
    }
  }
});

test('missing files fail without throwing', t => {
  const root = submission(t, { 'day-1.md': null, 'project-guide/README.md': null });
  assert.ok(evaluate(10, root).some(r => !r.passed));
});

test('learner directory symlinks cannot supply files from outside the submission', t => {
  const outside = submission(t);
  const root = submission(t);
  const guide = path.join(root, 'project-guide');
  fs.rmSync(guide, { recursive: true });
  fs.symlinkSync(path.join(outside, 'project-guide'), guide, 'junction');
  const results = evaluate(6, root);
  assert.equal(results.find(r => /project title/.test(r.description)).passed, false);
  assert.equal(results.find(r => /day-1.md/.test(r.description)).passed, true);
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

test('lessons pass as work is added, and incomplete work cannot unlock the next lesson', t => {
  const root = submission(t, { 'day-1.md': '', 'project-guide/README.md': '' });
  const journalStages = [
    '# Daily Learning\n\n## Morning Planning\n\n## Review\n',
    '\n- [ ] Practice Markdown\n',
    '\n' + fence('bash', 'git status') + '\n',
    '\n<img src="https://octodex.github.com/images/cloud.jpg" alt="Cloudy morning">\n',
    '\n## Learning metrics\n' + section(journal, 'Learning metrics'),
  ];
  const readmeSections = [
    ['Overview', 'Features', 'Contents', 'Installation', 'Usage'],
    ['Prerequisites', 'Installation'],
    ['Usage', 'Expected output', 'Project files'],
    ['Contributing', 'Support', 'License'],
    ['Troubleshooting', 'Review checklist'],
  ];
  let currentJournal = '';
  const sections = new Map();
  for (let step = 1; step <= 10; step++) {
    assert.ok(evaluate(step, root).some(r => !r.passed), `unfinished Step ${step}`);
    if (step <= 5) {
      currentJournal += journalStages[step - 1];
      fs.writeFileSync(path.join(root, 'day-1.md'), currentJournal);
    } else {
      for (const name of readmeSections[step - 6]) {
        sections.set(name, step === 6 && ['Installation', 'Usage'].includes(name) ? '\n' : section(readme, name));
      }
      fs.writeFileSync(path.join(root, 'project-guide/README.md'), '# Markdown Learning Journal\n\n' +
        [...sections].map(([name, body]) => `## ${name}\n${body}`).join('\n'));
    }
    assert.deepEqual(evaluate(step, root).filter(r => !r.passed), [], `completed Step ${step}`);
  }
});

test('display math must be in Learning metrics, not another section', t => {
  const block = '$$\np = \\frac{c}{t} \\times 100\n$$';
  const root = submission(t, { 'day-1.md': journal.replace(block, '') + '\n## Other\n' + fence('math', '\\frac{c}{t}') });
  assert.ok(evaluate(5, root).some(r => !r.passed && /display math/.test(r.description)));
});

for (const inline of ['$d$ with a literal underscore _', '\\$d_1$', '$d$ and $$x_1$$', '$d$\n\n$$\nx_1\n$$']) {
  test(`inline subscript must belong to an unescaped inline expression: ${inline}`, t => {
    const root = submission(t, { 'day-1.md': journal.replace('$d_1$', () => inline) });
    assert.ok(evaluate(5, root).some(r => !r.passed && /inline math/.test(r.description)));
  });
}

test('installation commands must be inside the shell block', t => {
  const commands = 'git clone https://github.com/SHTG1itch/skills-communicate-using-markdown.git\ncd skills-communicate-using-markdown';
  const root = submission(t, { 'project-guide/README.md': readme.replace(fence('bash', commands),
    fence('bash', 'echo setup') + '\n\n' + fence('text', commands)) });
  assert.ok(evaluate(7, root).some(r => !r.passed && /git clone/.test(r.description)));
});

test('HTML image attributes allow spaces around equals and reject data attributes or blank text', t => {
  const image = '<img src="https://octodex.github.com/images/cloud.jpg" alt="Cloudy morning" width="100">';
  const root = submission(t);
  for (const [tag, passed] of [
    ['<img src = "cloud.jpg" alt = "Cloudy morning">', true],
    ['<img src="cloud.jpg" data-alt="Cloudy morning">', false],
    ['<img src="cloud.jpg" alt="   ">', false],
    ['<img data-src="cloud.jpg" alt="Cloudy morning">', false],
  ]) {
    fs.writeFileSync(path.join(root, 'day-1.md'), journal.replace(image, tag));
    assert.equal(evaluate(4, root).find(r => /HTML image/.test(r.description)).passed, passed, tag);
    fs.writeFileSync(path.join(root, 'project-guide/README.md'), readme + '\n' + tag);
    assert.equal(evaluate(10, root).find(r => /HTML images in README/.test(r.description)).passed,
      !tag.includes('data-alt') && !tag.includes('alt="   "'), tag);
  }
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
  const summary = path.join(root, 'summary.md');
  assert.equal(spawnSync(process.execPath, [cli, '10', root, feedback], {
    env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
  }).status, 1);
  assert.equal(fs.readFileSync(summary, 'utf8'), fs.readFileSync(feedback, 'utf8'));
  for (const invalid of ['0', '11', '1.5', 'invalid']) {
    assert.equal(spawnSync(process.execPath, [cli, invalid, root, feedback]).status, 1);
  }
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
    assert.doesNotMatch(yaml, /--edit-last/, 'feedback must not overwrite another run\'s lesson comment');
    assert.match(yaml, /branches:\s*\r?\n\s+- start-blog/);
    assert.match(yaml, /ref: \$\{\{ github.sha \}\}/);
    assert.match(yaml, /ref: \$\{\{ github.event.repository.default_branch \}\}/);
    assert.ok(yaml.indexOf(`gh workflow enable "Step ${step + 1}"`) < yaml.indexOf('Create comment - add step content'),
      `Step ${step + 1} must be enabled before its lesson is visible`);
    assert.ok(yaml.indexOf(`gh workflow disable "Step ${step}"`) > yaml.indexOf('Create comment - add step content'));
    const lesson = yaml.match(/STEP_\d+_FILE: "([^"]+)"/)[1];
    assert.ok(fs.existsSync(lesson));
    assert.match(fs.readFileSync(lesson, 'utf8'), new RegExp(`^## Step ${step + 1}:`));
  }
  const start = fs.readFileSync(path.join(workflows, files.find(f => f.startsWith('0-'))), 'utf8');
  assert.match(start, /needs: \[start_exercise\]/);
  assert.match(start, /skills\/exercise-toolkit\/\.github\/workflows\/start-exercise.yml@v0.6.0/);
  assert.ok(start.indexOf('gh workflow enable "Step 1"') < start.indexOf('Create comment - add step content'));
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

test('queued submissions cannot consume a newly posted lesson and stale runs cannot grade old lessons', async () => {
  const yaml = fs.readFileSync(path.join(__dirname, '../workflows/check-active-step.yml'), 'utf8');
  const script = yaml.split('          script: |')[1].split(/\r?\n/).slice(1).map(l => l.slice(12)).join('\n');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('github', 'context', 'core', 'process', script);
  const lesson = (step, time) => ({ user: { login: 'github-actions[bot]' }, body: `## Step ${step}: Lesson`, created_at: time });
  const old = lesson(5, '2026-10-25T10:00:00Z');
  const next = lesson(6, '2026-10-25T10:02:00Z');
  for (const [comments, step, created, expected] of [
    [[], '6', '10:03', false],
    [[old, next], '6', '10:01', false],
    [[old, next], '5', '10:01', false],
    [[old, next], '6', '10:03', true],
    [[old, next], '6', '10:02', true],
  ]) {
    let active;
    await run({ paginate: async (_, options) => {
      assert.equal(options.issue_number, 2);
      assert.equal(options.per_page, 100);
      return comments;
    }, rest: { issues: { listComments: null }, actions: {
      getWorkflowRun: async options => {
        assert.equal(options.run_id, 123);
        return { data: { created_at: `2026-10-25T${created}:00Z` } };
      },
    } } }, { repo: { owner: 'learner', repo: 'journal' }, runId: 123 },
    { setOutput: (_, value) => { active = value; } }, { env: { ISSUE_NUMBER: '2', STEP: step } });
    assert.equal(active, String(expected), `Step ${step}, submitted at ${created}`);
  }
});

test('pull request completion requires the right branch, an active final lesson, a merge and valid work', () => {
  const yaml = fs.readFileSync(path.join(__dirname, '../workflows/11-merge-your-pull-request.yml'), 'utf8');
  const jobs = Object.fromEntries([...yaml.matchAll(/^  (\w+):\r?\n([^]*?)(?=^  \w+:|$(?![^]))/gm)]
    .map(([, name, body]) => [name, body]));
  const condition = (job, github, needs = {}) => {
    const body = jobs[job];
    const expression = body.match(/^    if: \|\r?\n((?:      .*(?:\r?\n|$))+)/m)?.[1]
      || body.match(/^        if: (.+)$/m)?.[1];
    assert.ok(expression, `${job} has a condition`);
    return new Function('github', 'needs', `return (${expression.trim()});`)(github, needs);
  };
  const event = (action, merged = false, head = 'start-blog', repo = 'learner/journal', template = false) => ({
    repository: 'learner/journal', head_ref: head,
    event: { action, repository: { is_template: template },
      pull_request: { merged, head: { repo: { full_name: repo } } } },
  });
  for (const action of ['opened', 'synchronize', 'reopened']) {
    const github = event(action);
    assert.equal(condition('find_exercise', github), true);
    assert.equal(condition('post_review_content', github), false);
  }
  for (const github of [event('closed'), event('opened', false, 'other-branch'),
    event('opened', false, 'start-blog', 'someone/fork'), event('opened', false, 'start-blog', 'learner/journal', true)]) {
    assert.equal(condition('find_exercise', github), false);
  }
  const merged = event('closed', true);
  assert.equal(condition('find_exercise', merged), true);
  assert.equal(condition('post_review_content', merged), true);
  for (const active of ['true', 'false']) {
    assert.equal(condition('validate_final_submission', merged, { active_step: { outputs: { active } } }), active !== 'true');
  }
  assert.match(jobs.validate_final_submission, /exit 1/);
  assert.match(jobs.validate_final_submission, /github.event.pull_request.merged && github.event.pull_request.merge_commit_sha \|\| github.event.pull_request.head.sha/);
  assert.match(jobs.validate_final_submission, /check-step.cjs 10 submission/);
  assert.match(jobs.post_review_content, /needs: \[find_exercise, validate_final_submission\]/);
  assert.match(jobs.finish_exercise, /needs: \[find_exercise, post_review_content\]/);
  assert.match(jobs.finish_exercise, /skills\/exercise-toolkit\/\.github\/workflows\/finish-exercise.yml@v0.6.0/);
  assert.match(jobs.disable_workflow, /needs: \[find_exercise, finish_exercise\]/);
});
