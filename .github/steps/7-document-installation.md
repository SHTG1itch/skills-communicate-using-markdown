## Step 7: Make setup reproducible

Setup instructions should begin with what the reader needs and end with a way to know setup worked. Explain tools, versions when relevant, access requirements, commands in order, and the directory in which to run them. Never publish passwords, tokens, or private connection strings.

This journal is a Markdown document: there is no package to install or server to start. Viewing it on GitHub needs a browser. A local copy needs Git and a text editor. Explain this distinction so readers do not search for a nonexistent application.

### Example setup

````md
## Prerequisites

Use a web browser to read the journal on GitHub. For a local copy, install Git and a text editor. A GitHub account with repository access is required to contribute.

## Installation

Run these commands in a terminal to download this repository, then enter its folder:

```bash
git clone https://github.com/YOUR-USERNAME/skills-communicate-using-markdown.git
cd skills-communicate-using-markdown
```

Open `day-1.md` in your editor to confirm the journal is present. No build or dependency installation is required.
````

### :keyboard: Activity: Write setup instructions

1. Edit **project-guide/README.md** on **start-blog**, keeping all earlier sections.
1. Add **Prerequisites** with at least eight words describing the tools and access needed.
1. Fill **Installation** with an explanation (at least eight words) and a fenced `bash`, `sh`, `shell`, `powershell`, or `console` block containing `git clone` and `cd` commands on separate lines.
1. Copy your repository's actual HTTPS clone URL from **Code**. Replace `YOUR-USERNAME` and adjust the folder name if needed. Do not clone the upstream course by accident.
1. Until the final merge, your journal exists on `start-blog`. You can use `git clone --branch start-blog <your-repository-url>` while practicing; before merging, update the instructions to clone the default branch normally.
1. Explain how to verify setup by finding `day-1.md`. Try your instructions in a fresh folder if possible.
1. Add a Prerequisites link to your Contents, preview, and commit to **start-blog**. Wait for Step 8 in this issue.

In a software project, also document runtime versions, dependency installation, required environment variables with safe example values, and a verification command. Only include requirements that your project actually has.
