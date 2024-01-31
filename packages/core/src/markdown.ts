function h1(text: string): string {
  return `# ${text}`;
}

function h2(text: string): string {
  return `## ${text}`;
}

function h3(text: string): string {
  return `### ${text}`;
}

function bold(text: string): string {
  return `**${text}**`;
}

function italic(text: string): string {
  return `*${text}*`;
}

function link(href: string, text?: string): string {
  return text ? `[${text}](${href})` : `<${href}>`;
}

function tick(text: string): string {
  return `\`${text}\``;
}

function code(text: string, lang?: string): string {
  return `\`\`\`${lang ?? ""}\n${text}\n\`\`\``;
}

enum Cursor {
  Intro,
  Todo,
  About,
}

const headers = ["", "# To-Do", "# About this app"];

function parseReadme(text: string | undefined) {
  const nbHeaders = headers.length;
  const lines = (text ?? "").split("\n");
  let cursor = Cursor.Intro;
  const contents = ["", "", ""];

  for (const line of lines) {
    if (cursor < nbHeaders - 1 && line.startsWith(headers[(cursor + 1) as Cursor])) {
      cursor += 1;
      continue;
    }

    contents[cursor] += line + "\n";
  }

  return new Readme(contents);
}

class Readme {
  private contents: string[];

  constructor(contents: string[]) {
    this.contents = contents;
  }

  addIntro(content: string) {
    this.contents[Cursor.Intro] += content;
  }

  addTodo(content: string) {
    this.contents[Cursor.Todo] += content;
  }

  addAbout(content: string) {
    this.contents[Cursor.About] += content;
  }

  finalize() {
    let ret = "";

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim();
      const content = this.contents[i].trim();

      if (header && content) {
        ret += header + "\n";
      }

      if (content) {
        ret += content + "\n\n";
      }
    }

    return ret;
  }
}

const markdown = {
  h1,
  h2,
  h3,
  link,
  tick,
  code,
  bold,
  italic,
};

export { markdown, parseReadme, Readme };
