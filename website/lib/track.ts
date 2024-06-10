type Events = CopyEvent;

interface CopyEvent {
  name: "copy";
  data: {
    flags: string[];
    package_manager: string;
  };
}

interface Zaraz {
  track: <T extends Events>(event: T["name"], data: T["data"]) => Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var zaraz: Zaraz | undefined;
}

export function track<T extends Events>(event: T["name"], data: T["data"]) {
  console.log({
    event,
    data,
  });
  globalThis.zaraz?.track(event, data);
}
