## Step 10: Review your README like a teammate

A checklist is useful only if you perform the checks. Read your README as if you have never seen the project. Can you explain its purpose, follow setup, use it, find help, and understand its license?

Automated checks catch missing sections, unfinished examples, unclosed code fences, and broken local link targets. They cannot judge whether instructions are true, test remote websites, compile arbitrary LaTeX, or replace a human review of accessibility and clarity.

### :keyboard: Activity: Perform a documentation review

1. Edit **project-guide/README.md** on **start-blog** and retain every earlier section.
1. Add **Troubleshooting** with a concrete problem and solution (at least eight words). For example, explain how to fix `cat: day-1.md: No such file or directory` by entering the cloned repository folder and checking that the journal exists on the selected branch.
1. Remove all `TODO`, `TBD`, `YOUR-USERNAME`, `YOUR-REPO`, and `example.com` placeholders. Use your actual repository URL and facts.
1. Check all Contents anchors and local file links. Remember this README lives one directory below the root. Prefer simple Markdown links for this exercise.
1. Check heading order, code fence closure and language labels. Give every image useful alternative text. Use meaningful link labels rather than "click here".
1. Confirm commands and sample output match the project. Prepare clone instructions for the default branch after the final merge; remove any temporary `--branch start-blog` option. Do not claim unsupported features or add decorative badges with no real status behind them.
1. Add **Review checklist** and mark each task complete **after doing it**:

   ```md
   ## Review checklist

   - [x] Confirmed the purpose, audience, and feature descriptions are accurate.
   - [x] Followed setup and usage instructions and compared the result.
   - [x] Tested Contents and file links and checked image alternative text.
   - [x] Verified contribution, support, and license information.
   ```

1. Include at least four completed tasks and no incomplete tasks in Review checklist. Add Troubleshooting and Review checklist to Contents.
1. Preview the whole README on GitHub. If possible, ask a peer to follow it without help.
1. Commit to **start-blog**. Fix any failed checks and commit again. Wait for Step 11 before merging.

Passing the checks means the required structure is present. Your manual review makes the result useful to a real teammate.
