import logoUrl from "#assets/logo.svg";

export function Logo(props: { size: number; class?: string }) {
  return (
    <img
      alt="Bati logo"
      src={logoUrl}
      height={props.size}
      width={props.size}
      class={props.class}
    />
  );
}
