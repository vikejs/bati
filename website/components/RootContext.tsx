import { type Accessor, createContext, createSignal, type JSX, onMount, useContext } from "solid-js";
import { isServer } from "solid-js/web";

export const RootContext = createContext<Accessor<Document | ShadowRoot | undefined>>();

export function RootProvider(props: { children: JSX.Element }) {
  let elementRef;

  // Get the root once mounted
  onMount(() => {
    if (elementRef) {
      const root = getElementRoot(elementRef);
      setRoot(root);
    }
  });

  const [root, setRoot] = createSignal<Document | ShadowRoot | undefined>(isServer ? undefined : document);

  return (
    <RootContext.Provider value={root}>
      <div ref={elementRef} style={{ display: "contents" }}>
        {props.children}
      </div>
    </RootContext.Provider>
  );
}

export function useRootContext() {
  return useContext(RootContext);
}

function getElementRoot(element: Element) {
  // Walk up the parent chain to find if we're in a shadow root
  let parent: ParentNode | null = element;
  while (parent) {
    if (parent instanceof ShadowRoot) {
      return parent;
    }
    parent = parent.parentNode;
    if (!parent || parent === document) {
      break;
    }
  }
  return document;
}
