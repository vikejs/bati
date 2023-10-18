export const code = `<template>
  <div>{{ a ? 'A' : 'B' }}</div>
  <div>{{ import.meta.BATI_MODULES?.includes("authjs") ? 'A' : 'B' }}</div>
  <!-- !import.meta.BATI_MODULES?.includes("guy1") -->
  <div>Guy 1</div>
  <!-- import.meta.BATI_MODULES?.includes("guy2") -->
  <div>Guy 2</div>
</template>

<script>
//# import.meta.BATI_MODULES?.includes("authjs")
console.log('COMMENTS');

//# import.meta.BATI_MODULES?.includes("guy")
console.log('NOCOMMENTS');

if (import.meta.BATI_MODULES?.includes("authjs"))
  console.log('AAA');

if (import.meta.BATI_MODULES?.includes("authjs")) {
  console.log('BBB');
}

if (import.meta.BATI_MODULES?.includes("guy")) {
  console.log('This is syntax error');
} else {
  console.log('Guy');
}

if (import.meta.BATI_MODULES?.includes("guy")) {
  console.log('This is syntax error');
} else
  console.log('Guy2');

if (import.meta.BATI_MODULES?.includes("guy")) {
  console.log('Guy 3');
}

const a = import.meta.BATI_MODULES?.includes("guy") ? 'A' : 'B';
</script>
`;
