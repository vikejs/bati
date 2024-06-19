type Events = CopyEvent;

interface CopyEvent {
  name: "copy";
  data: {
    flags: string[];
    package_manager: string;
  };
}

interface Zaraz {
  track: <T extends Events>(event: T["name"], data: unknown) => Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var zaraz: Zaraz | undefined;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function track<T extends Events>(event: T["name"], data: T["data"]) {
  const interactionId = generateUUID();
  console.log({
    interactionId,
    event,
    data,
  });
  switch (event) {
    case "copy": {
      if (data.flags.length === 0) {
        globalThis.zaraz?.track(event, {
          flag: undefined,
          package_manager: data.package_manager,
          interaction_id: interactionId,
        });
      }
      for (const flag of data.flags) {
        globalThis.zaraz?.track(event, {
          flag,
          package_manager: data.package_manager,
          interaction_id: interactionId,
        });
      }
    }
  }
}
