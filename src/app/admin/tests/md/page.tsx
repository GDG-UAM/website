"use client";

import React from "react";
import { RenderMarkdown } from "@/components/markdown/RenderMarkdown";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

const baseText = `# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading


## Horizontal Rules

___

---

***


## Typographic replacements

Enable typographer option to see result.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'


## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~


## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.


## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar


## Code

Inline \`code\`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

\`\`\` txt
Sample text here...
\`\`\`

Syntax highlighting

\`\`\` js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
\`\`\`

## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


## Links

[link text](http://dev.nodeca.com)

[link with title](http://nodeca.github.io/pica/demo/ "title text!")

Autoconverted link https://github.com/nodeca/pica (enable linkify to see)


## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

Like links, Images also have a footnote style syntax

![Alt text][id]

With a reference later in the document defining the URL location:

[id]: https://octodex.github.com/images/dojocat.jpg  "The Dojocat"


### [Subscript](https://github.com/markdown-it/markdown-it-sub) / [Superscript](https://github.com/markdown-it/markdown-it-sup)

- 19^th^
- H~2~O



### [\<mark>](https://github.com/markdown-it/markdown-it-mark)

==Marked text==


### [Footnotes](https://github.com/markdown-it/markdown-it-footnote)

Footnote 1 link[^first].

Footnote 2 link[^second].

Duplicated footnote reference[^second].

[^first]: Footnote **can have markup**

    and multiple paragraphs.

[^second]: Footnote text.


:::tip Optional title
You can use regular markdown inside:
- bold: **text**
- code: \`inline\`
:::

:::warning
This is a warning without a title.
:::
`;

export default function AdminMarkdownTestPage() {
  const [text, setText] = React.useState<string>(baseText);
  const [html, setHtml] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [pending, setPending] = React.useState(false);

  const render = React.useCallback(async (md: string) => {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/markdown", {
        method: "POST",
        headers: await withCsrfHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ text: md })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHtml(String(data.html || ""));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e ?? ""));
    } finally {
      setPending(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => render(text), 250);
    return () => clearTimeout(t);
  }, [text, render]);

  return (
    <div style={{ padding: 24, width: "100%" }}>
      <AdminBreadcrumbs
        items={[{ label: "Admin", href: "/admin" }, { label: "Tests" }, { label: "Markdown" }]}
      />
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: 0,
          minHeight: "calc(100vh - 128px)",
          boxSizing: "border-box"
        }}
      >
        <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label htmlFor="md-input" style={{ fontWeight: 600, marginBottom: 8 }}>
            Markdown
          </label>
          <textarea
            id="md-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              width: "100%",
              resize: "vertical",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 14,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 6
            }}
            placeholder="# Hello"
          />
        </section>
        <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <strong>Preview</strong>
            {pending && <span style={{ color: "#888", fontSize: 12 }}>(rendering...)</span>}
            {error && <span style={{ color: "#c00", fontSize: 12 }}>(error: {error})</span>}
          </div>
          <RenderMarkdown
            html={html}
            style={{
              flex: 1,
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 12,
              overflow: "auto"
            }}
          />
        </section>
      </div>
    </div>
  );
}
