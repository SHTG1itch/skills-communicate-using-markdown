const fs = require('node:fs');
const path = require('node:path');

// These checks assess documented structure, not the accuracy of a student's prose.
function parse(text) {
  text = text.replace(/\r\n/g, '\n').replace(/<!--[^]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  const blocks = [];
  let fence = null;
  let body = [];
  const prose = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!fence && match) {
      fence = { char: match[1][0], size: match[1].length, language: match[2].trim() };
      body = [];
      prose.push(' '.repeat(line.length));
    } else if (fence) {
      prose.push(' '.repeat(line.length));
      if (match && match[1][0] === fence.char && match[1].length >= fence.size && !match[2].trim()) {
        blocks.push({ language: fence.language, body: body.join('\n') });
        fence = null;
      } else body.push(line);
    } else prose.push(line);
  }
  return { prose: prose.join('\n'), blocks, closed: !fence };
}

function section(prose, name) {
  prose = prose.replace(/\r\n/g, '\n');
  const headings = [...parse(prose).prose.matchAll(/^## +(.+?) *#*[ \t]*$/gm)];
  const index = headings.findIndex(h => h[1].trim().toLowerCase() === name.toLowerCase());
  if (index < 0) return '';
  return prose.slice(headings[index].index + headings[index][0].length, headings[index + 1]?.index);
}

function evaluate(step, root) {
  const results = [];
  const check = (description, passed) => results.push({ description, passed: Boolean(passed) });
  const read = file => {
    const location = path.join(root, file);
    // Do not follow learner-supplied symlinks outside the submission.
    if (!fs.existsSync(location)) return '';
    const real = fs.realpathSync(location);
    const relative = path.relative(fs.realpathSync(root), real);
    return relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(real).isFile() ? '' : fs.readFileSync(real, 'utf8');
  };
  const journal = parse(read('day-1.md'));
  const readmeText = read('project-guide/README.md');
  const readme = parse(readmeText);
  const meaningful = text => text.replace(/[`*_#\[\]()>|$\\-]/g, '').trim().split(/\s+/).filter(Boolean).length >= 8;
  const nonempty = name => meaningful(section(readme.prose, name));
  const command = name => {
    const rawSection = section(readmeText, name);
    return parse(rawSection).blocks.some(b => /^(bash|sh|shell|powershell|console)$/i.test(b.language) && b.body.trim());
  };

  if (step >= 1) {
    check('day-1.md has one level 1 heading and at least two level 2 headings',
      (journal.prose.match(/^# +\S.*$/gm) || []).length === 1 && (journal.prose.match(/^## +\S.*$/gm) || []).length >= 2);
  }
  if (step >= 2) check('Journal includes an unchecked task', /^\s*[-*+] +\[ \] +\S/m.test(journal.prose));
  if (step >= 3) check('Journal includes a closed, nonempty code block with a language',
    journal.closed && journal.blocks.some(b => b.language && b.body.trim()));
  if (step >= 4) check('Journal has an HTML image with alternative text and a source',
    /<img\b(?=[^>]*\balt=["'][^"']+)[^>]*\bsrc=["'][^"']+["'][^>]*>/i.test(journal.prose));
  if (step >= 5) {
    const math = section(journal.prose, 'Learning metrics').replace(/`+[^`\n]*`+/g, '');
    check('Learning metrics contains inline math with a subscript or superscript',
      /(?<![\\$])\$(?!\$)([^$\n]+)\$(?!\$)/g.test(math) && /\$[^$\n]*[_^][^$\n]*\$/.test(math));
    check('Learning metrics contains display math with a LaTeX fraction',
      /\$\$\s*\n[^]*?\\frac\{[^{}]+\}\{[^{}]+\}[^]*?\n\s*\$\$/.test(math)
      || journal.blocks.some(b => b.language === 'math' && /\\frac\{[^{}]+\}\{[^{}]+\}/.test(b.body)));
    check('Learning metrics explains the variables and result in words', meaningful(math.replace(/\$\$[^]*?\$\$/g, '').replace(/\$[^$]*\$/g, '')));
  }
  if (step >= 6) {
    check('project-guide/README.md has exactly one project title', (readme.prose.match(/^# +\S.*$/gm) || []).length === 1);
    check('Overview explains the project and its audience (at least eight words)', nonempty('Overview'));
    check('Features includes at least three bullet points', (section(readme.prose, 'Features').match(/^\s*[-*+] +\S/gm) || []).length >= 3);
    check('Contents links to Overview, Features, Installation and Usage', ['Overview', 'Features', 'Installation', 'Usage'].every(name =>
      new RegExp(`\\[[^\\]]+\\]\\(#${name.toLowerCase()}\\)`, 'i').test(section(readme.prose, 'Contents'))));
    check('Installation and Usage headings exist', ['Installation', 'Usage'].every(name => new RegExp(`^## +${name} *$`, 'mi').test(readme.prose)));
  }
  if (step >= 7) {
    check('Prerequisites describes required tools and access', nonempty('Prerequisites'));
    check('Installation explains setup and includes a shell code block', nonempty('Installation') && command('Installation'));
    check('Installation includes git clone and cd commands',
      parse(section(readmeText, 'Installation')).blocks.some(b => /^git clone +\S+/m.test(b.body) && /^cd +\S+/m.test(b.body)));
  }
  if (step >= 8) {
    check('Usage provides instructions and a shell command', nonempty('Usage') && command('Usage'));
    check('Expected output describes the result and includes a text example', nonempty('Expected output') &&
      parse(section(readmeText, 'Expected output')).blocks.some(b => b.language === 'text' && b.body.trim()));
    const table = section(readme.prose, 'Project files');
    check('Project files includes a table with a header, separator and two data rows',
      /^\|.+\|\s*\n\|\s*:?-{3,}:?\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*\n\|.+\|\s*\n\|.+\|/m.test(table));
  }
  if (step >= 9) {
    check('Contributing explains the process and mentions a pull request', nonempty('Contributing') && /pull request/i.test(section(readme.prose, 'Contributing')));
    check('Support explains where to ask for help with a descriptive link', nonempty('Support') && /\[[^\]]{3,}\]\(https:\/\/[^)]+\)/.test(section(readme.prose, 'Support')));
    check('License identifies MIT and links to the repository license', /\bMIT\b/.test(section(readme.prose, 'License')) && /\[[^\]]+\]\(\.\.\/LICENSE\)/.test(section(readme.prose, 'License')));
  }
  if (step >= 10) {
    check('Troubleshooting explains at least one problem and its solution', nonempty('Troubleshooting'));
    check('Review checklist contains at least four completed tasks and no unfinished tasks',
      (section(readme.prose, 'Review checklist').match(/^\s*[-*+] +\[[xX]\] +\S/gm) || []).length >= 4 && !/^\s*[-*+] +\[ \]/m.test(section(readme.prose, 'Review checklist')));
    check('All README code fences are closed', readme.closed);
    check('README contains no TODO, TBD, example.com or replacement placeholders', !/\b(TODO|TBD)\b|example\.com|YOUR[-_ ](?:NAME|USER(?:NAME)?|REPO(?:SITORY)?)|<replace[^>]*>/i.test(readmeText));
    const links = [...readme.prose.matchAll(/!?\[([^\]]*)\]\(([^)\s]+)\)/g)];
    const headings = [...readme.prose.matchAll(/^#{1,6} +(.+)$/gm)].map(m => m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-'));
    const broken = links.filter(([, label, target]) => {
      if (!label.trim()) return true;
      if (/^https?:\/\//.test(target) || /^mailto:/.test(target)) return false;
      if (target.startsWith('#')) return !headings.includes(target.slice(1));
      let decoded;
      try { decoded = decodeURIComponent(target.split('#')[0]); } catch { return true; }
      const local = path.resolve(root, 'project-guide', decoded);
      const relative = path.relative(path.resolve(root), local);
      return relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(local);
    });
    check('README links have descriptive labels and existing local targets', links.length > 0 && broken.length === 0);
    check('HTML images in README have nonempty alternative text', [...readme.prose.matchAll(/<img\b[^>]*>/gi)].every(m => /\balt=["'][^"']+["']/i.test(m[0])));
  }
  return results;
}

if (require.main === module) {
  const [stepArg, root = '.', feedback = 'step-results.md'] = process.argv.slice(2);
  const step = Number(stepArg);
  if (!Number.isInteger(step) || step < 1 || step > 10) throw new Error('Step must be 1 through 10');
  const results = evaluate(step, root);
  const passed = results.every(r => r.passed);
  const report = `## Step ${step}: ${passed ? 'Passed' : 'Keep going'}\n\n| Check | Result |\n| --- | --- |\n${results.map(r => `| ${r.description} | ${r.passed ? '✅' : '❌'} |`).join('\n')}\n\n${passed ? 'All checks passed. Preparing your next step.' : 'Fix the marked items, preview your Markdown, then commit to `start-blog` again. Your next lesson unlocks only when every check passes.'}\n`;
  fs.writeFileSync(feedback, report);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  console.log(report);
  process.exitCode = passed ? 0 : 1;
}

module.exports = { parse, section, evaluate };
