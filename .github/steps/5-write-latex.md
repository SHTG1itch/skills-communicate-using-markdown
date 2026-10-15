## Step 5: Explain a result with LaTeX

Technical READMEs sometimes need an equation, for example a success rate or algorithm cost. GitHub supports LaTeX-style mathematical expressions through MathJax. It does not compile a full LaTeX document: commands such as `\documentclass` do not belong in Markdown.

### Inline and display math

Use `$...$` inside a sentence. Use `$$` on separate lines for a display equation, or a fenced block with the language `math`. Ordinary `latex` code fences show source code instead of rendering math.

```md
After day $d_1$, I completed $c^2$ practice tasks.

$$
p = \frac{c}{t} \times 100
$$
```

`_` introduces a subscript, `^` introduces a superscript, and braces group several characters: `x^{10}`. `\frac{numerator}{denominator}` writes a fraction. Use math only when it helps the reader, and explain variables in plain language.

### :keyboard: Activity: Record your progress

1. Edit `day-1.md` on **start-blog**. Keep your previous work.
1. Add a level two heading named **Learning metrics**.
1. Under it, write a sentence containing inline math with a subscript or superscript, such as `$d_1$`.
1. Add a display equation containing `\frac{c}{t}` using `$$` or a `math` code fence. For example, calculate the percentage of practice tasks completed.
1. Explain what `c`, `t`, and `p` represent and give an example result in words (at least eight words). Avoid dividing by zero.
1. Preview the file on GitHub. Confirm that both expressions render and that the explanation makes sense without seeing the equation.
1. Commit to **start-blog** and return to this issue for feedback. Fix any failed checks and commit again; wait for Step 6 before continuing.

<details>
<summary>Having trouble? 🤷</summary>

- Do not put your inline expression inside backticks or an ordinary code block.
- Balance dollar signs and braces. Place `$$` on its own opening and closing lines.
- GitHub's [math guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) explains supported delimiters and literal dollar signs.

</details>
