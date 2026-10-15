# Markdown and README course

This repository extends the GitHub Skills Markdown exercise into eleven steps. Students practice basic formatting, explain progress with LaTeX, and write a README that another person can follow.

## Lessons and submissions

All work is committed to **start-blog**. Students wait for feedback in the exercise issue before beginning the next step.

| Step | Topic | Submission |
| --- | --- | --- |
| 1 | Headings | `day-1.md` |
| 2 | Task lists | `day-1.md` |
| 3 | Code samples | `day-1.md` |
| 4 | Images and alternative text | `day-1.md` |
| 5 | Inline and display LaTeX | `day-1.md` |
| 6 | README purpose, audience, structure, and navigation | `project-guide/README.md` |
| 7 | Prerequisites and reproducible setup | `project-guide/README.md` |
| 8 | Usage, expected output, file tables, and relative links | `project-guide/README.md` |
| 9 | Contributing, support, and licensing | `project-guide/README.md` |
| 10 | Troubleshooting and documentation review | `project-guide/README.md` |
| 11 | Pull request review and merge | `start-blog` into `main` |

The README documents the student's real Markdown Learning Journal, rather than a hypothetical application. The root README is owned by the exercise toolkit, which replaces it on start and finish. `COURSE.md` and the student's README survive those updates.

## Workflow behavior

The existing exercise-toolkit v0.6.0 flow is retained: Step 0 opens an issue, posts Step 1, disables numbered workflows, and enables the first lesson. Each passing step posts the next lesson, enables its workflow, and disables itself. Failed submissions get a check-by-check feedback table and must be corrected and committed again.

Steps 1–10 listen for changes to the journal or project README on `start-blog`. A shared active-lesson check reads the latest lesson posted by `github-actions[bot]`, ignoring result tables and learner comments. The lesson must already have been posted when the workflow run was created, so queued runs cannot consume newly unlocked lessons. This also prevents newly introduced workflows from grading the wrong lesson when updating an existing course. Checks are cumulative: deleting earlier work fails later submissions.

Course tooling and lesson templates are read from the default branch. Student Markdown is checked out separately at the submitted commit; the validator reads it as text and never runs submitted commands. Keep course changes on the default branch and bring them into the student's branch before continuing an existing exercise.

Step 11 validates the current pull request on open, synchronize, and reopen, then validates the merged commit before posting the review and finishing the exercise. A closed, unmerged pull request does not complete the course. For enforced pre-merge checks, configure branch protection to require **Validate final submission**; workflow code does not configure repository rules.

GitHub Actions must be enabled, with permission for `GITHUB_TOKEN` to write contents, issues, and workflow state as used by the original toolkit. Organization policies may restrict these permissions. Learners should wait for the next lesson before committing more work; GitHub only delivers push events to enabled workflows.

## Updating an exercise already in progress

These changes do not reset the existing issue or student files. Deploy the course changes to `main`, and merge `main` into `start-blog` before the next submission.

- If the issue is on Steps 1–4, continue with that step. Step 4 now unlocks LaTeX instead of the old merge step.
- If the issue already displays the old **Step 5: Finish work**, replace that bot lesson comment's body with `.github/steps/5-write-latex.md` and enable **Step 5** in Actions. Disable the obsolete `5-merge-your-pull-request.yml` workflow if GitHub still lists it after the rename. Continue on `start-blog` without merging early.
- For an already completed course, use a fresh template copy to run the full sequence. Step 0 intentionally disables itself after initialization; pushing these changes does not restart it.

The course retains the original `main` / `start-blog` convention. A differently named default branch requires updating Step 0, Step 11, and lesson instructions together.

## Local verification

Use Node.js 24 (the standard Node.js libraries are sufficient):

```bash
node --test .github/scripts/check-step.test.cjs
node .github/scripts/check-step.cjs 10 /path/to/student-checkout /path/to/feedback.md
```

The validator exits nonzero on failure and writes a Markdown feedback table. On Actions it also writes to the job summary. No package installation is required for the validator.

The **Course tests** workflow runs these tests on GitHub and validates all workflow files with actionlint 1.7.12, downloaded from its official release and verified against its SHA-256 checksum. It can also be run manually from Actions.

Checks intentionally use a small subset of Markdown: ATX headings, fenced code blocks, inline Markdown links, and pipe tables as taught in the lessons. They do not render MathJax, fetch external links, or assess prose quality. Section checks require at least eight words to encourage explanations, but a reviewer must still assess accuracy. LaTeX checks verify the taught delimiters and fraction syntax, not arbitrary TeX correctness. Human review should verify setup, output, external links, image descriptions, and honest feature claims.
