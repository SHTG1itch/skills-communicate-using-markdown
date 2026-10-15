## Step 8: Show usage and expected results

Readers need a small example they can follow and a clear description of success. Keep commands copyable and put output in a separate block. Do not include a terminal prompt such as `$` in a command the reader should paste.

Tables are useful for related facts; they should not replace step-by-step instructions. Relative links are resolved from the README's folder, so this README needs `../day-1.md` to reach the journal.

### Example usage

````md
## Usage

From the repository folder, display the journal in a terminal with this command. On Windows PowerShell, use `Get-Content day-1.md` instead.

```bash
cat day-1.md
```

For formatted reading, open [the journal](../day-1.md) on GitHub and select Preview when editing. Check or uncheck tasks by editing their Markdown and committing your changes.

## Expected output

The terminal displays the source Markdown. Your title may differ from this shortened example:

```text
# Daily Learning

## Morning Planning
```

On GitHub, the same headings appear at different sizes and task markers become checkboxes.

## Project files

| File | Purpose |
| --- | --- |
| [Journal](../day-1.md) | Daily plans, code samples, and learning metrics |
| [Project README](README.md) | Setup and usage instructions |
````

### :keyboard: Activity: Help someone use your project

1. Edit **project-guide/README.md** on **start-blog**.
1. Fill **Usage** with at least eight words, a shell code block, and a practical walkthrough of reading or editing the journal. Include the working directory and any platform differences.
1. Add **Expected output** with at least eight words and a separate `text` code fence. Match the example to your own journal, and explain source Markdown versus rendered Markdown.
1. Add **Project files** with a Markdown table: a header, separator, and at least two file rows. Use descriptive relative links.
1. Add your new sections to Contents, preview the table, and click every local link.
1. Try the command, then commit to **start-blog**. Wait for Step 9.

For a software README, use the same pattern for a minimal successful command or API request and its expected result, then document options and common errors.
