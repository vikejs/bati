import { NavLink } from "@mantine/core";
import { usePageContext } from "vike-react/usePageContext";

export function Link({ href, label }: { href: string; label: string }) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const isActive = href === "/" ? urlPathname === href : urlPathname.startsWith(href);
  return <NavLink href={href} label={label} active={isActive} />;
}
