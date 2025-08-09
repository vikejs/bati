import { createResource, onMount, Show } from "solid-js";

export interface ShieldResponse {
  label: string;
  message: string;
  color: string;
  name: string;
  value: string;
}

async function getShieldJson(repo: string) {
  const response = await fetch(`https://img.shields.io/github/commit-activity/y/${repo}.json`);
  const data: ShieldResponse = await response.json();

  return data;
}

export function ShieldBadge(props: { repo?: string }) {
  if (!props.repo) {
    return;
  }

  const [data, { refetch }] = createResource(props.repo, getShieldJson, {
    ssrLoadFrom: "initial",
  });

  onMount(refetch);

  return (
    <Show when={data()}>
      {(data) => (
        <span class="font-mono text-xs opacity-90">
          <span class="border-l border-solid border-primary py-0.5 px-1 rounded-l-md">{data().label}</span>
          <span class="border-r border-solid border-primary underline decoration-primary py-0.5 px-1 rounded-r-md">
            {data().message}
          </span>
        </span>
      )}
    </Show>
  );
}
