### Syntax

Bati uses specific syntaxes to generate its boilerplates.
The global idea is to have templating as code, making it is easy to write and maintain templates.

<table>
<tr>
<th>Snippet</th>
<th>if true, compiles to</th>
<th>if false, compiles to</th>
</tr>
<tr>
<td colspan="3">
<center>
.js,.jsx,.ts,.tsx,.vue script
</center>
</td>
</tr>
<tr>
<td>

```ts
if (BATI.has("feature")) {
  console.log("A");
} else {
  console.log("B");
}

// also works with elseif
```


</td>
<td>

```ts
console.log("A");
```

</td>
<td>

```ts
console.log("B");
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```ts
const myvar = BATI.has("feature") ?
  "A" : "B";
```

</td>
<td>

```ts
const myvar = "a";
```

</td>
<td>

```ts
const myvar = "B";
```

</td>
</tr>
<tr></tr>
<tr>
<td>

```ts
// BATI.has("feature")
import "./mycss";
```

</td>
<td>

```ts
import "./mycss";
```

</td>
<td>

nothing

</td>
</tr>
<tr>
<tr>
<td>

```ts
/*# BATI include-if-imported #*/

const a = 1;
```

</td>
<td>
true if the file is at least imported by any other generated file

```ts
const a = 1;
```

</td>
<td>

nothing

</td>
</tr>
<tr>
<td colspan="3">
<center>
.jsx,.tsx
</center>
</td>
</tr>
<tr>
<td>

```tsx
const Component = () => {
  return (
    <div
      // BATI.has("feature")
      class="p-5"
      // !BATI.has("feature")
      style={{
        padding: "20px",
      }}
    >
      {props.children}
    </div>
  );
};
```

</td>
<td>

```tsx
const Component = () => {
  return (
    <div
      class="p-5"
    >
      {props.children}
    </div>
  );
};
```

</td>
<td>

```tsx
const Component = () => {
  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      {props.children}
    </div>
  );
};
```

</td>
</tr>
<tr>
<td colspan="3">
<center>
.jsx,.tsx,.vue template
</center>
</td>
</tr>
<tr>
<td>

```html
<div>
  <!-- BATI.has("feature") -->
  <div>
    <span>my text</span>
  </div>
  <span>my other text</span>
</div>
```

</td>
<td>

```html
<div>
  <div>
    <span>my text</span>
  </div>
  <span>my other text</span>
</div>
```

</td>
<td>

```html
<div>
  <span>my other text</span>
</div>
```

</td>
</tr>
<tr>
<td colspan="3">
<center>
any extension
</center>
</td>
</tr>
<tr>
<td>

```css
/*{ @if (it.BATI.has("feature")) }*/
@import "./feature.css";
/*{ /if }*/
```

We use [SquirellyJS](https://squirrelly.js.org/docs/syntax/overview) with a custom `/*{ ... }*/` tag

</td>
<td>

```css
@import "./feature.css";
```

</td>
<td>

nothing

</td>
</tr>
</table>

#### Details

- `BATI` is a global var available at compile time. It is also defined in typings so that it is considered valid in your IDE
- After compilation, any unused imports are removed
- After compilation, code is formatted with prettier
